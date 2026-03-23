package comments

import (
	"database/sql"
	"errors"
	"math"
)

type CommentsRepository interface{
	CreateComment(postId, userId int, body string, parent_id *int) (int, error)
	GetCommentsByPost(postId int, filter Filter) ([]Comments, MetaData, error)
	GetCommentById(commentId int) (*Comments, error)
	UpdateComment(comment *Comments) error
	DeleteComment(commentId int) error
	GetNestedComments(commentId int, filter Filter) ([]Comments, MetaData, error)
}

type SQLCommentsRepository struct {
	db *sql.DB
}

func NewSQLCommentsRepository(db *sql.DB) CommentsRepository {
	return  &SQLCommentsRepository{db: db}
}

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

func (r *SQLCommentsRepository) CreateComment(postId, userId int, body string, parent_id *int) (int, error) {
	queryStatement := `
		INSERT INTO comments (post_id, user_id, parent_id, body) 
		VALUES (?, ?, ?, ?)
		`
	
	result, err := r.db.Exec(queryStatement, postId, userId, parent_id, body)
	if err != nil {
		return 0, err
	}

	commentId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(commentId), nil
}

func (r *SQLCommentsRepository) GetCommentsByPost(postId int, filter Filter) ([]Comments, MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		c.id, c.body, c.user_id, c.post_id, c.parent_id, c.created_at,
		u.username AS author,
		COUNT(DISTINCT replies.id) AS reply_count,
		COUNT(DISTINCT cv.user_id) AS vote_count
		FROM comments AS c
		INNER JOIN users AS u ON c.user_id = u.id
		INNER JOIN posts AS p ON c.post_id = p.id
		LEFT JOIN comments AS replies ON replies.parent_id = c.id
		LEFT JOIN comment_votes AS cv ON c.id = cv.comment_id
		WHERE c.post_id = ? AND c.parent_id IS NULL
	`

	var args []interface{}

	args = append(args, postId)

	queryStatement += " GROUP BY c.id"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, c.created_at DESC"
	}else {
		queryStatement+= " ORDER BY c.created_at DESC"
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
	var comments []Comments
	for rows.Next() {
		var comment Comments
		err := rows.Scan(
			&totalRecords, &comment.ID, &comment.Body, &comment.UserId, &comment.PostId,
			&comment.ParentId, &comment.CreatedAt, &comment.Author, &comment.ReplyCount, &comment.CommentVoteCount,
		)
		if err != nil {
			return nil, MetaData{}, err
		}
		comment.TotalRecords = totalRecords
		comments = append(comments, comment)
	}

	err = rows.Err()
	if err != nil {
		return nil, MetaData{}, err
	}

	if len(comments) == 0 {
		return []Comments{}, MetaData{}, nil
	}

	meta := calculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return comments, meta, nil
}

func (r *SQLCommentsRepository) GetCommentById(commentId int) (*Comments, error) {
	queryStatement := `
		SELECT c.id, c.post_id, c.user_id, c.body, c.parent_id, c.created_at,
		u.username AS author, 
		COUNT(DISTINCT replies.id) AS reply_count,
		COUNT(DISTINCT cv.user_id) AS comment_votes_count
		FROM comments AS c
		INNER JOIN users AS u ON c.user_id = u.id
		INNER JOIN posts AS p ON c.post_id = p.id
		LEFT JOIN comments AS replies ON replies.parent_id = c.id
		LEFT JOIN comment_votes AS cv ON c.id = cv.comment_id
		WHERE c.id = ? 
		GROUP BY c.id
	`

	rows := r.db.QueryRow(queryStatement, commentId)	

	var comment Comments
	err := rows.Scan(
		&comment.ID, &comment.PostId, &comment.UserId, &comment.Body, &comment.ParentId,
		&comment.CreatedAt, &comment.Author, &comment.ReplyCount,  &comment.CommentVoteCount,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsAvailable
		}
		return nil, err
	}

	return &comment, nil
}

func (r *SQLCommentsRepository) UpdateComment(comment *Comments) error {
	queryStatement := `
		UPDATE comments 
		SET body = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	_, err := r.db.Exec(queryStatement, comment.Body, comment.ID)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLCommentsRepository) DeleteComment(commentId int) error {
	queryStatement := `
		DELETE FROM comments
		WHERE id = ?
	`
	rows, err := r.db.Exec(queryStatement, commentId)
	if err != nil {
		return err
	}

	rowsAffected, err := rows.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNoRowsAvailable
	}

	return  nil
}

func (r *SQLCommentsRepository) GetNestedComments(commentId int, filter Filter) ([]Comments, MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, MetaData{}, err
	}

	queryStatement := `
		SELECT SELECT COUNT(*) OVER() AS total_records,
		c.id, c.post_id, c.user_id, c.body, c.parent_id, c.created_at,
		u.username AS author
		FROM comments AS c
		INNER JOIN users AS u ON c.user_id = u.id
		WHERE c.parent_id = ?
	`

	var args []interface{}

	args = append(args, commentId)

	queryStatement += " GROUP BY c.id"

	if filter.OrderBy == "popular" {
		queryStatement+= " ORDER BY c.created_at DESC"
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
	var comments []Comments
	for rows.Next() {
		var comment Comments
		err := rows.Scan(
			&totalRecords, &comment.ID, &comment.PostId, &comment.UserId, &comment.Body, 
			&comment.ParentId, &comment.CreatedAt, &comment.Author,
		)
		if err != nil {
			return nil, MetaData{}, err
		}
		comment.TotalRecords = totalRecords
		comments = append(comments, comment)
	}

	err = rows.Err()
	if err != nil {
		return nil, MetaData{}, err
	}

	if len(comments) == 0 {
		return []Comments{}, MetaData{}, nil
	}

	meta := calculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return comments, meta, nil
}