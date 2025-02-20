package handlers

import (
	"encoding/json"
	"net/http"
)

func respondError(w http.ResponseWriter, status int, msg string, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"error":   msg,
		"details": err.Error(),
	})
}
