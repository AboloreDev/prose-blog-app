package votes

import (
	"database/sql"
	"errors"
	"strings"
)

var ErrDuplicateVotes = errors.New("Duplicate votes")
var ErrInvalidVoteType = errors.New("vote type must be up or down")
var ErrNoRowsAvailable = errors.New("No rows available")

type VoteRepository interface {
	VoteAPost(user_id, post_id int, vote_type string) error
	GetPostVotes(postId int) ([]PostVotes, error)
	DeletePostVotes(postId, userId int) error
	VoteAComment(user_id, comment_id int, vote_type string) error
	GetPostComments(commentId int) ([]CommentVotes, error)
	DeletePostComment(commentId int) error
}

type SQLVoteRepository struct {
	db *sql.DB
}

func NewSQLVoteRepository(db *sql.DB) VoteRepository {
	return &SQLVoteRepository{db: db}
}

func (r *SQLVoteRepository) VoteAPost(user_id, post_id int, vote_type string) error {
	if vote_type != "up" && vote_type != "down" {
        return ErrInvalidVoteType
    }
	queryStatement := `INSERT INTO votes (user_id, post_id, vote_type) VALUES ($1, $2, $3)`

	_, err := r.db.Exec(queryStatement, user_id, post_id, vote_type)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
    	return ErrDuplicateVotes
	}
		return err
	}

	return nil
}

func (r *SQLVoteRepository) GetPostVotes(postId int) ([]PostVotes, error) {
	queryStatement := `
		SELECT v.post_id, v.user_id, v.vote_type, v.created_at,
		u.username AS vote_author,
		COUNT(DISTINCT v.post_id) AS vote_count
		FROM votes AS v
		INNER JOIN users AS u ON v.user_id = u.id
		WHERE v.post_id = $1
		GROUP BY v.post_id, u.username
		ORDER BY v.created_at DESC
	`

	rows, err  := r.db.Query(queryStatement, postId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var votes []PostVotes 
	for rows.Next() {
		var vote PostVotes
		err = rows.Scan(&vote.PostId, &vote.UserId, &vote.VoteType, &vote.CreatedAt, &vote.VoteAuthor, &vote.VoteCount)
		if err != nil {
			return nil, err
		}
		votes = append(votes, vote)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return votes, nil
}

func (r *SQLVoteRepository) DeletePostVotes(postId, userId int) error {
	queryStatement := `
		DELETE FROM votes WHERE post_id = $1 AND user_id = $2
	`

	result, err := r.db.Exec(queryStatement, postId, userId)
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

	return  nil
}

func (r *SQLVoteRepository) VoteAComment(user_id, comment_id int, vote_type string) error {
	if vote_type != "up" && vote_type != "down" {
        return ErrInvalidVoteType
    }
	queryStatement := `
		INSERT INTO comment_votes (user_id, comment_id, vote_type) 
		VALUES ($1, $2, $3)
	`

	_, err := r.db.Exec(queryStatement, user_id, comment_id, vote_type)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
    	return ErrDuplicateVotes
	}
		return err
	}

	return nil
}

func (r *SQLVoteRepository) GetPostComments(commentId int) ([]CommentVotes, error) {
	queryStatement := `
		SELECT v.comment_id, v.user_id, v.vote_type, v.created_at,
		u.username AS vote_author,
		COUNT(DISTINCT v.comment_id) AS vote_count
		FROM comment_votes AS v
		INNER JOIN users AS u ON v.user_id = u.id
		WHERE v.comment_id = $1
		GROUP BY v.comment_id, u.username
		ORDER BY v.created_at DESC
	`

	rows, err := r.db.Query(queryStatement, commentId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var commentVotes []CommentVotes 
	for rows.Next() {
		var vote CommentVotes
		err = rows.Scan(&vote.CommentId, &vote.UserId, &vote.VoteType, &vote.CreatedAt, &vote.VoteAuthor, &vote.VoteCount)
		if err != nil {
			return nil, err
		}

		commentVotes = append(commentVotes, vote)
	}
	
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return commentVotes, nil
}

func (r *SQLVoteRepository) DeletePostComment(commentId int) error {
	queryStatement := `
		DELETE FROM comment_votes WHERE comment_id = $1
	`

	result, err := r.db.Exec(queryStatement, commentId)
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

	return  nil
}