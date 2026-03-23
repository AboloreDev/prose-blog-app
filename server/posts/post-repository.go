package posts

import (
	"database/sql"
	"errors"
	"math"
	"strings"
)

var ErrNoRowsAvailable = errors.New("No rows available")
var ErrDuplicatePostTitle = errors.New("Duplicate Post Title")
var ErrInvalidPageRange = errors.New("invalid page range: 1 to 100 max")


func (f *Filter) Validate() error {
	if f.PageSize <= 0 || f.PageSize >= 100 {
		return ErrInvalidPageRange
	}
	return nil
}

func calculateMetaData(totalRecords, page, pageSize int) MetaData {
	meta := MetaData{
		CurrentPage:  page,
		PageSize:     pageSize,
		FirstPage:    1,
		LastPage:     int(math.Ceil(float64(totalRecords) / float64(pageSize))),
		TotalRecords: totalRecords,
	}
	meta.NextPage = meta.CurrentPage + 1
	meta.PreviousPage = meta.CurrentPage - 1
	if meta.CurrentPage <= meta.FirstPage {
		meta.PreviousPage = 0
	}
	if meta.CurrentPage >= meta.LastPage {
    meta.NextPage = 0
	}

	return meta
}

type PostRepository interface {
	CreatePost(userId int, title string, body string, communityId int, status string) (int, error)
	GetPostById(id int) (*PostDetails, error)
	GetAllPost(filter Filter) ([]PostDetails, MetaData, error)
	GetPostByCommunity(communityId int, filter Filter) ([]PostDetails, MetaData, error)
	GetUserPosts(userId int, filter Filter) ([]PostDetails, MetaData, error)
	DeletePost(id int) error
	UpdatePost(post *Post) error
	GetUserPostDrafts(userId int, filter Filter) ([]PostDetails, MetaData, error)
	GetUserScheduledPosts(userId int, filter Filter) ([]PostDetails, MetaData, error)
	PublishPost(postID int) error
}

type SQLPostRepository struct{
	db *sql.DB
}

func NewSQLPostRepository(db *sql.DB) PostRepository {
	return &SQLPostRepository{
		db: db,
	}
}

func (r *SQLPostRepository) CreatePost(userId int, title string, body string, communityId int, status string) (int, error) {
	statement := `
		INSERT INTO posts (user_id, title, body, community_id, status) 
		VALUES (?, ?, ?, ?, ?)
	`

	result, err := r.db.Exec(statement, userId, title, body, communityId, status)
	if err != nil {
		return 0, err
	}

	postId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(postId), nil
}

func (r *SQLPostRepository) GetPostById(id int) (*PostDetails, error) {
	queryStatement := `
		SELECT p.id, p.user_id, p.community_id, p.title, p.body, 
		p.status, p.view_count, p.created_at, p.updated_at,
		u.username AS author,
		c.name AS community_name,
		COUNT(DISTINCT v.user_id) AS votes_count,
		COUNT(DISTINCT cm.id) AS comment_count
		FROM posts p 
		INNER JOIN users AS u ON p.user_id = u.id
		INNER JOIN communities AS c ON p.community_id = c.id
		LEFT JOIN votes AS v ON p.id = v.post_id
		LEFT JOIN comments AS cm ON p.id = cm.post_id
		WHERE p.id = ?
		GROUP BY p.id
	`
	rows := r.db.QueryRow(queryStatement, id)

	var postDetails PostDetails
	err := rows.Scan(
		&postDetails.ID,
		&postDetails.UserID, 
		&postDetails.CommunityID,
		&postDetails.Title,
		&postDetails.Body,
		&postDetails.Status,
		&postDetails.ViewCount,
		&postDetails.CreatedAt,
		&postDetails.UpdatedAt,
		&postDetails.Author,
		&postDetails.CommunityName,
		&postDetails.VotesCount,
		&postDetails.CommentCount,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsAvailable
		}
		return nil, err
	}

	return &postDetails, nil
}

