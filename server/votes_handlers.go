package main

import (
	"net/http"
	"prose-blog/helpers"
	"prose-blog/middleware"
	"prose-blog/votes"
	"strconv"
)


type CreateVoteRequest struct{
	Vote_Type string `json:"vote_type"`
}

type CreateVoteResponse struct {
	Message string `json:"message"`
	PostId int `json:"post_id"`
	CommentId int `json:"comment_id"`
	UserId int `json:"user_id"`
	Vote_Type string `json:"vote_type"`
}

type FetchedVotesData struct {
	Votes []votes.CommentVotes
}

func (app *Application) VotePost(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)

	postId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Post ID", http.StatusBadRequest)
		return
	}

	post, err := app.postRepo.GetPostById(postId)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Post Not Found", http.StatusNotFound)
		return
	}

	var cv CreateVoteRequest
	err = helpers.ReadJSON(r, &cv)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	err = app.votesRepo.VoteAPost(userId, post.ID, cv.Vote_Type)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusCreated, CreateVoteResponse{
		Message: "Vote Created Successfully",
		PostId: postId,
		UserId: userId,
		Vote_Type: cv.Vote_Type,
	})
}

func (app *Application) GetAllPostVote(w http.ResponseWriter, r *http.Request) {
	postId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Post ID", http.StatusBadRequest)
		return
	}

	post, err := app.postRepo.GetPostById(postId)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Post Not Found", http.StatusNotFound)
		return
	}

	votesList, err := app.votesRepo.GetPostVotes(post.ID)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusCreated, votesList)
}

func (app *Application) VoteComment(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)

	commentId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	comment, err := app.commentRepo.GetCommentById(commentId)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Comment Not Found", http.StatusNotFound)
		return
	}

	var cv CreateVoteRequest
	err = helpers.ReadJSON(r, &cv)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	err = app.votesRepo.VoteAComment( userId, comment.ID, cv.Vote_Type)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusCreated, CreateVoteResponse{
		Message: "Vote Created Successfully",
		CommentId: comment.ID,
		UserId: userId,
		Vote_Type: cv.Vote_Type,
	})
}

func (app *Application) GetAllCommentVote(w http.ResponseWriter, r *http.Request) {
	commentId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid Comment ID", http.StatusBadRequest)
		return
	}

	comment, err := app.commentRepo.GetCommentById(commentId)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Comment Not Found", http.StatusNotFound)
		return
	}

	votesList, err := app.votesRepo.GetPostComments(comment.ID)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, "Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, votesList)
}
