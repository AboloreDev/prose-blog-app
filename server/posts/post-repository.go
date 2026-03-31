package posts

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"prose-blog/helpers"
	"strings"
	"time"
)

var ErrNoRowsAvailable = errors.New("No rows available")
var ErrDuplicatePostTitle = errors.New("Duplicate Post Title")
var ErrInvalidPageRange = errors.New("invalid page range: 1 to 100 max")


type PostRepository interface {
	CreatePost(userId int, title string, body string, image_url string, communityId int, status string, publishAt *time.Time) (int, error)
	GetPostById(id int) (*PostDetails, error)
	GetAllPost(filter helpers.Filter) ([]PostDetails, helpers.MetaData, error)
	GetPostByCommunity(communityId int, filter helpers.Filter) ([]PostDetails, helpers.MetaData, error)
	GetUserPosts(userId int, filter helpers.Filter) ([]PostDetails, helpers.MetaData, error)
	DeletePost(id int) error
	UpdatePost(post *Post) error
	GetUserPostDrafts(userId int, filter helpers.Filter) ([]PostDetails, helpers.MetaData, error)
	GetUserScheduledPosts(userId int, filter helpers.Filter) ([]PostDetails, helpers.MetaData, error)
	PublishPost(postID int) error
	IncrementViewCount(postId int) error
	GetScheduledPosts() ([]PostDetails, error)
}

type SQLPostRepository struct{
	db *sql.DB
}

func NewSQLPostRepository(db *sql.DB) PostRepository {
	return &SQLPostRepository{
		db: db,
	}
}

func (r *SQLPostRepository) CreatePost(userId int, title string, body string, image_url string, communityId int, status string, publishAt *time.Time) (int, error) {
	statement := `
		INSERT INTO posts (user_id, title, body, image_url, community_id, status, publish_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
	`
	var postId int
	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	
	row := r.db.QueryRowContext(ctx, statement, userId, title, body, image_url, communityId, status, publishAt)

	err := row.Scan(&postId)
	if err != nil {
		return 0, err
	}

	return postId, nil
}

func (r *SQLPostRepository) GetPostById(id int) (*PostDetails, error) {
	queryStatement := `
		SELECT p.id, p.user_id, p.community_id, p.title, p.image_url, p.body, 
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
		WHERE p.id = $1
		GROUP BY p.id, u.username, c.name
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows := r.db.QueryRowContext(ctx, queryStatement, id)

	var postDetails PostDetails
	err := rows.Scan(
		&postDetails.ID,
		&postDetails.UserID, 
		&postDetails.CommunityID,
		&postDetails.Title,
		&postDetails.Image_url,
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

func (r *SQLPostRepository) GetAllPost(filter helpers.Filter) ([]PostDetails, helpers.MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	queryStatement := `
	SELECT COUNT(*) OVER() AS total_records,
	p.id, p.user_id, p.title, p.body, p.created_at, p.image_url, p.view_count,
	u.username AS author, com.name AS community_name,
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
	argPos := 1

	if filter.Query != "" {
		queryStatement += fmt.Sprintf(" AND LOWER(p.title) LIKE $%d", argPos)
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
		argPos++
	}

	queryStatement += " GROUP BY p.id, u.username, com.name"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, p.created_at DESC"
	} else {
		queryStatement += " ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	queryStatement += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, filter.PageSize, offset)

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	
	rows, err := r.db.QueryContext(ctx, queryStatement, args...)
	if err != nil {
		return nil, helpers.MetaData{}, err
	}
	defer rows.Close()

	var posts []PostDetails
	var totalRecords int
	for rows.Next() {
		var post PostDetails
		err := rows.Scan(
			&totalRecords, &post.ID, &post.UserID, &post.Title, &post.Body, &post.CreatedAt, &post.Image_url,
			&post.ViewCount, &post.Author, &post.CommunityName, &post.VotesCount, &post.CommentCount)
		if err != nil {
			return nil, helpers.MetaData{}, err
		}
		post.TotalRecords = totalRecords
		posts = append(posts, post)
	}
	err = rows.Err()
	if err != nil {
    return nil, helpers.MetaData{}, err
	}

	if len(posts) == 0 {
		return []PostDetails{}, helpers.MetaData{}, nil
	}

	meta := helpers.CalculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil
}

