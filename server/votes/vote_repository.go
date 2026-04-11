package votes

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var ErrDuplicateVotes = errors.New("Duplicate votes")
var ErrInvalidVoteType = errors.New("vote type must be up or down")
var ErrNoRowsAvailable = errors.New("No rows available")

type VoteRepository interface {
	VoteAPost(user_id, post_id int, vote_type string) error
	GetPostVotes(postId int) ([]PostVotes, error)
	VoteAComment(user_id, comment_id int, vote_type string) error
	GetPostComments(commentId int) ([]CommentVotes, error)
}

type SQLVoteRepository struct {
	db *sql.DB
}

func NewSQLVoteRepository(db *sql.DB) VoteRepository {
	return &SQLVoteRepository{db: db}
}

func (r *SQLVoteRepository) VoteAPost(userID, postID int, voteType string) error {
	if voteType != "up" && voteType != "down" {
		return ErrInvalidVoteType
	}

	var existingVoteType string
	err := r.db.QueryRow(`
		SELECT vote_type FROM votes 
		WHERE user_id = $1 AND post_id = $2
	`, userID, postID).Scan(&existingVoteType)

	if err == sql.ErrNoRows {
		_, err = r.db.Exec(`
			INSERT INTO votes (user_id, post_id, vote_type) 
			VALUES ($1, $2, $3)
		`, userID, postID, voteType)
		return err
	}

	if err != nil {
		return err
	}

	if existingVoteType == voteType {
		_, err = r.db.Exec(`
			DELETE FROM votes 
			WHERE user_id = $1 AND post_id = $2
		`, userID, postID)
		return err
	}

	_, err = r.db.Exec(`
		UPDATE votes SET vote_type = $1 
		WHERE user_id = $2 AND post_id = $3
	`, voteType, userID, postID)

	return err
}

func (r *SQLVoteRepository) GetPostVotes(postId int) ([]PostVotes, error) {
	queryStatement := `
		SELECT v.post_id, v.user_id, v.vote_type, v.created_at,
		u.username AS vote_author,
		COUNT(DISTINCT v.post_id) AS vote_count
		FROM votes AS v
		INNER JOIN users AS u ON v.user_id = u.id
		WHERE v.post_id = $1
		GROUP BY v.post_id, v.user_id, u.username
		ORDER BY v.created_at DESC
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err  := r.db.QueryContext(ctx, queryStatement, postId)
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

func (r *SQLVoteRepository) VoteAComment(userID, commentID int, voteType string) error {
	if voteType != "up" && voteType != "down" {
		return ErrInvalidVoteType
	}

	var existingVoteType string
	err := r.db.QueryRow(`
		SELECT vote_type FROM comment_votes 
		WHERE user_id = $1 AND comment_id = $2
	`, userID, commentID).Scan(&existingVoteType)

	if err == sql.ErrNoRows {
		_, err = r.db.Exec(`
			INSERT INTO comment_votes (user_id, comment_id, vote_type) 
			VALUES ($1, $2, $3)
		`, userID, commentID, voteType)
		return err
	}

	if err != nil {
		return err
	}

	if existingVoteType == voteType {
		_, err = r.db.Exec(`
			DELETE FROM comment_votes 
			WHERE user_id = $1 AND comment_id = $2
		`, userID, commentID)
		return err
	}

	_, err = r.db.Exec(`
		UPDATE comment_votes SET vote_type = $1 
		WHERE user_id = $2 AND comment_id = $3
	`, voteType, userID, commentID)
	return err
}

func (r *SQLVoteRepository) GetPostComments(commentId int) ([]CommentVotes, error) {
	queryStatement := `
		SELECT v.comment_id, v.user_id, v.vote_type, v.created_at,
		u.username AS vote_author,
		COUNT(DISTINCT v.comment_id) AS vote_count
		FROM comment_votes AS v
		INNER JOIN users AS u ON v.user_id = u.id
		WHERE v.comment_id = $1
		GROUP BY v.comment_id, v.user_id, u.username
		ORDER BY v.created_at DESC
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, commentId)
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

