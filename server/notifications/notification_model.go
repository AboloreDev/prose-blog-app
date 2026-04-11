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

