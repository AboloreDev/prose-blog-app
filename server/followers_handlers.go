package main

import (
	"net/http"
	"prose-blog/helpers"
	"prose-blog/middleware"
	"strconv"
)

func (app *Application) FollowUser(w http.ResponseWriter, r *http.Request) {
    followerID := r.Context().Value(middleware.UserID).(int)

    followingID, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Invalid User ID", http.StatusBadRequest)
        return
    }

    if followerID == followingID {
        http.Error(w, "Cannot follow yourself", http.StatusBadRequest)
        return
    }

    err = app.followersRepo.FollowUser(followerID, followingID)
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    helpers.WriteJSON(w, http.StatusOK, map[string]string{
        "message": "User followed successfully",
    })
}

func (app *Application) UnfollowUser(w http.ResponseWriter, r *http.Request) {
    followerID := r.Context().Value(middleware.UserID).(int)

    followingID, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Invalid User ID", http.StatusBadRequest)
        return
    }

    err = app.followersRepo.UnfollowUser(followerID, followingID)
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    helpers.WriteJSON(w, http.StatusOK, map[string]string{
        "message": "User unfollowed successfully",
    })
}

func (app *Application) GetFollowers(w http.ResponseWriter, r *http.Request) {
    userID, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Invalid User ID", http.StatusBadRequest)
        return
    }

    followers, err := app.followersRepo.GetFollowers(userID)
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    helpers.WriteJSON(w, http.StatusOK, followers)
}

func (app *Application) GetFollowing(w http.ResponseWriter, r *http.Request) {
    userID, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Invalid User ID", http.StatusBadRequest)
        return
    }

    following, err := app.followersRepo.GetFollowing(userID)
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    helpers.WriteJSON(w, http.StatusOK, following)
}

func (app *Application) GetFollowCount(w http.ResponseWriter, r *http.Request) {
    userID, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Invalid User ID", http.StatusBadRequest)
        return
    }

    followingList, err := app.followersRepo.GetFollowCount(userID)
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    helpers.WriteJSON(w, http.StatusOK, followingList)
}

func (app *Application) IsFollowing(w http.ResponseWriter, r *http.Request) {
    followerID := r.Context().Value(middleware.UserID).(int)

    followingID, err := strconv.Atoi(r.PathValue("id"))
    if err != nil {
        http.Error(w, "Invalid User ID", http.StatusBadRequest)
        return
    }

    if followerID == followingID {
        http.Error(w, "Cannot follow yourself", http.StatusBadRequest)
        return
    }

   found ,err := app.followersRepo.IsFollowing(followerID, followingID)
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

   helpers.WriteJSON(w, http.StatusOK, map[string]bool{"isFollowing": found})
}