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
	Image_url string `json:"image_url"`
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
	Image_url string `json:"image_url"`
	VotesCount int `json:"votes_count"`
	Status string `json:"status"`
	ViewCount int `json:"view_count"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	TotalRecords int `json:"total_records"`
}
