package main

import (
	"net/http"
	"prose-blog/auth"
	"prose-blog/helpers"
	"strings"
	"time"
)

type RegisterUser struct {
	Username string  `json:"username"`
	Email string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Message string `json:"message"`
	Username string  `json:"username"`
	Email string `json:"email"`
	AccessToken string `json:"access_token"`
	UserID int `json:"user_id"`
}

type LoginRequest struct {
	Email string `json:"email"`
	Password string `json:"password"`
}

func (app *Application) RegisterUser(w http.ResponseWriter, r *http.Request) {
	var register RegisterUser
	err := helpers.ReadJSON(r, &register)
	if err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	userID, err := app.userRepo.CreateUser(register.Username, register.Email, register.Password, "", 0)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			http.Error(w, "Email Already Exists", http.StatusConflict)
			return
		}
		app.errorLog.Printf("Failed to register user %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	accessToken, err := auth.GenerateAccessToken(userID) 
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	err = app.authRepo.SaveRefreshToken(userID, refreshToken, time.Now().Add(7 * 24 * time.Hour))
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name: "refresh_token",
		Value: refreshToken,
		Expires: time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
		Secure: false,
		Path: "/",
		SameSite: http.SameSiteLaxMode,
	})

	helpers.WriteJSON(w, http.StatusCreated, AuthResponse{
		AccessToken: accessToken,
		UserID: userID,
		Username: register.Username,
		Email: register.Email,
		Message: "User Created Successfully",
	})
}

func (app *Application) LoginUser(w http.ResponseWriter, r *http.Request) {
	var login LoginRequest
	err := helpers.ReadJSON(r, &login)
	if err != nil {
		http.Error(
			w, "Bad Request", http.StatusBadRequest, 
		)
		return
	}

	userID, err := app.userRepo.Authenticate(login.Email, login.Password)
	if err != nil {
		app.errorLog.Printf("User authentication failed %v", err)
		http.Error(
			w, "Invalid Username or Password", http.StatusBadRequest, 
		)
		return
	}

	user, err := app.userRepo.GetUserById(userID)
	if err != nil {
		app.errorLog.Printf("User Id not found %v", err)
		http.Error(
				w, "UserId not foUnd", http.StatusNotFound, 
			)
		return
	}

	accessToken, err := auth.GenerateAccessToken(user.ID)
	if err != nil {
		http.Error(
				w, "Internal Server Error", http.StatusInternalServerError, 
			)
		return
	}

	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		http.Error(
				w, "Internal Server Error", http.StatusInternalServerError, 
			)
		return
	}

	err = app.authRepo.SaveRefreshToken(user.ID, refreshToken, time.Now().Add(7 * 24 * time.Hour))
	if err != nil {
		http.Error(	w, "Internal Server Error", http.StatusInternalServerError, )
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name: "refresh_token",
		Value: refreshToken,
		Path: "/",
		Secure: false,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires: time.Now().Add(7 * 24 * time.Hour),
	})

	helpers.WriteJSON(w, http.StatusOK, AuthResponse{
	AccessToken: accessToken,
		UserID: userID,
		Username: user.Username,
		Email: login.Email,
		Message: "User Logged In Successfully",
	})
}

func (app *Application) LogoutUser(w http.ResponseWriter, r *http.Request) {
	token, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err = app.authRepo.DeleteRefreshToken(token.Value)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name: "",
		Value: "",
		MaxAge: -1,
		Path: "/",
	})

	helpers.WriteJSON(w, http.StatusOK, AuthResponse{
		Message: "User Logged Out Successfully",
	})
}

func (app *Application) RefreshToken(w http.ResponseWriter, r *http.Request) {
	token, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	refreshToken, err := app.authRepo.GetRefreshToken(token.Value)
	if err != nil {
		app.errorLog.Printf("Failed to get refresh token %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if time.Now().After(refreshToken.ExpiresAt) {
    	http.Error(w, "Token expired", http.StatusUnauthorized)
    	return
	}

	newRefreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	accessToken, err := auth.GenerateAccessToken(refreshToken.UserId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	err = app.authRepo.DeleteRefreshToken(token.Value)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	err = app.authRepo.SaveRefreshToken(refreshToken.UserId, newRefreshToken, time.Now().Add(7 * 24 * time.Hour))
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
    Name:     "refresh_token",
    Value:    newRefreshToken,
    Expires:  time.Now().Add(7 * 24 * time.Hour),
    HttpOnly: true,
    Secure:   false,
    Path:     "/",
    SameSite: http.SameSiteLaxMode,
	})

	helpers.WriteJSON(w, http.StatusOK, AuthResponse{
		AccessToken: accessToken,
		UserID: refreshToken.UserId,
	})
}