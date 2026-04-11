package main

import (
	"net/http"
	"prose-blog/helpers"
	"prose-blog/middleware"
	"strconv"
)

func(app *Application) GetUserNotifications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserID).(int)

	userNotifications, err := app.notificationsRepo.GetUserNotifications(userID)
	if err != nil {
		app.errorLog.Printf("Error getting user notifications %v", err)
		http.Error(w, "Unauthorised", http.StatusUnauthorized)
		return
	}
	helpers.WriteJSON(w, http.StatusOK, userNotifications)
}

func (app *Application) GetNotificationById(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserID).(int)

	notificationID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		app.errorLog.Printf("Invalid notification ID %v", err)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	notification, err := app.notificationsRepo.GetNotificationById(notificationID, userID)
	if err != nil {
		app.errorLog.Printf("Error getting notifications %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	helpers.WriteJSON(w, http.StatusOK, notification)
}

func (app *Application) MarkAllAsRead(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserID).(int)

	err := app.notificationsRepo.MarkAllAsRead( userID)
	if err != nil {
		app.errorLog.Printf("Error getting notifications %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}


	helpers.WriteJSON(w, http.StatusOK, map[string]string{"message": "Success"})
}

