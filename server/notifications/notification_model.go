package notifications

import (
	"time"
)

type Notifications struct {
	ID int `json:"id"`
	Message string `json:"message"`
	NotificationType string `json:"notification_type"`
	Sender string 	`json:"sender"`
	Receiver string  `json:"receiver"`
	SenderId int `json:"sender_id"`
	ReceiverId int `json:"receiver_id"`
	PostId *int `json:"post_id"`
	CommentId *int `json:"comment_id"`
	IsRead bool `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
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