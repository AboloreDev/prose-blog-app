package users

import (
	"context"
	"database/sql"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredential = errors.New("invalid credential")
var ErrUserNotFound = errors.New("user not found")

type UserRepository interface {
	CreateUser(username, email, password, bio string, karma int ) (int, error)
	GetUserById(id int) (*User, error)
	GetUserByEmail(email string) (*User, error)
	GetAllUsers() ([]User, error)
	UpdateUser(user *User) error
	DeleteUser(id int) error
	Authenticate(email, password string) (int, error)
}

type SQLUserRepository struct {
	db *sql.DB
}

func NewSQLUserRepository(db *sql.DB) UserRepository {
	return &SQLUserRepository{db: db}
}

// Create a user 
func (r *SQLUserRepository) CreateUser(username, email, password, bio string, karma int) (int, error) {
	ctx := context.Background()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Statement
	queryStatement := `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`
	userStmt, err := tx.PrepareContext(ctx, queryStatement)
	if err != nil {
		return 0, err
	}
	defer userStmt.Close()

	// hash the password
	pw, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return 0, err
	}
	// Execute statement
	result, err := userStmt.Exec(username, email, string(pw))
	if err != nil {
		return 0, err
	}
	
	userId, err := result.LastInsertId()
	if err != nil {
		return  0, err
	}

	// profile statement
	profileStatement := `INSERT INTO profile (user_id, bio, karma) VALUES (?, ?, ?)`
	profileStmt, err := tx.PrepareContext(ctx, profileStatement)
	if err != nil {
		return 0, err
	}
	defer profileStmt.Close()

	_, err = profileStmt.Exec(userId, bio, karma)
	if err != nil {
		return 0, err
	}
	
	err = tx.Commit()
	if err != nil {
		return 0, err
	}

	return int(userId), nil
}

// Get a user by id
func (r *SQLUserRepository) GetUserById(id int) (*User, error) {
	// Perpare statement
	queryStatement := `SELECT 
	u.id, u.username, u.email, u.password, u.created_at, p.bio, p.karma
	FROM users AS u INNER JOIN profile AS p ON u.id = p.user_id
	WHERE u.id = ?
	`
	rows := r.db.QueryRow(queryStatement, id)
	var user User
	err :=  rows.Scan(&user.ID, user.Username, user.Email, user.Password, user.CreatedAt, user.Profile.Bio, user.Profile.Karma)
	if err != nil {
		return nil, err
	}
	user.Profile.UserId = user.ID

	return  &user, nil
}

// Get all users 
func (r *SQLUserRepository) GetAllUsers() ([]User, error) {
	// statement
	queryStatement := `SELECT id, username, email, created_at FROM users`

	rows, err := r.db.Query(queryStatement)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []User 
	for rows.Next() {
		var user User 
		err := rows.Scan(
			&user.ID, &user.Username, &user.Email, &user.CreatedAt,
		)
		if err != nil {
			return  nil, err
		}
		users = append(users, user)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return  users, nil
}

// Get user by email
func (r *SQLUserRepository) GetUserByEmail(email string) (*User, error) {
	// statement
	queryStatement := `SELECT
	u.id, u.username, u.email, u.password, u.created_at, p.bio, p.karma
	FROM users AS u INNER JOIN profile AS p 
	ON u.id = p.user_id WHERE u.email = ?`

	rows := r.db.QueryRow(queryStatement, email)
	var user User 
	err := rows.Scan(
		&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt, &user.Profile.Bio, &user.Profile.Karma,
	)

	if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrUserNotFound
        }
        return nil, err
    }
	user.Profile.UserId = user.ID

	return &user, nil
}

// Authenticate 
func (r *SQLUserRepository) Authenticate(email, password string) (int, error) {
	user, err := r.GetUserByEmail(email)
	if err != nil {
		return 0, err
	}
	
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return 0, ErrInvalidCredential
		}
		return 0, err
	}

	return user.ID, nil
}

// Update user 
func (r *SQLUserRepository) UpdateUser(user *User) error {
	ctx := context.Background()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return  err
	}
	tx.Rollback()

	// statement
	queryStatement := `
		UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
		`
	stmt, err := tx.PrepareContext(ctx, queryStatement)
	if err != nil {
		return  err
	} 
	defer stmt.Close()

	_, err = stmt.Exec(user.Username, user.Email, user.ID)
	if err != nil {
		return  err
	}

	// Profile statement
	profileStatement := `
	UPDATE profile SET bio = ?, updated_at = CURRENT_TIMESTAMP
	WHERE user_id = ?
	`
	profileStmt, err := tx.PrepareContext(ctx, profileStatement)
	if err != nil {
		return err
	}
	defer profileStmt.Close()

	_, err = profileStmt.Exec(user.Profile.Bio, user.ID)
	if err != nil {
		return  err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

// Delete a user
func (r *SQLUserRepository) DeleteUser(id int) error {
	// statement 
	deleteStatement := `DELETE FROM users WHERE id = ?`

	rows, err := r.db.Exec(deleteStatement, id)
	if err != nil {
		return err
	}

	rowsAffected, err := rows.RowsAffected()
	if err != nil {
		return err 
	}

	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	return  nil
}

