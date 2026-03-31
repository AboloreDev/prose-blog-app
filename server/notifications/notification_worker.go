package notifications

import (
	"fmt"
	"time"
)

type NotificationJob struct {
	SenderID int `json:"sender_id"`
	ReceiverID int `json:"receiver_id"`
	ReceiverName string `json:"receiver_name"`
	SenderName string `json:"sender_name"`
	Message string `json:"message"`
	NotificationType string `json:"notification_type"`
	PostID *int `json:"parent_id"`
	CommentID *int `json:"comment_id"`
}

type NotificationWorker struct {
	queueChan chan NotificationJob
	repo NotificationRepository
	stopChan chan struct{}
}

func NewNotificationWorker(repo NotificationRepository) *NotificationWorker {
	return &NotificationWorker{
		queueChan: make(chan NotificationJob, 100),
		repo: repo,
		stopChan: make(chan struct{}),
	}
}

func (nw *NotificationWorker) Start() {
	go func() {
		for {
			select{
			case job := <- nw.queueChan:
				_, err := nw.repo.CreateNotification(
					job.ReceiverID,
					job.SenderID,
					job.Message,
					job.NotificationType,
					job.PostID,
					job.CommentID,
				)
				if err != nil {
					fmt.Println("Notification creation failed")
					return
				}
				fmt.Println("Notification Created")
			case <- nw.stopChan:
				return
			}
		}
	}()
}

func (nw *NotificationWorker) Stop() {
	close(nw.stopChan)
}

func (nw *NotificationWorker) Send(job NotificationJob) {
	go func() {
		for {
			select {
			case nw.queueChan <- job:
	
			default: {
				fmt.Println("Queue has been filled, still sending!")
			}
			}
		}
	}()
}
func (nw *NotificationWorker) DeleteNotificationAtInterval() {
	ticker := time.NewTicker(4 * 24 * time.Hour)

	go func() {
		for {
			select {
			case <- ticker.C:
				err := nw.repo.DeleteOldNotifications()
				if err != nil {
					fmt.Printf("Failed to delete notification %v", err)
				} else {
					fmt.Println("Notification Deleted Successfully")
				}
			case <- nw.stopChan:
				return
			}
		}
	}()
}