package main

import (
	"net/http"
	"prose-blog/helpers"
	"prose-blog/karma"
	"prose-blog/middleware"
	"prose-blog/notifications"
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

	if post.UserID != userId {
		user, err := app.userRepo.GetUserById(userId)
		if err != nil {
				app.errorLog.Println(err)
			http.Error(w, "You cant send notifcation to yourself", http.StatusBadRequest)
			return
		} else {
			typeOfNotification := "post_upvote"
				if cv.Vote_Type == "down" {
					typeOfNotification = "post_downvote"
				}
				message := helpers.BuildNotificationMessage(user.Username, typeOfNotification)
				app.notificationWorker.Send(notifications.NotificationJob{
					SenderID: userId,
					ReceiverID: post.UserID,
					Message: message,
					NotificationType: typeOfNotification,
					SenderName: user.Username,
					ReceiverName: post.Author,
					PostID: &postId,
					CommentID: nil,
				})
				app.infoLog.Printf("Notification sent to user %v, %s", post.UserID, post.Author)
		}
	}

	if post.UserID != userId {
		delta := 1
		if cv.Vote_Type == "down" {
			delta = -1
		}
		app.karmaWorker.Send(karma.KarmaEvent{
			UserID: post.UserID,
			Delta:  delta,
		})
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

	if comment.UserId != userId {
		user, err := app.userRepo.GetUserById(userId)
		if err != nil {
			app.errorLog.Println(err)
			http.Error(w, "You cant send notifcation to yourself", http.StatusBadRequest)
			return
		} else {
			notificationType := "comment_upvote"
			if cv.Vote_Type == "down" {
				notificationType = "comment_downvote"
			}
			message := helpers.BuildNotificationMessage(user.Username, notificationType)
			app.notificationWorker.Send(notifications.NotificationJob{
				Message: message,
				SenderID: userId,
				ReceiverID: comment.UserId,
				SenderName: user.Username,
				ReceiverName: comment.Author,
				PostID: nil,
				CommentID: &comment.ID,
			})
			app.infoLog.Printf("Notification sent to user %v, %s", comment.UserId, comment.Author)
		}
	}

	if comment.UserId != userId {
		delta := 1
		if cv.Vote_Type == "down" {
			delta = -1
		}
		app.karmaWorker.Send(karma.KarmaEvent{
			UserID: comment.UserId,
			Delta:  delta,
		})
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
