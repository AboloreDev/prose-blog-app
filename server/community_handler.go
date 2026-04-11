package main

import (
	"net/http"
	"prose-blog/community"
	"prose-blog/helpers"
	"prose-blog/middleware"
	"strconv"
)



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
	MetaData helpers.MetaData
	Next string
	Prev string
}

func (app *Application) CreateCommunity(w http.ResponseWriter, r *http.Request) {
	UserId := r.Context().Value(middleware.UserID).(int)

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		app.errorLog.Printf("file size too large: %v", err)
		http.Error(w, "File must not be more than 10mb", http.StatusBadRequest)
		return
	}

	name := r.FormValue("name")
    slug := r.FormValue("slug")
    description := r.FormValue("description")
	visibility := r.FormValue("visibility")

	if visibility == "" {
		visibility = "public"
	}

	if visibility == "private" {
		visibility = "private"
	}

	if name == "" || slug == "" || description == "" {
        http.Error(w, "title, body and community_id are required", http.StatusBadRequest)
        return
    }

	bannerUrl := ""
    file, _, err := r.FormFile("image")
    if err == nil {
        defer file.Close()
        bannerUrl, err = helpers.UploadImage(file)
        if err != nil {
			app.errorLog.Printf("error uploading image: %v", err)
            http.Error(w, "Image upload failed", http.StatusInternalServerError)
            return
        }
    }

	communityId, err := app.commRepo.CreateCommunity(name, slug, description, bannerUrl, visibility, UserId)
	if err != nil {
		app.errorLog.Printf("failed to create community: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusCreated,  map[string]interface{}{
        "message":      "Community Created Successfully",
        "community_id":    communityId  ,
        "name":        name,
        "slug":         slug,
        "image":    bannerUrl,
		"visibility": visibility,
        "created_by":    UserId,
	})
}

func (app *Application) GetCommunityById(w http.ResponseWriter, r *http.Request) {
	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.errorLog.Printf("invalid community id %v", err)
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}


	community, err := app.commRepo.GetCommunityById(communityId)
	if err != nil {
		app.errorLog.Printf("error getting community by id: %v", err)
		http.Error(w, "Id not found", http.StatusNotFound)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, community)
}

func (app *Application) GetAllCommunities(w http.ResponseWriter, r *http.Request) {

	filter := helpers.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allCommunities, metadata, err := app.commRepo.GetAllCommunities(filter)
	if err != nil {
		app.errorLog.Printf("error getting communities: %v", err)
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
		app.errorLog.Printf("invalid community id: %v", err)
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	err = app.commRepo.JoinACommunity(UserId, communityId, "member")
	if err != nil {
		app.errorLog.Printf("error joining community: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Successfully Joined"})
}

func (app *Application) LeaveCommunity(w http.ResponseWriter, r *http.Request) {
	UserId := r.Context().Value(middleware.UserID).(int)

	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.errorLog.Printf("invalid community id: %v", err)
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	err = app.commRepo.LeaveACommunity(UserId, communityId)
	if err != nil {
		app.errorLog.Printf("error leaving a community: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Successfully Left"})
}

func (app *Application) DeleteCommunity(w http.ResponseWriter, r *http.Request) {
	UserId := r.Context().Value(middleware.UserID).(int)

	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.errorLog.Printf("invalid community id: %v", err)
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	community, err := app.commRepo.GetCommunityById(communityId)
	if err != nil {
		app.errorLog.Printf("error getting community by id: %v", err)
		http.Error(w, "Id not found", http.StatusNotFound)
		return
	}

	if community.CreatedBy != UserId {
		app.errorLog.Printf("forbidden: %v", err)
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	err = app.commRepo.DeleteACommunity(communityId)
	if err != nil {
		app.errorLog.Printf("error deletig community: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Community Deleted Successfully"})
}

func (app *Application) UpdateCommunity(w http.ResponseWriter, r *http.Request) {
	UserId := r.Context().Value(middleware.UserID).(int)

	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.errorLog.Printf("invalid community id: %v", err)
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	err = r.ParseMultipartForm(10 << 20)
    if err != nil {
        r.ParseForm()
    }

	name := r.FormValue("name")
    slug := r.FormValue("slug")
    description := r.FormValue("description")
	visibility := r.FormValue("visibility")

	comm, err := app.commRepo.GetCommunityById(communityId)
	if err != nil {
		app.errorLog.Printf("error getting community by id: %v", err)
		http.Error(w, "Id not found", http.StatusNotFound)
		return
	}

	if comm.CreatedBy != UserId {
		app.errorLog.Printf("forbidden: %v", err)
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	bannerUrl := comm.Banner
    file, _, err := r.FormFile("image")
    if err == nil {
        defer file.Close()
        bannerUrl, err = helpers.UploadImage(file)
        if err != nil {
            http.Error(w, "Image upload failed", http.StatusInternalServerError)
            return
        }
    }

	if name == "" {
        name = comm.Name
    }
    if slug == "" {
        slug = comm.Slug
    }
    if description == "" {
        description = comm.Description
    }

	if visibility == "" {
		visibility = comm.Visibility
	}

	if visibility == "private" {
		visibility = "private"
	}

    err = app.commRepo.UpdateACommunity(&community.Community{
        ID:          comm.ID,
        Name:        name,
        Slug:        slug,
        Description: description,
        Banner:      bannerUrl,
		Visibility:  visibility,
    })
	
	if err != nil {
		app.errorLog.Printf("error updating community: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Successfully Updated"})
}

func (app *Application) GetAllCommunityMembers(w http.ResponseWriter, r *http.Request) {
	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.errorLog.Printf("invalid community id: %v", err)
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	allMembers, err := app.commRepo.GetAllCommunityMembers(communityId)
	if err != nil {
		app.errorLog.Printf("error getting community members: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	

	helpers.WriteJSON(w, http.StatusOK, allMembers)	
}

func (app *Application) GetUserCommunities(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)

	userCommunity, err := app.commRepo.GetUserCommunities(userId)
	if err != nil {
		app.errorLog.Printf("Unauthorised: %v", err)
		http.Error(w, "UnAuthorised", http.StatusUnauthorized)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, userCommunity)	

}