package comments

import "time"

type Comments struct {
	ID int `json:"id"`
	Author string `json:"author"`
	Body string `json:"body"`
	UserId int `json:"user_id"`
	PostId int `json:"post_id"`
	TotalRecords int `json:"total_records"`
	CommentVoteCount int `json:"comment_vote_count"`
	ReplyCount int `json:"reply_count"`
	ParentId *int `json:"parent_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Filter struct {
	Page int `json:"page"`
	PageSize int `json:"page_size"`
	OrderBy string `json:"order_by"`
	Query string `json:"query"`
}

type MetaData struct {
	CurrentPage int `json:"current_page"`
	PageSize int `json:"page_size"`
	NextPage int `json:"next_page"`
	PreviousPage int `json:"prev_page"`
	FirstPage int `json:"first_page"`
	LastPage int `json:"last_page"`
	TotalRecords int `json:"total_records"`
}