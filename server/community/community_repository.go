package community

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"prose-blog/helpers"
	"strings"
	"time"
)

var ErrDuplicateName = errors.New("Duplicate Community Name") 
var ErrDuplicateSlug = errors.New("Duplicate Community Slug") 
var ErrNoRowsAvailable = errors.New("No Rows Available")
var ErrInvalidPageRange = errors.New("invalid page range: 1 to 100 max")
var ErrInvalidVisibilityType = errors.New("Invalid Visibility type")

type CommunityRepository interface {
	CreateCommunity(name, slug, description, banner, visibility string, createdBy int) (int, error)
	GetCommunityBySlug(communitySlug string) (*Community, error)
	GetCommunityById(communityId int) (*Community, error)
	GetAllCommunities(filter helpers.Filter) ([]Community, helpers.MetaData, error)
	JoinACommunity(userId int, communityId int, role string) error
	LeaveACommunity(userId, communityId int) error
	GetAllCommunityMembers(communityId int) ([]CommunityMember, error) 
	DeleteACommunity(communityId int) error 
	UpdateACommunity(cm *Community) error 
	IsMember(userId, communityId int) (bool, error)
	GetUserCommunities(userId int) ([]Community, error) 
}

type SQLCommunityRepository struct {
	db *sql.DB
}

func NewSQLCommunityRepository(db *sql.DB) CommunityRepository {
	return &SQLCommunityRepository{ db: db}
}


func (r *SQLCommunityRepository) CreateCommunity(name, slug, description, banner, visibility string, createdBy int) (int, error) {
	queryStatement := `
		INSERT INTO communities (name, slug, description, banner_url, visibility, created_by) 
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
	`

	var communityId int

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	row := r.db.QueryRowContext(ctx, queryStatement, name, slug, description, banner, visibility, createdBy)

	err := row.Scan(&communityId)
	if err != nil {
		if strings.Contains(err.Error(), "communities.name") {
    	return 0, ErrDuplicateName
		}
		if strings.Contains(err.Error(), "communities.slug") {
    	return 0, ErrDuplicateSlug
		}
		return 0, err
	}

	return communityId, nil
}

func (r *SQLCommunityRepository) GetCommunityBySlug(communitySlug string) (*Community, error) {
	queryStatement := `
		SELECT cm.id, cm.name, cm.slug, cm.description, cm.banner_url, cm.member_count, 
		cm.created_by, cm.created_at, u.username AS community_creator
		FROM communities AS cm
		INNER JOIN users AS u ON cm.created_by = u.id
		WHERE cm.slug = $1
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows := r.db.QueryRowContext(ctx, queryStatement, communitySlug)

	var community Community
	err := rows.Scan(
		&community.ID, &community.Name, &community.Slug, & community.Description, 
		&community.Banner, &community.MemberCount, &community.CreatedBy, &community.CreatedAt, &community.CommunityCreator, 
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
        return nil, ErrNoRowsAvailable
    	}
		return nil, err
	}

	return &community, nil
}

func (r *SQLCommunityRepository) GetCommunityById(communityId int) (*Community, error) {
	queryStatement := `
		SELECT cm.id, cm.name, cm.slug, cm.description, cm.banner_url, cm.member_count, 
		cm.created_by, cm.created_at, u.username AS community_creator
		FROM communities AS cm
		INNER JOIN users AS u ON cm.created_by = u.id
		WHERE cm.id = $1
		GROUP BY cm.id, u.username
		ORDER BY cm.created_at DESC
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows := r.db.QueryRowContext(ctx, queryStatement, communityId)

	var community Community
	err := rows.Scan(
		&community.ID, &community.Name, &community.Slug, & community.Description, &community.Banner,
		&community.MemberCount, &community.CreatedBy, &community.CreatedAt, &community.CommunityCreator, 
	)
	if err != nil {
		return nil, err
	}

	return &community, nil
}

