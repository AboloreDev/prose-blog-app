package main

import (
	"net/http"
	"prose-blog/comments"
	"prose-blog/helpers"
	"prose-blog/middleware"
	"strconv"
)

type CreateCommentRequest struct{
	Body string `json:"body"`
	ParentId *int `json:"parent_id"`
}

type CreateCommentResponse struct {
	Id int `json:"id"`
	Message string `json:"message"`
	PostId int `json:"post_id"`
	UserId int `json:"user_id"`
	Body string `json:"body"`
	ParentId *int `json:"parent_id"`
}

type FetchedCommentsData struct {
	Comments []comments.Comments
	MetaData comments.MetaData
	Next string
	Prev string
}

type UpdateCommentRequest struct {
	Body string	`json:"body"`
}


func (app *Application) CreateComment(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)

	postId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Post ID", http.StatusBadRequest)
		return
	}

	post, err := app.postRepo.GetPostById(postId)
	if err != nil {
		http.Error(w, "Post Not Found", http.StatusNotFound)
		return
	}

	var createComment CreateCommentRequest
	err = helpers.ReadJSON(r, &createComment)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	commentId, err := app.commentRepo.CreateComment(post.ID, userId, createComment.Body, createComment.ParentId)
	if err != nil {
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusCreated, CreateCommentResponse{
		Message: "Comment Created Successfully",
		PostId: postId,
		UserId: userId,
		ParentId: createComment.ParentId,
		Id: commentId,
		Body: createComment.Body,
	})
}

func (app *Application) GetCommentsByPost(w http.ResponseWriter, r *http.Request){
	postId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Post ID", http.StatusBadRequest)
		return
	}

	filter := comments.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	commentsList, metadata, err := app.commentRepo.GetCommentsByPost(postId, filter)
	if err != nil {
		http.Error(w, "Invalid Post Id", http.StatusNotFound)
		return
	}

	next, prev := helpers.BuildCommentsPaginationURLs(filter, metadata)

	helpers.WriteJSON(w, http.StatusOK, FetchedCommentsData{
		Comments: commentsList,
		MetaData: metadata,
		Next: next,
		Prev: prev,
	})
}

func (app *Application) GetCommentById(w http.ResponseWriter, r *http.Request) {
	commentId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	comment, err := app.commentRepo.GetCommentById(commentId)
	if err != nil {
		http.Error(w, "Comment Not Found", http.StatusNotFound)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, comment)
}

func (app *Application) DeleteComment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserID).(int)
	commentId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	comment, err := app.commentRepo.GetCommentById(commentId)
	if err != nil {
		http.Error(w, "Comment Not Found", http.StatusNotFound)
		return
	}

	if comment.UserId != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}


	err = app.commentRepo.DeleteComment(commentId)
	if err != nil {
		http.Error(w, "Comment Not found", http.StatusNotFound)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Comment Deleted Successfully"})
}

func (app *Application) UpdateComment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserID).(int)
	commentId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	cm, err := app.commentRepo.GetCommentById(commentId)
	if cm.UserId != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var comment UpdateCommentRequest
	err = helpers.ReadJSON(r, &comment)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	err = app.commentRepo.UpdateComment(&comments.Comments{ID: commentId, Body: comment.Body})
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Comment Updated Successfully"})
}

func (app *Application) GetNestedComments(w http.ResponseWriter, r *http.Request){
	commentId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	filter := comments.Filter{
		Page: app.ReadWithInt(r, "page", 1),
		PageSize: app.ReadWithInt(r, "page_size", 50),
		Query: r.URL.Query().Get("query"),
		OrderBy: r.URL.Query().Get("order_by"),
	}

	commentsList, metadata, err := app.commentRepo.GetNestedComments(commentId, filter)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	next, prev := helpers.BuildCommentsPaginationURLs(filter, metadata)

	helpers.WriteJSON(w, http.StatusOK, FetchedCommentsData{
		Comments: commentsList,
		MetaData: metadata,
		Next: next,
		Prev: prev,
	})
}