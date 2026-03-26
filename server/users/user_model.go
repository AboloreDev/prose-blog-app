package users

import "time"

type User struct {
	ID  int `json:"id"`
	Email string `json:"email"`
	Password string `json:"password,omitempty"`
	Username string `json:"username"`
	CreatedAt time.Time `json:"created_at"`
	Profile Profile	`json:"profile"`
}

type Profile struct {
	UserId int `json:"user_id"`
	Bio string `json:"bio"`
	Karma string `json:"karma"`
}

