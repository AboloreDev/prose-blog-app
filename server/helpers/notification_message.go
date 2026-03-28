package helpers

import "fmt"

func BuildNotificationMessage(senderName, notificationType string) string {
	switch notificationType {
    case "post_upvote":
        return fmt.Sprintf("%s upvoted your post", senderName)
    case "post_downvote":
        return fmt.Sprintf("%s downvoted your post", senderName)
    case "comment_upvote":
        return fmt.Sprintf("%s upvoted your comment", senderName)
    case "comment_downvote":
        return fmt.Sprintf("%s downvoted your comment", senderName)
    case "new_comment":
        return fmt.Sprintf("%s commented on your post", senderName)
    case "new_reply":
        return fmt.Sprintf("%s replied to your comment", senderName)
    case "new_follower":
        return fmt.Sprintf("%s started following you", senderName)
    default:
        return "You have a new notification"
    }

}