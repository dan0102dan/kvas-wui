package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, fmt.Sprintf("encoding error: %v", err), http.StatusInternalServerError)
	}
}

func respondError(w http.ResponseWriter, status int, msg string, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"error":   msg,
		"details": err.Error(),
	})
}