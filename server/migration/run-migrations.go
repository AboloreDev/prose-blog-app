package migration

import (
	"database/sql"
	"fmt"
)

type Migrator struct {
	db *sql.DB
}

func NewMigrator(db *sql.DB) *Migrator {
    return &Migrator{db: db}
}

func (r *Migrator) RunMigrations() error {
	_, err := r.db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		return fmt.Errorf("could not enable foreign keys: %w", err)
	}

	_, err = r.db.Exec("PRAGMA journal_mode=WAL")
	if err != nil {
		return fmt.Errorf("failed: %w", err)
	}

	err = r.CreateUsersTable()
	if err != nil {
		return err
	}
	err = r.CreateProfileTable()
	if err != nil {
		return err
	}
	err = r.CreateCommunitiesTable() 
	if err != nil {
		return err
	}
	err = r.CreateCommunityMembersTable()
	if err != nil {
		return err
	}
	err = r.CreatePostsTable()
	if err != nil {
		return err
	}
	err = r.CreateCommentsTable()
	if err != nil {
		return err
	}
	err = r.CreateVotesTable()
	if err != nil {
		return err
	}
	err = r.CreateCommentsVotesTable()
	if err != nil {
		return err
	}
	err = r.CreateFollowersTable()
	if err != nil {
		return err
	}
	err = r.CreateRefreshTokenTable()
	if err != nil {
		return err
	}

	return nil
}

func (r *Migrator) CreateUsersTable() error {
	_, err := r.db.Exec(usersTableSchema)
	if err != nil {
		return fmt.Errorf("could not create users table: %w", err)
	}
	return nil
}

func (r *Migrator) CreateProfileTable() error {
	_, err := r.db.Exec(profileTableSchema)
	if err != nil {
		return fmt.Errorf("could not create profile table: %w", err)
	}
	return nil
}
func (r *Migrator) CreatePostsTable() error {
	_, err := r.db.Exec(postsTableSchema)
	if err != nil {
		return fmt.Errorf("could not create posts table: %w", err)
	}
	return nil
}
func (r *Migrator) CreateCommentsTable() error {
	_, err := r.db.Exec(commentsTableSchema)
	if err != nil {
		return fmt.Errorf("could not create comments table: %w", err)
	}
	return nil
}
func (r *Migrator) CreateVotesTable() error {
	_, err := r.db.Exec(votesTableSchema)
	if err != nil {
		return fmt.Errorf("could not create votes table: %w", err)
	}
	return nil
}
func (r *Migrator) CreateCommentsVotesTable() error {
	_, err := r.db.Exec(commentsVotesTableSchema)
	if err != nil {
		return fmt.Errorf("could not create commnets_votes table: %w", err)
	}
	return nil
}
func (r *Migrator) CreateFollowersTable() error {
	_, err := r.db.Exec(followersTableSchema)
	if err != nil {
		return fmt.Errorf("could not create followers table: %w", err)
	}
	return nil
}
func (r *Migrator) CreateRefreshTokenTable() error {
	_, err := r.db.Exec(refreshTokensTableSchema)
	if err != nil {
		return fmt.Errorf("could not create refresh_token table: %w", err)
	}
	return nil
}
func (r *Migrator) CreateCommunitiesTable() error {
	_, err := r.db.Exec(communitiesTableSchema)
	if err != nil {
		return fmt.Errorf("could not create communities table: %w", err)
	}
	return nil
}
func (r *Migrator) CreateCommunityMembersTable() error {
	_, err := r.db.Exec(communityMembersTableSchema)
	if err != nil {
		return fmt.Errorf("could not create community_members table: %w", err)
	}
	return nil
}


