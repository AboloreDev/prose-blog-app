package notifications

import (
	"context"
	"database/sql"
	"errors"
	"time"
)


type NotificationRepository interface{
	CreateNotification(receiverID, senderID int, message, notificationType string, postID *int, commentID *int) (int, error)
    GetUserNotifications(userID int) ([]Notifications, error)
    GetNotificationById(notificationID, userID int) (*Notifications, error)
    MarkAllAsRead(userID int) error
    DeleteOldNotifications() error
}

type SQLNotificationRepository struct {
	db *sql.DB
}

var ErrInvalidNotificationType = errors.New("Invalid Notification Type")
var ErrNoRowsAvailable = errors.New("Rows not available")

func NewNotificationRepository(db *sql.DB) NotificationRepository {
	return &SQLNotificationRepository{db: db}
}

func (r *SQLNotificationRepository) CreateNotification(receiverID int, senderID int, message, notificationType string,  postID *int, commentID *int) (int, error){
	if notificationType != "new_follower" &&
        notificationType != "post_upvote" &&
        notificationType != "post_downvote" &&
        notificationType != "comment_upvote" &&
        notificationType != "comment_downvote" &&
        notificationType != "new_comment" &&
        notificationType != "new_reply" {
        return 0, ErrInvalidNotificationType
    }
	
	statement := `
		INSERT INTO notifications (user_id, actor_id, post_id, comment_id, notification_type, message)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
	`
	var notificationId int
	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	
	row := r.db.QueryRowContext(
		ctx, statement, receiverID, senderID, postID, commentID, notificationType, message)

	err := row.Scan(&notificationId)
	if err != nil {
		return 0, err
	}

	return notificationId, nil
}

func (r *SQLNotificationRepository) GetUserNotifications(userID int) ([]Notifications, error) {
	queryStatement := `
		 SELECT 
		 n.id, n.user_id, n.actor_id, n.post_id, n.comment_id, 
		 n.notification_type, n.message, n.is_read, n.created_at,
		 receiver_u.username AS receiver,
         sender_u.username AS sender
		 FROM notifications AS n
		 INNER JOIN users AS receiver_u ON n.user_id = receiver_u.id
         INNER JOIN users AS sender_u ON n.actor_id = sender_u.id
		 LEFT JOIN posts AS p ON n.post_id = p.id
		 LEFT JOIN comments AS c ON n.comment_id = c.id
		 WHERE n.user_id = $1 
		 ORDER BY n.created_at DESC
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []Notifications
	for rows.Next() {
		var notification Notifications
		err := rows.Scan(
			&notification.ID, &notification.ReceiverId, &notification.SenderId, 
			&notification.PostId, &notification.CommentId, &notification.NotificationType, 
			&notification.Message, &notification.IsRead, &notification.CreatedAt, 
			&notification.Receiver, &notification.Sender,
		)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, notification)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return notifications, nil
}

func (r *SQLNotificationRepository) GetNotificationById(notificationID, userID int) (*Notifications, error) {
	queryStatement := `
		SELECT 
		 n.id, n.user_id, n.actor_id, n.post_id, n.comment_id, 
		 n.notification_type, n.message, n.is_read, n.created_at,
		 receiver_u.username AS receiver,
         sender_u.username AS sender
		 FROM notifications AS n
		 INNER JOIN users AS receiver_u ON n.user_id = receiver_u.id
         INNER JOIN users AS sender_u ON n.actor_id = sender_u.id
		 LEFT JOIN posts AS p ON n.post_id = p.id
		 LEFT JOIN comments AS c ON n.comment_id = c.id
		 WHERE n.id = $1 AND n.user_id = $2
		 ORDER BY n.created_at DESC
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows := r.db.QueryRowContext(ctx, queryStatement, notificationID, userID)
	
	var notification Notifications
	err := rows.Scan(
			&notification.ID, &notification.ReceiverId, &notification.SenderId, 
			&notification.PostId, &notification.CommentId, &notification.NotificationType, 
			&notification.Message, &notification.IsRead, &notification.CreatedAt, 
			&notification.Receiver, &notification.Sender,
		)
	if errors.Is(err, sql.ErrNoRows) {
        return nil, ErrNoRowsAvailable
    }


	_, err = r.db.Exec(
			`UPDATE notifications 
			 SET is_read = true 
			 WHERE id = $1 AND user_id = $2`, notificationID, userID,
			)

	if err != nil {
    return nil, err
	}

	return &notification, nil
}

func (r *SQLNotificationRepository) MarkAllAsRead(userID int) error {
	statement := `UPDATE notifications SET is_read = true WHERE user_id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err := r.db.ExecContext(ctx, statement, userID)
	if err != nil {
		return nil
	}

	return err
}

func (r *SQLNotificationRepository) DeleteOldNotifications() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

    _, err := r.db.ExecContext(ctx, `
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '4 days'
    `)
    return err
}