func (r *SQLCommunityRepository) GetAllCommunities(filter helpers.Filter) ([]Community, helpers.MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, helpers.MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		cm.id, cm.name, cm.slug, cm.description, cm.banner_url, cm.member_count,
		cm.created_by, cm.created_at, u.username AS community_creator
		FROM communities AS cm
		INNER JOIN users AS u ON cm.created_by = u.id
	`
	var args []interface{}
	argPos := 1

	if filter.Query != "" {
		queryStatement += fmt.Sprintf(" AND LOWER(cm.name) LIKE $%d", argPos)
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
		argPos++
	}

	queryStatement += " GROUP BY cm.id, u.username"

	if filter.OrderBy == "popular" {
		queryStatement += " ORDER BY cm.created_at DESC"
	} else {
		queryStatement += " ORDER BY cm.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	queryStatement += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, filter.PageSize, offset)

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, args...)
	if err != nil {
		return nil, helpers.MetaData{}, err
	}
	defer rows.Close()

	var communities []Community
	var totalRecords int
	for rows.Next() {
		var community Community
		err := rows.Scan(
			&totalRecords, &community.ID, &community.Name, &community.Slug, 
			&community.Description, &community.Banner, &community.MemberCount, 
			&community.CreatedBy, &community.CreatedAt, &community.CommunityCreator,
		)
		if err != nil {
			return nil, helpers.MetaData{}, err
		}
		community.TotalRecords = totalRecords
		communities = append(communities, community)
	}
	err = rows.Err()
	if err != nil {
    return nil, helpers.MetaData{}, err
	}

	if len(communities) == 0 {
		return []Community{}, helpers.MetaData{}, nil
	}

	meta := helpers.CalculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return communities, meta, nil
}

func (r *SQLCommunityRepository) JoinACommunity(userId int, communityId int, role string) error {
	queryStatement := `
		INSERT INTO community_members (user_id, community_id, role) 
		VALUES ($1, $2, $3)
		`
	tx, err := r.db.Begin()
	if err != nil {
		return  err
	}
	defer tx.Rollback()

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err = tx.ExecContext(ctx, queryStatement, userId, communityId, role)
	if err != nil {
		return err
	}

	updateStatement := `
		UPDATE communities SET member_count = member_count + 1
		WHERE id = $1
	`

	ctx, cancel = context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()
	
	_, err = tx.ExecContext(ctx, updateStatement, communityId)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *SQLCommunityRepository) LeaveACommunity(userId, communityId int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return  err
	}
	defer tx.Rollback()

	queryStatement := `
		DELETE FROM community_members 
		WHERE user_id = $1 AND community_id = $2
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.ExecContext(ctx, queryStatement, userId, communityId)
	if err != nil {
		return  err
	}

	rowsAffected, err := rows.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNoRowsAvailable
	}

	updateStatement := `
		UPDATE communities SET member_count = member_count - 1
		WHERE id = $1
	`

	ctx, cancel = context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err = r.db.ExecContext(ctx, updateStatement, communityId)
	if err != nil {
		return  err
	}

	return tx.Commit()
}

func (r *SQLCommunityRepository) GetAllCommunityMembers(communityId int) ([]CommunityMember, error) {
	queryStatement := `
		SELECT cm.user_id, cm.community_id, cm.role, cm.joined_at,
		u.username AS name, c.name AS community_name
		FROM community_members AS cm
		INNER JOIN users AS u ON cm.user_id = u.id
		INNER JOIN communities AS c ON cm.community_id = c.id
		WHERE cm.community_id = $1
		GROUP BY cm.user_id, cm.community_id, u.username, c.name
		ORDER BY cm.joined_at
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err  := r.db.QueryContext(ctx, queryStatement, communityId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var communityMembers []CommunityMember 
	for rows.Next() {
		var cm CommunityMember
		err = rows.Scan(&cm.UserId, &cm.CommunityId, &cm.CommunityRole, &cm.JoinedAt, &cm.Name, &cm.CommunityName)
		if err != nil {
			return nil, err
		}
		communityMembers = append(communityMembers, cm)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return communityMembers, nil
}

func (r *SQLCommunityRepository) DeleteACommunity(communityId int) error {
	queryStatement := `
		DELETE FROM communities WHERE id = $1
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.ExecContext(ctx, queryStatement, communityId)
	if err != nil {
		return  err
	}

	rowsAffected, err := rows.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNoRowsAvailable
	}

	return nil
}

func (r *SQLCommunityRepository) UpdateACommunity(cm *Community) error {
	queryStatement := `
		UPDATE communities SET name = $1, slug = $2, description = $3, banner_url = $4
		WHERE id = $5
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	_, err := r.db.ExecContext(ctx, queryStatement, cm.Name, cm.Slug, cm.Description, cm.Banner, cm.ID)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLCommunityRepository) IsMember(userId, communityId int) (bool, error) {
    statement := `
        SELECT COUNT(*) FROM community_members
        WHERE user_id = $1 AND community_id = $2
    `
    var count int

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

    err := r.db.QueryRowContext(ctx, statement, userId, communityId).Scan(&count)
    if err != nil {
        return false, err
    }
    return count > 0, nil
}

func (r *SQLCommunityRepository) GetUserCommunities(userId int) ([]Community, error) {
	queryStatement := `
	SELECT c.id, c.name, c.slug, c.created_at, cm.role, cm.joined_at
		FROM communities AS c
		INNER JOIN community_members AS cm ON c.id = cm.community_id
		WHERE cm.user_id = $1
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	rows, err := r.db.QueryContext(ctx, queryStatement, userId)
	if err != nil {
		return nil, err
	}

	var communities []Community
	for rows.Next() {
		var community Community
		err := rows.Scan(
			&community.ID, &community.Name, &community.Slug, &community.CreatedAt, 
			&community.Role, &community.JoinedAt,
		)
		if err != nil {
		return nil, err
		}

		communities = append(communities, community)
	}
	
	err = rows.Err()
	if err == sql.ErrNoRows{
		return nil, ErrNoRowsAvailable
	}

	return communities, nil

}