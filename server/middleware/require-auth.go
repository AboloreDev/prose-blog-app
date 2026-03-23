package middleware

import (
	"context"
	"net/http"
	"prose-blog/auth"
	"strings"
)

type contextKey string

const UserID contextKey = "UserID"

func RequireAuth(next http.Handler) http.Handler{
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorised", http.StatusUnauthorized)
			return 
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Unauthorised", http.StatusUnauthorized)
			return 
		}

		tokenString := parts[1]

		claims, err := auth.ValidateAccessToken(tokenString)
		if err != nil {
			http.Error(w, "Unauthorised", http.StatusUnauthorized)
			return 
		}

		ctx := context.WithValue(r.Context(), UserID, claims.UserID)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}