func (r *SQLPostRepository) GetAllPost(filter Filter) ([]PostDetails, MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, MetaData{}, err
	}

	queryStatement := `
	SELECT COUNT(*) OVER() AS total_records,
	p.id, p.user_id, p.title, p.body, p.created_at, p.view_count
	u.username AS author, com.name AS community_name
	COUNT(DISTINCT v.user_id) AS vote_count,
	COUNT(DISTINCT c.id) AS comment_count
	FROM posts AS p
	INNER JOIN users AS u ON p.user_id = u.id
	INNER JOIN communities AS com ON p.community_id = com.id
	LEFT JOIN votes AS v ON p.id = v.post_id
	LEFT JOIN comments AS c ON p.id = c.post_id
	WHERE p.status = 'published'
	`

	var args []interface{}

	if filter.Query != ""{
		queryStatement += " AND LOWER(p.title) LIKE ?"
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
	}

	queryStatement += " GROUP BY p.id"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, p.created_at DESC"
	}else {
		queryStatement+= " ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	limit := filter.PageSize
	queryStatement += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(queryStatement, args...)
	if err != nil {
		return nil, MetaData{}, err
	}
	defer rows.Close()

	var posts []PostDetails
	var totalRecords int
	for rows.Next() {
		var post PostDetails
		err := rows.Scan(
			&totalRecords, &post.ID, &post.UserID, &post.Title, &post.Body, &post.CreatedAt, 
			&post.ViewCount, &post.Author, &post.CommunityName, &post.VotesCount, &post.CommentCount)
		if err != nil {
			return nil, MetaData{}, err
		}
		post.TotalRecords = totalRecords
		posts = append(posts, post)
	}
	err = rows.Err()
	if err != nil {
    return nil, MetaData{}, err
	}

	if len(posts) == 0 {
		return []PostDetails{}, MetaData{}, nil
	}

	meta := calculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil
}

func (r *SQLPostRepository) GetPostByCommunity(communityId int, filter Filter) ([]PostDetails, MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		p.id, p.title, p.user_id, p.community_id, p.body, 
		p.view_count, p.created_at,
		u.username AS author, cm.name AS community_name,
		COUNT(DISTINCT v.user_id) AS vote_count,
		COUNT(DISTINCT c.id) AS comment_count
		FROM posts AS p
		INNER JOIN users AS u ON p.user_id = u.id
		INNER JOIN communities AS cm ON p.community_id = cm.id
		LEFT JOIN votes AS v ON p.id = v.post_id
		LEFT JOIN comments AS c ON p.id = c.post_id
		WHERE cm.id = ? AND p.status = 'published'
	`

	var args []interface{}

	args = append(args, communityId)

	if filter.Query != ""{
		queryStatement += " AND LOWER(p.title) LIKE ?"
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
	}

	queryStatement += " GROUP BY p.id"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, p.created_at DESC"
	}else {
		queryStatement+= " ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	limit := filter.PageSize
	queryStatement += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(queryStatement, args...)
	if err != nil {
    return nil, MetaData{}, err
	}
	defer rows.Close()
	var totalRecords int
	var posts []PostDetails 
	for rows.Next() {
		var post PostDetails
		err = rows.Scan(
			&totalRecords, &post.ID, &post.Title, &post.UserID, &post.CommunityID, &post.Body,
			&post.ViewCount, &post.CreatedAt, &post.Author, &post.CommunityName, &post.VotesCount,
			&post.CommentCount,
		)
		if err != nil {
			return nil, MetaData{}, err
		}
		post.TotalRecords = totalRecords
		posts = append(posts, post)
		
	}
	err = rows.Err()
	if err != nil {
    return nil, MetaData{}, err
	}
	if len(posts) == 0 {
		return []PostDetails{}, MetaData{}, nil
	}
	meta := calculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil
}

func (r *SQLPostRepository) GetUserPosts(userId int, filter Filter) ([]PostDetails, MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		p.id, p.user_id, p.community_id, p.title, p.body, p.view_count,
		p.created_at, u.username AS author, cm.name AS community_name
		COUNT(DISTINCT v.user_id) AS votes_count,
		COUNT(DISTINCT c.id) AS comments_count
		FROM posts p 
		INNER JOIN users AS u ON p.user_id = u.id
		INNER JOIN communities AS cm ON p.community_id = cm.id
		LEFT JOIN votes AS v ON p.id = v.post_id
		LEFT JOIN comments AS c ON p.id = c.post_id
		WHERE u.id = ? AND p.status = 'published'
	`

	var args []interface{}
	args = append(args, userId)

	if filter.Query != ""{
		queryStatement += " AND LOWER(p.title) LIKE ?"
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
	}

	queryStatement += " GROUP BY p.id"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, p.created_at DESC"
	}else {
		queryStatement+= " ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	limit := filter.PageSize
	queryStatement += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(queryStatement, args...)
	if err != nil {
    return nil, MetaData{}, err
	}
	defer rows.Close()

	var posts []PostDetails
	var totalRecords int
	for rows.Next() {
		var post PostDetails 
		err = rows.Scan(
			&totalRecords, &post.ID, &post.UserID, &post.CommunityID, &post.Title, &post.Body,
			&post.ViewCount, &post.CreatedAt, &post.Author, &post.CommunityName, &post.VotesCount,
			&post.CommentCount,
		)

		if err != nil {
			return nil, MetaData{}, err
		}
		post.TotalRecords = totalRecords
		posts = append(posts, post)
	}

	err = rows.Err()
	if err != nil {
    return nil, MetaData{}, err
	}
	if len(posts) == 0 {
		return []PostDetails{}, MetaData{}, nil
	}
	meta := calculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil

}

