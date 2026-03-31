package followers

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Followers struct {
	Follower string `json:"follower"`
	FollowerId int `json:"follower_id"`
	FollowingId int `json:"following_id"`
	FollowerKarma int `json:"follower_karma"`
	CreatedAt time.Time `json:"created_at"`
}

type FollowCount struct {
    FollowerCount  int `json:"followerCount"`
    FollowingCount int `json:"followingCount"`
}

var ErrNoRows = errors.New("No rows available")

type FollowersRepository interface {
    FollowUser(followerID, followingID int) error
    UnfollowUser(followerID, followingID int) error
    GetFollowers(followingID int) ([]Followers, error)
    GetFollowing(followerID int) ([]Followers, error)
    IsFollowing(followerID, followingID int) (bool, error)
    GetFollowCount(userID int) (*FollowCount, error)
}

type SQLFollowersRepository struct {
	db *sql.DB
}

func NewSQLFollowersRepository(db *sql.DB) FollowersRepository {
	return  &SQLFollowersRepository{db : db}
}

func (r *SQLFollowersRepository) FollowUser(followerId, followingId int) error {
	queryStatement := `
		INSERT INTO followers (follower_id, following_id) VALUES ($1, $2)
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	
	_, err := r.db.ExecContext(ctx, queryStatement, followerId, followingId)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLFollowersRepository) UnfollowUser(followerId, followingId int) error {
	queryStatement := `
	DELETE FROM followers 
	WHERE follower_id = $1 AND following_id = $2`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err := r.db.ExecContext(ctx, queryStatement, followerId, followingId)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLFollowersRepository) GetFollowers(followingId int) ([]Followers, error) {
	queryStatement := `
		SELECT f.follower_id, f.following_id, f.created_at, 
		u.username AS follower, p.karma AS follower_karma
		FROM followers AS f
		INNER JOIN users AS u ON f.follower_id = u.id
		INNER JOIN profiles AS p ON f.follower_id = p.user_id
		WHERE following_id = $1
		ORDER BY f.created_at, u.username
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, followingId)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var followers []Followers
	for rows.Next(){
		var fw Followers
		err := rows.Scan(
			&fw.FollowerId, &fw.FollowingId, &fw.CreatedAt, &fw.Follower, &fw.FollowerKarma,
		)
		if err != nil {
			return nil, err
		}

		followers = append(followers, fw)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return followers, nil
} 

func (r *SQLFollowersRepository) GetFollowing(followerId int) ([]Followers, error) {
	queryStatement := `
		SELECT f.follower_id, f.following_id, f.created_at, 
		u.username AS following, p.karma AS following_karma
		FROM followers AS f
		INNER JOIN users AS u ON f.following_id = u.id
		INNER JOIN profiles AS p ON f.following_id = p.user_id
		WHERE follower_id = $1
		ORDER BY f.created_at
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, followerId)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var following []Followers
	for rows.Next(){
		var fw Followers
		err := rows.Scan(
			&fw.FollowerId, &fw.FollowingId, &fw.CreatedAt, &fw.Follower, &fw.FollowerKarma,
		)
		if err != nil {
			return nil, err
		}

		following = append(following, fw)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return following, nil
} 

func (r *SQLFollowersRepository) IsFollowing(followerID, followingID int) (bool, error) {
    statement := `
        SELECT COUNT(*) FROM followers
        WHERE follower_id = $1 AND following_id = $2
    `
    var count int

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

    err := r.db.QueryRowContext(ctx, statement, followerID, followingID).Scan(&count)
    if err != nil {
        return false, err
    }

    return count > 0, nil
}

func (r *SQLFollowersRepository) GetFollowCount(userID int) (*FollowCount, error) {
    statement := `
        SELECT
            (SELECT COUNT(*) FROM followers WHERE following_id = $1) AS follower_count,
            (SELECT COUNT(*) FROM followers WHERE follower_id = $2)  AS following_count
    	`

    var count FollowCount

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

    err := r.db.QueryRowContext(ctx, statement, userID, userID).Scan(
        &count.FollowerCount,
        &count.FollowingCount,
    )
    if err != nil {
        return nil, err
    }

    return &count, nil
}