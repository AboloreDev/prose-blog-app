package main

import (
	"net/http"
	"prose-blog/helpers"
	"prose-blog/middleware"
	"prose-blog/posts"
	"strconv"
	"time"
)

type FetchedPostData struct {
	Posts []posts.PostDetails
	MetaData helpers.MetaData
	Next string
	Prev string
}
type FetchedCommunityPostData struct {
	CommunityPosts []posts.PostDetails
	MetaData helpers.MetaData
	Next string
	Prev string
}
type FetchedUserPostData struct {
	UserPosts []posts.PostDetails
	MetaData helpers.MetaData
	Next string
	Prev string
}

type CreatePostRequest struct {
	Title string `json:"title"`
	Body string	`json:"body"`
	Image_Url string `json:"image_url"`
	CommunityId int `json:"community_id"`
	Status string `json:"status"`
	PublishAt   time.Time `json:"publish_at"`
}

type UpdatePostRequest struct {
	Title string `json:"title"`
	Body string	`json:"body"`
}

type CreatePostResponse struct {
	PostId int `json:"post_id"`
	Title string `json:"title"`
	Body string	`json:"body"`
	Image_Url string `json:"image_url"`
	CommunityId int `json:"community_id"`
	Status string `json:"status"`
	PublishAt   time.Time `json:"publish_at"`
	Message string `json:"message"`
}

type DeletePostResponse struct {
	Message string `json:"message"`
}

type UpdatePostResponse struct {
	Message string `json:"message"`
}

func (app *Application) ReadWithInt(r *http.Request, key string, value int) int {
	number, err := strconv.Atoi(r.URL.Query().Get(key))
	if err != nil {
		return value
	}
	return number
}

func (app *Application) CreatePost(w http.ResponseWriter, r *http.Request) {
    userId := r.Context().Value(middleware.UserID).(int)

    err := r.ParseMultipartForm(10 << 20)
    if err != nil {
        http.Error(w, "File must not be more than 10mb", http.StatusBadRequest)
        return
    }

    title := r.FormValue("title")
    body := r.FormValue("body")
    status := r.FormValue("status")
    communityID, _ := strconv.Atoi(r.FormValue("community_id"))

    if status == "" {
        status = "published"
    }

    if title == "" || body == "" || communityID == 0 {
        http.Error(w, "title, body and community_id are required", http.StatusBadRequest)
        return
    }

    isMember, err := app.commRepo.IsMember(userId, communityID)
    if err != nil {
        app.errorLog.Println(err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }
    if !isMember {
        http.Error(w, "Join this community before posting", http.StatusForbidden)
        return
    }

    imageURL := ""
    file, _, err := r.FormFile("image")
    if err == nil {
        defer file.Close()
        imageURL, err = helpers.UploadImage(file)
        if err != nil {
            http.Error(w, "Image upload failed", http.StatusInternalServerError)
            return
        }
    }

    var publishAtPtr *time.Time
    publishAtStr := r.FormValue("publish_at")

    if status == "scheduled" {
        if publishAtStr == "" {
            http.Error(w, "publish_at required for scheduled posts", http.StatusBadRequest)
            return
        }

        publishAt, err := time.Parse(time.RFC3339, publishAtStr)
        if err != nil {
            http.Error(w, "publish_at must be RFC3339 format e.g 2026-03-27T02:00:00Z", http.StatusBadRequest)
            return
        }

        if publishAt.Before(time.Now()) {
            http.Error(w, "publish_at must be a future date", http.StatusBadRequest)
            return
        }

        publishAtPtr = &publishAt
    }

    postID, err := app.postRepo.CreatePost(userId, title, body, imageURL, communityID, status, publishAtPtr)
    if err != nil {
        app.errorLog.Println(err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    if status == "scheduled" {
        app.infoLog.Printf("schedule countdown started for post %d", postID)
        app.SchedulePost(postID, *publishAtPtr)
    }

    helpers.WriteJSON(w, http.StatusCreated, map[string]interface{}{
        "message":      "Post Created Successfully",
        "post_id":      postID,
        "title":        title,
        "body":         body,
        "image_url":    imageURL,
        "community_id": communityID,
        "status":       status,
        "publish_at":   publishAtStr,
    })
}

func (app *Application) Homepage(w http.ResponseWriter, r *http.Request) {

	filter := helpers.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allPosts, metadata, err := app.postRepo.GetAllPost(filter)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	app.infoLog.Printf("\nMetadata: %+v\n", metadata)
	
	next, prev := helpers.BuildPostsPaginationURLs(filter, metadata)

	helpers.WriteJSON(w, http.StatusOK, &FetchedPostData{
		Posts: allPosts,
		MetaData: metadata,
		Next: next, 
		Prev: prev,
	})	
}

func (app *Application) GetSinglePost(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	post, err := app.postRepo.GetPostById(id)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Post Not Found", http.StatusNotFound)
		return
	}

	go func (){
		app.postRepo.IncrementViewCount(id)
	}()
	
	helpers.WriteJSON(w, http.StatusOK, post)

}

func (app *Application) DeletePost(w http.ResponseWriter, r *http.Request) {
	postId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Id", http.StatusBadRequest)
		return
	}

	userId := r.Context().Value(middleware.UserID).(int)

	post, err := app.postRepo.GetPostById(postId)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	if post.UserID != userId {
		http.Error(w, "Forbidden", http.StatusForbidden)
    	return
	}

	if post.Status == "scheduled" {
		app.CancelScheduledPost(postId)
	}

	err = app.postRepo.DeletePost(postId)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "ID not found", http.StatusNotFound)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, DeletePostResponse{
		Message: "Post Deleted Successfully",
	})
}

