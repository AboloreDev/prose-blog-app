package main

import (
	"net/http"
	"prose-blog/community"
	"prose-blog/helpers"
	"prose-blog/middleware"
	"prose-blog/users"
	"strconv"
)

type UpdateUserRequest struct {
	Username string  `json:"username"`
	Email string	 `json:"email"`
	Profile users.Profile `json:"profile"`
}

type UpdateUserResponse struct {
	Message string  `json:"message"`
	Username string  `json:"username"`
	Email string	 `json:"email"`
	Profile users.Profile `json:"profile"`
}

type DeleteUserResponse struct {
	Message string  `json:"message"`
}

type UserResponse struct {
	User users.User
	Communities community.Community
}


func (app *Application) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := app.userRepo.GetAllUsers()
	if err != nil {
		http.Error(w, "Internal Server Error",http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, users)
}

func (app *Application) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)
	
	var update UpdateUserRequest
	app.infoLog.Printf("UpdateUser called — body: %+v", update) 
	err := helpers.ReadJSON(r, &update)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	if update.Profile.Avatar_url != "" && !helpers.IsValidAvatar(update.Profile.Avatar_url){
		app.infoLog.Printf("Invalid avatar: %s", update.Profile.Avatar_url)
        http.Error(w, "Invalid avatar URL", http.StatusBadRequest)
        return
    }
	
	user, err := app.userRepo.GetUserById(userId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if update.Username == "" {
		update.Username = user.Username
	}
	if update.Email == "" {
		update.Email = user.Email
	}
	if update.Profile.Bio == "" {
		update.Profile.Bio = user.Profile.Bio
	}
	if update.Profile.Avatar_url == "" {
		update.Profile.Avatar_url = user.Profile.Avatar_url
	}

	err = app.userRepo.UpdateUser(&users.User{ID: userId, Username: update.Username, Email: update.Email, Profile: users.Profile{Bio: update.Profile.Bio, Avatar_url: update.Profile.Avatar_url}})
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	
	helpers.WriteJSON(w, http.StatusOK, UpdateUserResponse{
		Message: "User updated successfully",
		Username: update.Username,
		Email: update.Email,
		Profile: update.Profile,
	})
}


func (app *Application) GetUserById(w http.ResponseWriter, r *http.Request) {
	userId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Invalid User Id", http.StatusNotFound)
		return
	}

	user, err := app.userRepo.GetUserById(userId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	communities, err := app.commRepo.GetUserCommunities(userId)
	if err != nil {
		http.Error(w, "Invalid UserId", http.StatusInternalServerError)
		return 
	}

	helpers.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user":        user,
		"communities": communities,
	})
}

func (app *Application) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value(middleware.UserID).(int)


	err := app.userRepo.DeleteUser(userId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, DeleteUserResponse{
		Message: "User deleted successfully",
		
	})
}