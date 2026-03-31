package helpers

import "testing"

func TestBuildNotificationMessage(t *testing.T) {
	tests := []struct {
		name string
		username string
		notificationType string
		expected string
	}{
		{
			name: "post_upvote",
			username: "john",
			notificationType: "post_upvote",
			expected: "john upvoted your post",
		},
		{
			name: "post_downvote",
			username: "john",
			notificationType: "post_downvote",
			expected: "john downvoted your post",
		},
		{
			name: "comment_upvote",
			username: "john",
			notificationType: "comment_upvote",
			expected: "john upvoted your comment",
		},
		{
			name: "comment_downvote",
			username: "john",
			notificationType: "comment_downvote",
			expected: "john downvoted your comment",
		},
		{
			name: "new_comment",
			username: "john",
			notificationType: "new_comment",
			expected: "john commented on your post",
		},
		{
			name: "new_reply",
			username: "john",
			notificationType: "new_reply",
			expected: "john replied to your comment",
		},
		{
			name: "new_follower",
			username: "john",
			notificationType: "new_follower",
			expected: "john started following you",
		},
		{
			expected: "You have a new notification",
		},
	}

	for _, tt := range tests {
		result := BuildNotificationMessage(tt.username, tt.notificationType)
		if result != tt.expected {
			t.Errorf("want %s, got %s", result, tt.expected)
		}
	}	
}

func TestFilterValidate(t *testing.T) {
    tests := []struct {
        name     string
        pageSize int
        expected error
    }{
        {name: "zero pagesize", pageSize: 0, expected: ErrInvalidPageRange},
        {name: "valid pagesize", pageSize: 50, expected: nil},
        {name: "max pagesize", pageSize: 100, expected: ErrInvalidPageRange},
        {name: "valid edge", pageSize: 99, expected: nil},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            f := Filter{PageSize: tt.pageSize}
            result := f.Validate() 
			
            if result != tt.expected {
                t.Errorf("pageSize=%d: got %v, want %v", tt.pageSize, result, tt.expected)
            }
        })
    }
}

