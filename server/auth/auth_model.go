package auth

import (
	"time"
)

type RefreshToken struct {
	ID int `json:"id"`
	UserId int `json:"user_id"`
	HashToken string `json:"hash_token"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

