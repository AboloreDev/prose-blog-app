package votes

import "time"

type PostVotes struct {
	UserId int `json:"user_id"`
	PostId int `json:"post_id"`
	VoteType string `json:"vote_type"`
	VoteCount int `json:"vote_count"`
	VoteAuthor string `json:"vote_author"`
	CreatedAt time.Time `json:"created_at"`
}

type CommentVotes struct {
	UserId int `json:"user_id"`
	CommentId int `json:"comment_id"`
	VoteType string `json:"vote_type"`
	VoteCount int `json:"vote_count"`
	VoteAuthor string `json:"vote_author"`
	CreatedAt time.Time `json:"created_at"`
}