func (r *SQLPostRepository) DeletePost(id int) error {
    statement := `DELETE FROM posts WHERE id = ?`

    result, err := r.db.Exec(statement, id)
    if err != nil {
        return err
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return err
    }

    if rowsAffected == 0 {
        return ErrNoRowsAvailable
    }

    return nil
}

func (r *SQLPostRepository) UpdatePost(post *Post) error {
	queryStatement := `
		UPDATE posts SET title = ?, body = ? WHERE id = ?, updated_at = CURRENT_TIMESTAMP 
	`

	_, err := r.db.Exec(queryStatement, post.Title, post.Body, post.ID)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLPostRepository) GetUserPostDrafts(userId int, filter Filter) ([]PostDetails, MetaData, error) {
	err := filter.Validate() 
	if err != nil {
		return nil, MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		p.id, p.user_id, p.community_id, p.title, p.body, p.created_at, p.status,
		u.username AS author, cm.name AS community_name
		FROM posts AS p
		INNER JOIN users AS u ON p.user_id = u.id
		INNER JOIN communities AS cm ON p.community_id = cm.id
		WHERE p.user_id = ? AND p.status = 'draft'
	`

	var args []interface{}
	args = append(args, userId)

	if filter.Query != ""{
		queryStatement += " AND LOWER(p.title) LIKE ?"
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
	}

	queryStatement += " GROUP BY p.id"

	if filter.OrderBy == "popular" {
		queryStatement += "ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	limit := filter.PageSize
	queryStatement += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(queryStatement, args...)
	if err != nil {
		return nil, MetaData{}, err
	}

	var totalRecords int
	var posts []PostDetails
	for rows.Next() {
		var post PostDetails
		err := rows.Scan(
			&totalRecords, &post.ID, &post.UserID, &post.CommunityID, 
			&post.Title, &post.Body, &post.CreatedAt, &post.Status, &post.Author, &post.CommunityName)

		if err != nil {
			return  nil, MetaData{}, err
		}

		post.TotalRecords = totalRecords
		posts = append(posts, post)
	}

	err = rows.Err()
	if err != nil {
		return nil, MetaData{}, err
	}

	if len(posts) == 0 {
		return []PostDetails{}, MetaData{}, nil
	}

	meta := calculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil
}
func (r *SQLPostRepository) GetUserScheduledPosts(userId int, filter Filter) ([]PostDetails, MetaData, error) {
	err := filter.Validate() 
	if err != nil {
		return nil, MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		p.id, p.user_id, p.community_id, p.title, p.body, p.created_at, p.status,
		u.username AS author, cm.name AS community_name
		FROM posts AS p
		INNER JOIN users AS u ON p.user_id = u.id
		INNER JOIN communities AS cm ON p.community_id = cm.id
		WHERE p.user_id = ? AND p.status = 'scheduled'
	`

	var args []interface{}
	args = append(args, userId)

	if filter.Query != ""{
		queryStatement += " AND LOWER(p.title) LIKE ?"
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
	}

	queryStatement += " GROUP BY p.id"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	limit := filter.PageSize
	queryStatement += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Query(queryStatement, args...)
	if err != nil {
		return nil, MetaData{}, err
	}

	var totalRecords int
	var posts []PostDetails
	for rows.Next() {
		var post PostDetails
		err := rows.Scan(
			&totalRecords, &post.ID, &post.UserID, &post.CommunityID, 
			&post.Title, &post.Body, &post.CreatedAt, &post.Status, &post.Author, &post.CommunityName)

		if err != nil {
			return  nil, MetaData{}, err
		}

		post.TotalRecords = totalRecords
		posts = append(posts, post)
	}

	err = rows.Err()
	if err != nil {
		return nil, MetaData{}, err
	}

	if len(posts) == 0 {
		return []PostDetails{}, MetaData{}, nil
	}

	meta := calculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil
}

func(r *SQLPostRepository) PublishPost(postID int) error {
	queryStatement := `
		UPDATE post SET status = 'published', updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	_, err := r.db.Exec(queryStatement, postID)
	if err != nil {
		return err
	}

	return nil
}
