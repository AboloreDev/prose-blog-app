package auth

import (
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
	// Prepare statement
	statement := `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES (?, ?, ?)	
	`

	stmt, err := r.db.Prepare(statement)
	if err != nil {
		return  err
	}
	defer stmt.Close()

	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])

	_, err = stmt.Exec(userId, tokenHash, expiresAt)
	if err != nil {
		return  err
	}

	return nil
}

func (r *SQLAuthRepository) GetRefreshToken(token string) (*RefreshToken, error) {
	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])

	// statement
	queryStatement := `
	SELECT rt.id, rt.user_id, rt.expires_at FROM refresh_tokens AS rt
	WHERE token_hash = ?
	`	

	rows := r.db.QueryRow(queryStatement, tokenHash)

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

	statement := `DELETE FROM refresh_tokens WHERE token_hash = ?`

	rows, err := r.db.Exec(statement, tokenHash)
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
	statement := `DELETE FROM refresh_tokens WHERE user_id = ?`

	rows, err := r.db.Exec(statement, userId)
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
	statement := `SELECT from refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP`

	_, err := r.db.Exec(statement)
	if err != nil {
		return err
	}

	return nil
}