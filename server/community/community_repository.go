package community

import (
	"database/sql"
	"errors"
	"fmt"
	"math"
	"strings"
)

var ErrDuplicateName = errors.New("Duplicate Community Name") 
var ErrDuplicateSlug = errors.New("Duplicate Community Slug") 
var ErrNoRowsAvailable = errors.New("No Rows Available")
var ErrInvalidPageRange = errors.New("invalid page range: 1 to 100 max")

type CommunityRepository interface {
	CreateCommunity(name, slug, description, banner string, createdBy int) (int, error)
	GetCommunityBySlug(communitySlug string) (*Community, error)
	GetCommunityById(communityId int) (*Community, error)
	GetAllCommunities(filter Filter) ([]Community, MetaData, error)
	JoinACommunity(userId int, communityId int, role string) error
	LeaveACommunity(userId, communityId int) error
	GetAllCommunityMembers(communityId int) ([]CommunityMember, error) 
	DeleteACommunity(communityId int) error 
	UpdateACommunity(cm *Community) error 
}

type SQLCommunityRepository struct {
	db *sql.DB
}

func NewSQLCommunityRepository(db *sql.DB) CommunityRepository {
	return &SQLCommunityRepository{ db: db}
}

func (f *Filter) Validate() error {
	if f.PageSize <= 0 || f.PageSize >= 100 {
		return ErrInvalidPageRange
	}
	return nil
}

func calculateMetaData(totalRecords, page, pageSize int) MetaData {
	meta := MetaData{
		CurrentPage:  page,
		PageSize:     pageSize,
		FirstPage:    1,
		LastPage:     int(math.Ceil(float64(totalRecords) / float64(pageSize))),
		TotalRecords: totalRecords,
	}
	meta.NextPage = meta.CurrentPage + 1
	meta.PreviousPage = meta.CurrentPage - 1
	if meta.CurrentPage <= meta.FirstPage {
		meta.PreviousPage = 0
	}
	if meta.CurrentPage >= meta.LastPage {
    meta.NextPage = 0
	}

	return meta
}

func (r *SQLCommunityRepository) CreateCommunity(name, slug, description, banner string, createdBy int) (int, error) {
	queryStatement := `
		INSERT INTO communities (name, slug, description, banner, created_by) 
		VALUES ($1, $2, $3, $4, $5) RETURNING id
	`

	var communityId int
	row := r.db.QueryRow(queryStatement, name, slug, description, banner, createdBy)

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
		SELECT cm.id, cm.name, cm.slug, cm.description, cm.banner, cm.member_count, 
		cm.created_by, cm.created_at, u.username AS community_creator
		FROM communities AS cm
		INNER JOIN users AS u ON cm.created_by = u.id
		WHERE cm.slug = $1
	`

	rows := r.db.QueryRow(queryStatement, communitySlug)

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
		SELECT cm.id, cm.name, cm.slug, cm.description, cm.banner, cm.member_count, 
		cm.created_by, cm.created_at, u.username AS community_creator
		FROM communities AS cm
		INNER JOIN users AS u ON cm.created_by = u.id
		WHERE cm.id = $1
		GROUP BY cm.id, u.username
		ORDER BY cm.created_at DESC
	`

	rows := r.db.QueryRow(queryStatement, communityId)

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

func (r *SQLCommunityRepository) GetAllCommunities(filter Filter) ([]Community, MetaData, error) {
	err := filter.Validate()
	if err != nil {
		return nil, MetaData{}, err
	}

	queryStatement := `
		SELECT COUNT(*) OVER() AS total_records,
		cm.id, cm.name, cm.slug, cm.description, cm.banner, cm.member_count,
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

	rows, err := r.db.Query(queryStatement, args...)
	if err != nil {
		return nil, MetaData{}, err
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
			return nil, MetaData{}, err
		}
		community.TotalRecords = totalRecords
		communities = append(communities, community)
	}
	err = rows.Err()
	if err != nil {
    return nil, MetaData{}, err
	}

	if len(communities) == 0 {
		return []Community{}, MetaData{}, nil
	}

	meta := calculateMetaData(totalRecords, filter.Page, filter.PageSize)

	return communities, meta, nil
}

func (r *SQLCommunityRepository) JoinACommunity(userId int, communityId int, role string) error {
	queryStatement := `
		INSERT INTO community_members (user_id, community_id, role) 
		VALUES ($1, $2, $3)
		`

	_, err := r.db.Exec(queryStatement, userId, communityId, role)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLCommunityRepository) LeaveACommunity(userId, communityId int) error {
	queryStatement := `
		DELETE FROM community_members 
		WHERE user_id = $1 AND community_id = $2
	`

	rows, err := r.db.Exec(queryStatement, userId, communityId)
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

func (r *SQLCommunityRepository) GetAllCommunityMembers(communityId int) ([]CommunityMember, error) {
	queryStatement := `
		SELECT cm.user_id, cm.community_id, cm.role, cm.joined_at,
		u.username AS name, c.name AS community_name
		FROM community_members AS cm
		INNER JOIN users AS u ON cm.user_id = u.id
		INNER JOIN communities AS c ON cm.community_id = c.id
		WHERE cm.community_id = $1
		GROUP BY cm.user_id, u.username
		ORDER BY cm.joined_at
	`

	rows, err  := r.db.Query(queryStatement, communityId)
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

	rows, err := r.db.Exec(queryStatement, communityId)
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
		UPDATE communities SET name = $1, slug = $2, description = $3, banner = $4
		WHERE id = $5
	`

	_, err := r.db.Exec(queryStatement, cm.Name, cm.Slug, cm.Description, cm.Banner, cm.ID)
	if err != nil {
		return err
	}

	return nil
}
