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
	MetaData posts.MetaData
	Next string
	Prev string
}
type FetchedCommunityPostData struct {
	CommunityPosts []posts.PostDetails
	MetaData posts.MetaData
	Next string
	Prev string
}
type FetchedUserPostData struct {
	UserPosts []posts.PostDetails
	MetaData posts.MetaData
	Next string
	Prev string
}

type CreatePostRequest struct {
	Title string `json:"title"`
	Body string	`json:"body"`
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
	
	var createRequest CreatePostRequest
	err := helpers.ReadJSON(r, &createRequest)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if createRequest.Status == "" {
		createRequest.Status = "published"
	}

	if createRequest.Status == "scheduled" {
		if createRequest.PublishAt.IsZero() {
			http.Error(w, "publish_at works for scheduled posts", http.StatusBadRequest)
			return
		}

		if createRequest.PublishAt.Before(time.Now()) {
			http.Error(w, "publish_at must be a future date", http.StatusBadRequest)
			return
		}
	}

	postId, err := app.postRepo.CreatePost(userId, createRequest.Title, createRequest.Body, createRequest.CommunityId, createRequest.Status)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return 
	}

	if createRequest.Status == "scheduled" {
		app.SchedulePost(postId, createRequest.PublishAt)
	}

	helpers.WriteJSON(w, http.StatusOK, CreatePostResponse{PostId: postId})
}

func (app *Application) Homepage(w http.ResponseWriter, r *http.Request) {

	filter := posts.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allPosts, metadata, err := app.postRepo.GetAllPost(filter)
	if err != nil {
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
		http.Error(w, "Post Not Found", http.StatusNotFound)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, post)

	go func (){
		app.postRepo.IncrementViewCount(id)
	}()
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

	filter := posts.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allCommunityPosts, metadata, err := app.postRepo.GetPostByCommunity(communityId, filter)
	if err != nil {
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

	filter := posts.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allUserPosts, metadata, err := app.postRepo.GetUserPosts(userId, filter)
	if err != nil {
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

	post, err := app.postRepo.GetPostById(postId)
	if err != nil {
		http.Error(w, "Post Not Found", http.StatusNotFound)
		return
	}

	if post.UserID != userId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var updatePostRequest UpdatePostRequest
	err = helpers.ReadJSON(r, &updatePostRequest)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	err = app.postRepo.UpdatePost(&posts.Post{ID: postId, Title: updatePostRequest.Title, Body: updatePostRequest.Body})
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, UpdatePostResponse{
		Message: "Post Updated Successfully",
	})
}

func (app *Application) GetUserPostsDraft(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)

	filter := posts.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allUserPosts, metadata, err := app.postRepo.GetUserPostDrafts(userId, filter)
	if err != nil {
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

	filter := posts.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	allUserScheduledPosts, metadata, err := app.postRepo.GetUserScheduledPosts(userId, filter)
	if err != nil {
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
