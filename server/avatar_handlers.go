package main

import (
	"net/http"
	"prose-blog/helpers"
)

func (app *Application) GetPresetAvatars(w http.ResponseWriter, r *http.Request) {
    helpers.WriteJSON(w, http.StatusOK, map[string]interface{}{
        "avatars": helpers.PresetAvatars,
    })
}