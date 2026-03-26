package main

import (
	"net/http"
	"prose-blog/community"
	"prose-blog/helpers"
	"prose-blog/middleware"
	"strconv"
)

type CreateCommunityRequest struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
	Description string `json:"description"`
	Banner string `json:"banner"`
}

type CreateCommunityResponse struct {
	CommunityId int `json:"community_id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
	Description string `json:"description"`
	Banner string `json:"banner"`
	CreatedBy int `json:"created_by"`
}

type UpdateCommunityRequest struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
	Description string `json:"description"`
	Banner string `json:"banner"`
}

type UpdateCommunityResponse struct {
	CommunityId int `json:"community_id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
	Description string `json:"description"`
	Banner string `json:"banner"`
	CreatedBy int `json:"created_by"`
}

type FetchedCommunitiesData struct {
	Communities []community.Community
	MetaData community.MetaData
	Next string
	Prev string
}

func (app *Application) CreateCommunity(w http.ResponseWriter, r *http.Request) {
	UserId := r.Context().Value(middleware.UserID).(int)

	var createComm CreateCommunityRequest
	err := helpers.ReadJSON(r, &createComm)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	communityId, err := app.commRepo.CreateCommunity(createComm.Name, createComm.Slug, createComm.Description, createComm.Banner, UserId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusCreated, CreateCommunityResponse{
		CommunityId: communityId,
		Name: createComm.Name,
		Slug: createComm.Slug,
		Description: createComm.Description,
		Banner: createComm.Banner,
		CreatedBy: UserId,
	})
}

func (app *Application) GetCommunityById(w http.ResponseWriter, r *http.Request) {
	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}


	community, err := app.commRepo.GetCommunityById(communityId)
	if err != nil {
		http.Error(w, "Id not found", http.StatusNotFound)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, community)
}

func (app *Application) GetAllCommunities(w http.ResponseWriter, r *http.Request) {

	filter := community.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allCommunities, metadata, err := app.commRepo.GetAllCommunities(filter)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	app.infoLog.Printf("\nMetadata: %+v\n", metadata)
	
	next, prev := helpers.BuildCommunitiesPaginationURLs(filter, metadata)

	helpers.WriteJSON(w, http.StatusOK, &FetchedCommunitiesData{
		Communities: allCommunities,
		MetaData: metadata,
		Next: next, 
		Prev: prev,
	})	
}

func (app *Application) JoinCommunity(w http.ResponseWriter, r *http.Request) {
	UserId := r.Context().Value(middleware.UserID).(int)

	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	err = app.commRepo.JoinACommunity(UserId, communityId, "member")
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Successfully Joined"})
}

func (app *Application) LeaveCommunity(w http.ResponseWriter, r *http.Request) {
	UserId := r.Context().Value(middleware.UserID).(int)

	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	err = app.commRepo.LeaveACommunity(UserId, communityId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Successfully Left"})
}

func (app *Application) DeleteCommunity(w http.ResponseWriter, r *http.Request) {
	UserId := r.Context().Value(middleware.UserID).(int)

	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	community, err := app.commRepo.GetCommunityById(communityId)
	if err != nil {
		http.Error(w, "Id not found", http.StatusNotFound)
		return
	}

	if community.CreatedBy != UserId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	err = app.commRepo.DeleteACommunity(communityId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Community Deleted Successfully"})
}

func (app *Application) UpdateCommunity(w http.ResponseWriter, r *http.Request) {
	UserId := r.Context().Value(middleware.UserID).(int)

	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	var cm  UpdateCommunityRequest
	err = helpers.ReadJSON(r, &cm)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	comm, err := app.commRepo.GetCommunityById(communityId)
	if err != nil {
		http.Error(w, "Id not found", http.StatusNotFound)
		return
	}

	if comm.CreatedBy != UserId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}


	err = app.commRepo.UpdateACommunity(&community.Community{ID: comm.ID, Name: cm.Name, Slug: cm.Slug, Description: cm.Description, Banner: cm.Banner})
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Successfully Updated"})
}

func (app *Application) GetAllCommunityMembers(w http.ResponseWriter, r *http.Request) {
	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	allMembers, err := app.commRepo.GetAllCommunityMembers(communityId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	

	helpers.WriteJSON(w, http.StatusOK, allMembers)	
}