package helpers

import (
	"encoding/json"
	"net/http"
)



func WriteJSON(w http.ResponseWriter, status int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	return json.NewEncoder(w).Encode(data)
}

func ReadJSON(r *http.Request, data interface{}) error{
	return json.NewDecoder(r.Body).Decode(data)
}