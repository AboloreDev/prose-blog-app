package community

import "time"

type Community struct {
	ID int `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
	Description string `json:"description"`
	Banner string `json:"banner_url"`
	CreatedAt time.Time `json:"created_at"`
	MemberCount int `json:"member_count"`
	CreatedBy int `json:"created_by"`
	CommunityCreator string `json:"community_creator"`
	TotalRecords int `json:"total_records"`
}

type Filter struct {
	Page int `json:"page"`
	PageSize int `json:"page_size"`
	OrderBy string `json:"order_by"`
	Query string `json:"query"`
}

type MetaData struct {
	CurrentPage int `json:"current_page"`
	PageSize int `json:"page_size"`
	NextPage int `json:"next_page"`
	PreviousPage int `json:"prev_page"`
	FirstPage int `json:"first_page"`
	LastPage int `json:"last_page"`
	TotalRecords int `json:"total_records"`
}

type CommunityMember struct {
	Name string `json:"name"`
	UserId int `json:"user_id"`
	CommunityId int `jaon:"community_id"`
	CommunityName string `json:"community_name"`
	CommunityRole string `json:"community_roles"`
	JoinedAt time.Time `json:"joined_at"`
}