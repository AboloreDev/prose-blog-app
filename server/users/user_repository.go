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

func (r *SQLUserRepository) CreateUser(username, email, password, bio string, karma int) (int, error) {
	ctx := context.Background()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	pw, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return 0, err
	}

	queryStatement := `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id`
	var userId int
	row := tx.QueryRowContext(ctx, queryStatement, username, email, pw)
	
	err = row.Scan(&userId)
	if err != nil {
		return 0, err
	}

	profileStatement := `INSERT INTO profiles (user_id, bio, karma) VALUES ($1, $2, $3)`
	_, err = tx.ExecContext(ctx, profileStatement, userId, bio, karma)
	if err != nil {
		return 0, err
	}
	
	err = tx.Commit()
	if err != nil {
		return 0, err
	}

	return userId, nil
}

func (r *SQLUserRepository) GetUserById(id int) (*User, error) {
	queryStatement := `SELECT 
	u.id, u.username, u.email, u.password, u.created_at, p.bio, p.karma
	FROM users AS u INNER JOIN profiles AS p ON u.id = p.user_id
	WHERE u.id = $1
	`
	rows := r.db.QueryRow(queryStatement, id)

	var user User
	err :=  rows.Scan(
		&user.ID, &user.Username, &user.Email, 
		&user.Password, &user.CreatedAt, 
		&user.Profile.Bio, &user.Profile.Karma,
	)
	if err != nil {
		return nil, err
	}

	user.Profile.UserId = user.ID

	return &user, nil
}


func (r *SQLUserRepository) GetAllUsers() ([]User, error) {
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


func (r *SQLUserRepository) GetUserByEmail(email string) (*User, error) {
	queryStatement := `SELECT
	u.id, u.username, u.email, u.password, u.created_at, p.bio, p.karma
	FROM users AS u INNER JOIN profiles AS p 
	ON u.id = p.user_id WHERE u.email = $1`

	rows := r.db.QueryRow(queryStatement, email)
	var user User 
	err := rows.Scan(
		&user.ID, &user.Username, &user.Email, 
		&user.Password, &user.CreatedAt, 
		&user.Profile.Bio, &user.Profile.Karma,
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

func (r *SQLUserRepository) UpdateUser(user *User) error {
	ctx := context.Background()

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return  err
	}
	defer tx.Rollback()

	queryStatement := `
		UPDATE users SET username = $1, email = $2
		WHERE id = $3
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

	profileStatement := `
		UPDATE profiles SET bio = $1, updated_at = NOW()
		WHERE user_id = $2
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


func (r *SQLUserRepository) DeleteUser(id int) error {
	deleteStatement := `DELETE FROM users WHERE id = $1`

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