func (app *Application) GetPostByCommunity(w http.ResponseWriter, r *http.Request) {
	communityId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Community Id", http.StatusBadRequest)
		return
	}

	filter := helpers.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allCommunityPosts, metadata, err := app.postRepo.GetPostByCommunity(communityId, filter)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Community not found", http.StatusNotFound)
		return
	}

	app.infoLog.Printf("\nMetadata: %+v\n", metadata)
	
	next, prev := helpers.BuildPostsPaginationURLs(filter, metadata)

	helpers.WriteJSON(w, http.StatusOK, &FetchedCommunityPostData{
		CommunityPosts: allCommunityPosts,
		MetaData: metadata,
		Next: next, 
		Prev: prev,
	})	
}

func (app *Application) GetUserPosts(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)

	filter := helpers.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allUserPosts, metadata, err := app.postRepo.GetUserPosts(userId, filter)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	app.infoLog.Printf("\nMetadata: %+v\n", metadata)
	
	next, prev := helpers.BuildPostsPaginationURLs(filter, metadata)

	helpers.WriteJSON(w, http.StatusOK, &FetchedUserPostData{
		UserPosts: allUserPosts,
		MetaData: metadata,
		Next: next, 
		Prev: prev,
	})	
}

func (app *Application) UpdateAPost(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)

	postId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Post Id", http.StatusBadRequest)
		return
	}

	err = r.ParseMultipartForm(10 << 20)
    if err != nil {
        r.ParseForm()
    }

	title := r.FormValue("title")
    body := r.FormValue("body")

	post, err := app.postRepo.GetPostById(postId)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Post Not Found", http.StatusNotFound)
		return
	}

	if post.UserID != userId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	imageUrl := post.Image_url
    file, _, err := r.FormFile("image")
    if err == nil {
        defer file.Close()
        imageUrl, err = helpers.UploadImage(file)
        if err != nil {
            http.Error(w, "Image upload failed", http.StatusInternalServerError)
            return
        }
    }

	if title == "" {
		title = post.Title
	}

	if body == "" {
		body = post.Body
	}

	err = app.postRepo.UpdatePost(&posts.Post{ID: post.ID, Title: title, Body: body, Image_url: imageUrl})
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, UpdatePostResponse{
		Message: "Post Updated Successfully",
	})
}

func (app *Application) GetUserPostsDraft(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)

	filter := helpers.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allUserPosts, metadata, err := app.postRepo.GetUserPostDrafts(userId, filter)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "User not found", http.StatusNotFound)
	}

	app.infoLog.Printf("\nMetadata: %+v\n", metadata)
	
	next, prev := helpers.BuildPostsPaginationURLs(filter, metadata)

	helpers.WriteJSON(w, http.StatusOK, &FetchedUserPostData{
		UserPosts: allUserPosts,
		MetaData: metadata,
		Next: next, 
		Prev: prev,
	})	
}

func (app *Application) GetUserScheduledPosts(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)

	filter := helpers.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allUserScheduledPosts, metadata, err := app.postRepo.GetUserScheduledPosts(userId, filter)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "User not found", http.StatusNotFound)
	}

	app.infoLog.Printf("\nMetadata: %+v\n", metadata)
	
	next, prev := helpers.BuildPostsPaginationURLs(filter, metadata)

	helpers.WriteJSON(w, http.StatusOK, &FetchedUserPostData{
		UserPosts: allUserScheduledPosts,
		MetaData: metadata,
		Next: next, 
		Prev: prev,
	})	
}

func (app *Application) GetAllScheduledPosts(w http.ResponseWriter, r *http.Request) {
	allScheduledPosts, err := app.postRepo.GetScheduledPosts()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Internal server error", http.StatusNotFound)
	}

	helpers.WriteJSON(w, http.StatusOK, allScheduledPosts)	
}
