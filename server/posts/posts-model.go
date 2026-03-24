package posts

import "time"

type Post struct {
	ID int `json:"id"`
	UserID int `json:"user_id"`
	CommunityID int `json:"community_id"`
	Title string `json:"title"`
	Body string `json:"body"`
	Status string `json:"status"`
	PublishAt time.Time `json:"publish_at"`
	ViewCount int `json:"view_count"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	TotalRecords int `json:"total_records"`
}

type PostDetails struct {
	ID int `json:"id"`
	UserID int `json:"user_id"`
	CommunityID int `json:"community_id"`
	Title string `json:"title"`
	Body string `json:"body"`
	Author string `json:"author"`
	CommunityName string `json:"community_name"`
	CommentCount int `json:"comment_count"`
	PublishAt time.Time `json:"publish_at"`
	VotesCount int `json:"votes_count"`
	Status string `json:"status"`
	ViewCount int `json:"view_count"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	TotalRecords int `json:"total_records"`
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