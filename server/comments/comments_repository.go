package comments

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"prose-blog/helpers"
	"strings"
	"time"
)

type CommentsRepository interface{
	CreateComment(postId, userId int, body string, parent_id *int) (int, error)
	GetCommentsByPost(postId int, filter helpers.Filter) ([]Comments, helpers.MetaData, error)
	GetCommentById(commentId int) (*Comments, error)
	UpdateComment(comment *Comments) error
	DeleteComment(commentId int) error
	GetNestedComments(commentId int, filter helpers.Filter) ([]Comments, helpers.MetaData, error)
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




func (r *SQLCommentsRepository) CreateComment(postId, userId int, body string, parent_id *int) (int, error) {
	queryStatement := `
		INSERT INTO comments (post_id, user_id, parent_id, body) 
		VALUES ($1, $2, $3, $4) RETURNING id
		`

	var commentId int

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	row := r.db.QueryRowContext(ctx, queryStatement, postId, userId, parent_id, body)

	err := row.Scan(&commentId)
	if err != nil {
		return 0, err
	}

	return commentId, nil
}

func (r *SQLCommentsRepository) GetCommentsByPost(postId int, filter helpers.Filter) ([]Comments, helpers.MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, helpers.MetaData{}, err
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
		WHERE c.post_id = $1 AND c.parent_id IS NULL
	`

	var args []interface{}
	args = append(args, postId)
	argPos := 2

	if filter.Query != "" {
		queryStatement += fmt.Sprintf(" AND LOWER(c.body) LIKE $%d", argPos)
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
		argPos++
	}

	queryStatement += " GROUP BY c.id, u.username"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY vote_count DESC, c.created_at DESC"
	} else {
		queryStatement += " ORDER BY c.created_at DESC"
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
	var comments []Comments
	for rows.Next() {
		var comment Comments
		err := rows.Scan(
			&totalRecords, &comment.ID, &comment.Body, &comment.UserId, &comment.PostId,
			&comment.ParentId, &comment.CreatedAt, &comment.Author, &comment.ReplyCount, 
			&comment.CommentVoteCount,
		)
		if err != nil {
			return nil, helpers.MetaData{}, err
		}
		comment.TotalRecords = totalRecords
		comments = append(comments, comment)
	}

	err = rows.Err()
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	if len(comments) == 0 {
		return []Comments{}, helpers.MetaData{}, nil
	}

	meta := helpers.CalculateMetaData(totalRecords, filter.Page, filter.PageSize)

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
		WHERE c.id = $1
		GROUP BY c.id, u.username
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows := r.db.QueryRowContext(ctx, queryStatement, commentId)	

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
		SET body = $1, updated_at = NOW()
		WHERE id = $2
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	_, err := r.db.ExecContext(ctx, queryStatement, comment.Body, comment.ID)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLCommentsRepository) DeleteComment(commentId int) error {
	queryStatement := `
		DELETE FROM comments
		WHERE id = $1
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.ExecContext(ctx, queryStatement, commentId)
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

func (r *SQLCommentsRepository) GetNestedComments(commentId int, filter helpers.Filter) ([]Comments, helpers.MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		c.id, c.post_id, c.user_id, c.body, c.parent_id, c.created_at,
		u.username AS author
		FROM comments AS c
		INNER JOIN users AS u ON c.user_id = u.id
		WHERE c.parent_id = $1
	`

	var args []interface{}
	args = append(args, commentId)
	argPos := 2

	if filter.Query != "" {
		queryStatement += fmt.Sprintf(" AND LOWER(c.title) LIKE $%d", argPos)
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
		argPos++
	}

	queryStatement += " GROUP BY c.id, u.username"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY c.created_at DESC"
	} else {
		queryStatement += " ORDER BY c.created_at DESC"
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
	var comments []Comments
	for rows.Next() {
		var comment Comments
		err := rows.Scan(
			&totalRecords, &comment.ID, &comment.PostId, &comment.UserId, &comment.Body, 
			&comment.ParentId, &comment.CreatedAt, &comment.Author,
		)
		if err != nil {
			return nil, helpers.MetaData{}, err
		}
		comment.TotalRecords = totalRecords
		comments = append(comments, comment)
	}

	err = rows.Err()
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	if len(comments) == 0 {
		return []Comments{}, helpers.MetaData{}, nil
	}

	meta := helpers.CalculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return comments, meta, nil
}