package auth

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"
)

var errorTokenNotFound = errors.New("No token")
var errorUserIdNotFound = errors.New("user_id not found")

type AuthRepository interface {
	SaveRefreshToken(userId int, token string, expiresAt time.Time) error 
	GetRefreshToken(token string) (*RefreshToken, error)
	DeleteRefreshToken(token string) error 
	DeleteExpiredTokens() error
	DeleteAllToken(userId int) error
}

type SQLAuthRepository struct {
	db *sql.DB
}

func NewSQLAuthRepository(db *sql.DB) AuthRepository {
	return &SQLAuthRepository{db: db}
}

func (r *SQLAuthRepository) SaveRefreshToken(userId int, token string, expiresAt time.Time) error {
	statement := `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)	
	`

	stmt, err := r.db.Prepare(statement)
	if err != nil {
		return  err
	}
	defer stmt.Close()

	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err = stmt.ExecContext(ctx, userId, tokenHash, expiresAt)
	if err != nil {
		return  err
	}

	return nil
}

func (r *SQLAuthRepository) GetRefreshToken(token string) (*RefreshToken, error) {
	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])

	queryStatement := `
	SELECT rt.id, rt.user_id, rt.expires_at FROM refresh_tokens AS rt
	WHERE token_hash = $1
	`	

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	rows := r.db.QueryRowContext(ctx, queryStatement, tokenHash)



	var tokens RefreshToken 
	err := rows.Scan(&tokens.ID, &tokens.UserId, &tokens.ExpiresAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errorTokenNotFound
		}
		return nil, err
	}

	return &tokens, nil
}


func (r *SQLAuthRepository) DeleteRefreshToken(token string) error {
	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])

	statement := `
		DELETE FROM refresh_tokens 
		WHERE token_hash = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.ExecContext(ctx, statement, tokenHash)
	if err != nil {
		return  err
	}

	rowsAffected, err := rows.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errorTokenNotFound
	}

	return nil
}

func (r *SQLAuthRepository) DeleteAllToken(userId int) error {
	statement := `
		DELETE FROM refresh_tokens 
		WHERE user_id = $1`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.ExecContext(ctx, statement, userId)
	if err != nil {
		return  err
	}

	rowsAffected, err := rows.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errorUserIdNotFound
	}

	return nil
}


func (r *SQLAuthRepository) DeleteExpiredTokens() error {
	statement := `
		DELETE FROM refresh_tokens 
		WHERE expires_at < NOW()`
	
	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err := r.db.ExecContext(ctx, statement)
	if err != nil {
		return err
	}

	return nil
}