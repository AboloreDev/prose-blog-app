package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var ErrInvalidToken = errors.New("Invalid Token")
var ErrUnexpectedSigningMethod = errors.New("Unexpected Signing Method")

var jwtsecretKey = []byte("JWT_SECRET_KEY")

type Claims struct {
	UserID int `json:"user_id"`
	jwt.RegisteredClaims
}

// Genenrate access Token
func GenerateAccessToken(userId int) (string, error) {
	claims := Claims{
		UserID: userId,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString(jwtsecretKey)
}

// Validate Access Token 
func ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		Claims{},
		func(t *jwt.Token) (interface{}, error) {
			_, ok := t.Method.(*jwt.SigningMethodECDSA)
			if !ok {
				return nil, ErrUnexpectedSigningMethod
			}
			return  jwtsecretKey, nil
		},
	)
	if err != nil {
		return  nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// Generate Refresh token
func GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	// convert to hex string 
	return hex.EncodeToString(bytes), nil
}