func (r *SQLPostRepository) GetPostByCommunity(communityId int, filter helpers.Filter) ([]PostDetails, helpers.MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		p.id, p.title, p.user_id, p.community_id, p.body, 
		p.image_url, p.view_count, p.created_at,
		u.username AS author, cm.name AS community_name,
		COUNT(DISTINCT v.user_id) AS vote_count,
		COUNT(DISTINCT c.id) AS comment_count
		FROM posts AS p
		INNER JOIN users AS u ON p.user_id = u.id
		INNER JOIN communities AS cm ON p.community_id = cm.id
		LEFT JOIN votes AS v ON p.id = v.post_id
		LEFT JOIN comments AS c ON p.id = c.post_id
		WHERE cm.id = $1 AND p.status = 'published'
	`

	var args []interface{}
	args = append(args, communityId)
	argPos := 2

	if filter.Query != "" {
		queryStatement += fmt.Sprintf(" AND LOWER(p.title) LIKE $%d", argPos)
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
		argPos++
	}

	queryStatement += " GROUP BY p.id, u.username, cm.name"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, p.created_at DESC"
	} else {
		queryStatement += " ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	queryStatement += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, filter.PageSize, offset)

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, args...)
	if err != nil {
    return nil, helpers.MetaData{}, err
	}
	defer rows.Close()

	var totalRecords int
	var posts []PostDetails 
	for rows.Next() {
		var post PostDetails
		err = rows.Scan(
			&totalRecords, &post.ID, &post.Title, &post.UserID, &post.CommunityID, &post.Body, &post.Image_url,
			&post.ViewCount, &post.CreatedAt, &post.Author, &post.CommunityName, &post.VotesCount,
			&post.CommentCount,
		)
		if err != nil {
			return nil, helpers.MetaData{}, err
		}
		post.TotalRecords = totalRecords
		posts = append(posts, post)
		
	}
	err = rows.Err()
	if err != nil {
    return nil, helpers.MetaData{}, err
	}
	if len(posts) == 0 {
		return []PostDetails{}, helpers.MetaData{}, nil
	}
	meta := helpers.CalculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil
}

func (r *SQLPostRepository) GetUserPosts(userId int, filter helpers.Filter) ([]PostDetails, helpers.MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		p.id, p.user_id, p.community_id, p.title, p.body, p.view_count, p.image_url,
		p.created_at, u.username AS author, cm.name AS community_name,
		COUNT(DISTINCT v.user_id) AS votes_count,
		COUNT(DISTINCT c.id) AS comments_count
		FROM posts p 
		INNER JOIN users AS u ON p.user_id = u.id
		INNER JOIN communities AS cm ON p.community_id = cm.id
		LEFT JOIN votes AS v ON p.id = v.post_id
		LEFT JOIN comments AS c ON p.id = c.post_id
		WHERE u.id = $1 AND p.status = 'published'
	`

	var args []interface{}
	args = append(args, userId)
	argPos := 2

	if filter.Query != "" {
		queryStatement += fmt.Sprintf(" AND LOWER(p.title) LIKE $%d", argPos)
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
		argPos++
	}

	queryStatement += " GROUP BY p.id, u.username, cm.name"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, p.created_at DESC"
	} else {
		queryStatement += " ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	queryStatement += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, filter.PageSize, offset)

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, args...)
	if err != nil {
    return nil, helpers.MetaData{}, err
	}
	defer rows.Close()

	var posts []PostDetails
	var totalRecords int
	for rows.Next() {
		var post PostDetails 
		err = rows.Scan(
			&totalRecords, &post.ID, &post.UserID, &post.CommunityID, &post.Title, &post.Body,
			&post.ViewCount, &post.Image_url, &post.CreatedAt, &post.Author, &post.CommunityName, &post.VotesCount,
			&post.CommentCount,
		)

		if err != nil {
			return nil, helpers.MetaData{}, err
		}
		post.TotalRecords = totalRecords
		posts = append(posts, post)
	}

	err = rows.Err()
	if err != nil {
    return nil, helpers.MetaData{}, err
	}
	if len(posts) == 0 {
		return []PostDetails{}, helpers.MetaData{}, nil
	}
	meta := helpers.CalculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil

}

