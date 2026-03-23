package community

import (
	"database/sql"
	"errors"
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
		VALUES (?, ?, ?, ?, ?)
	`
	result, err := r.db.Exec(queryStatement, name, slug, description, banner, createdBy)
	if err != nil {
		if strings.Contains(err.Error(), "communities.name") {
    	return 0, ErrDuplicateName
		}
		if strings.Contains(err.Error(), "communities.slug") {
    	return 0, ErrDuplicateSlug
		}
		return 0, err
	}

	communityId, err := result.LastInsertId()
	if err != nil {
		return  0, err
	}

	return int(communityId), nil
}

func (r *SQLCommunityRepository) GetCommunityBySlug(communitySlug string) (*Community, error) {
	queryStatement := `
		SELECT cm.id, cm.name, cm.slug, cm.description, cm.banner, cm.member_count, 
		cm.created_by, cm.created_at, u.username AS community_creator
		FROM communities AS cm
		INNER JOIN users AS u ON cm.created_by = u.id
		WHERE cm.slug = ?
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
		cm.created_by, cm.created_at, u.username AS community_creator,
		FROM communities AS cm
		INNER JOIN users AS u ON cm.created_by = u.id
		WHERE cm.id = ?
		GROUP BY cm.id
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

	err = rows.Err()
	if err != nil {
		return nil, ErrNoRowsAvailable
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
		cm.created_by, cm.created_at, u.username AS community_creator,
		FROM communities AS cm
		INNER JOIN users AS u ON cm.created_by = u.id
	`
	var args []interface{}

	if filter.Query != ""{
		queryStatement += " WHERE LOWER(cm.name) LIKE ?"
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
	}

	queryStatement += " ORDER BY cm.created_at DESC"

	if filter.OrderBy == "popular" {
		queryStatement += " cm.created_at DESC"
	}else {
		queryStatement+= " ORDER BY cm.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.PageSize
	limit := filter.PageSize
	queryStatement += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

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
		VALUES (?, ?, ? )
		`
	_, err := r.db.Exec(queryStatement, userId, communityId, role)
	if err != nil {
		return err
	}

	return nil
}

func (r *SQLCommunityRepository) LeaveACommunity(userId, communityId int) error {
	queryStatement := `
		DELETE FROM community_members WHERE user_id = ? AND community_id = ?
	`

	rows, err := r.db.Exec(queryStatement, userId)
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
		WHERE cm.community_id = ?
		GROUP BY cm.user_id
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
		DELETE FROM communities WHERE id = ?
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
		UPDATE communities SET name = ?, slug = ?, description = ?, banner = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(queryStatement, cm.Name, cm.Slug, cm.Description, cm.Banner, cm.ID)
	if err != nil {
		return err
	}

	return nil
}