func (r *SQLPostRepository) DeletePost(id int) error {
    statement := `DELETE FROM posts WHERE id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

    result, err := r.db.ExecContext(ctx, statement, id)
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
		UPDATE posts SET title = $1, body = $2, image_url = $3, updated_at = NOW() 
		WHERE id = $4
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err := r.db.ExecContext(ctx, queryStatement, post.Title, post.Body, post.Image_url, post.ID)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLPostRepository) GetUserPostDrafts(userId int, filter helpers.Filter) ([]PostDetails, helpers.MetaData, error) {
	err := filter.Validate() 
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		p.id, p.user_id, p.community_id, p.title, p.image_url, p.body, p.created_at, p.status,
		u.username AS author, cm.name AS community_name
		FROM posts AS p
		INNER JOIN users AS u ON p.user_id = u.id
		INNER JOIN communities AS cm ON p.community_id = cm.id
		WHERE p.user_id = $1 AND p.status = 'draft'
	`

	var args []interface{}
	args = append(args, userId)
	argPos := 2

	if filter.Query != "" {
		queryStatement += fmt.Sprintf(" AND LOWER(p.title) LIKE $%d", argPos)
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
		argPos++
	}

	queryStatement += " GROUP BY p.id, u.username, cm.name"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, p.created_at DESC"
	} else {
		queryStatement += " ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	queryStatement += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, filter.PageSize, offset)

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, args...)
	if err != nil {
		return nil, helpers.MetaData{}, err
	}
	defer rows.Close()

	var totalRecords int
	var posts []PostDetails
	for rows.Next() {
		var post PostDetails
		err := rows.Scan(
			&totalRecords, &post.ID, &post.UserID, &post.CommunityID, 
			&post.Title, &post.Image_url, &post.Body, &post.CreatedAt, 
			&post.Status, &post.Author, &post.CommunityName)

		if err != nil {
			return  nil, helpers.MetaData{}, err
		}

		post.TotalRecords = totalRecords
		posts = append(posts, post)
	}

	err = rows.Err()
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	if len(posts) == 0 {
		return []PostDetails{}, helpers.MetaData{}, nil
	}

	meta := helpers.CalculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil
}

func (r *SQLPostRepository) GetUserScheduledPosts(userId int, filter helpers.Filter) ([]PostDetails, helpers.MetaData, error) {
	err := filter.Validate() 
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		p.id, p.user_id, p.community_id, p.title, p.image_url, 
		p.body, p.created_at, p.status, p.publish_at,
		u.username AS author, cm.name AS community_name
		FROM posts AS p
		INNER JOIN users AS u ON p.user_id = u.id
		INNER JOIN communities AS cm ON p.community_id = cm.id
		WHERE p.user_id = $1 AND p.status = 'scheduled'
	`

	var args []interface{}
	args = append(args, userId)
	argPos := 2

	if filter.Query != "" {
		queryStatement += fmt.Sprintf(" AND LOWER(p.title) LIKE $%d", argPos)
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
		argPos++
	}

	queryStatement += " GROUP BY p.id, u.username, cm.name"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, p.created_at DESC"
	} else {
		queryStatement += " ORDER BY p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	queryStatement += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, filter.PageSize, offset)

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, args...)
	if err != nil {
		return nil, helpers.MetaData{}, err
	}
	defer rows.Close()

	var totalRecords int
	var posts []PostDetails
	for rows.Next() {
		var post PostDetails
		err := rows.Scan(
			&totalRecords, &post.ID, &post.UserID, &post.CommunityID, 
			&post.Title, &post.Image_url, &post.Body, &post.CreatedAt, 
			&post.Status, &post.PublishAt, &post.Author, &post.CommunityName)

		if err != nil {
			return  nil, helpers.MetaData{}, err
		}

		post.TotalRecords = totalRecords
		posts = append(posts, post)
	}

	err = rows.Err()
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	if len(posts) == 0 {
		return []PostDetails{}, helpers.MetaData{}, nil
	}

	meta := helpers.CalculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return posts, meta, nil
}

func(r *SQLPostRepository) PublishPost(postID int) error {
	queryStatement := `
		UPDATE posts SET status = 'published', updated_at = NOW()
		WHERE id = $1
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err := r.db.ExecContext(ctx, queryStatement, postID)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLPostRepository) IncrementViewCount(postId int) error{
	queryStatement := `
		UPDATE posts SET view_count = view_count + 1
		WHERE id = $1
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err := r.db.ExecContext(ctx, queryStatement, postId)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLPostRepository) GetScheduledPosts() ([]PostDetails, error) {
    statement := `
        SELECT id, user_id, title, image_url, publish_at
        FROM posts
        WHERE status = 'scheduled'
        AND publish_at > NOW()
    `

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

    rows, err := r.db.QueryContext(ctx, statement)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var scheduledPosts []PostDetails
    for rows.Next() {
        var post PostDetails
        err := rows.Scan(
            &post.ID,
            &post.UserID,
            &post.Title,
			&post.Image_url,
            &post.PublishAt,
        )
        if err != nil {
            return nil, err
        }
        scheduledPosts = append(scheduledPosts, post)
    }

    err = rows.Err()
    if err != nil {
        return nil, err
    }

    return scheduledPosts, nil
}