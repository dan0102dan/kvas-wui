package main

import (
	"encoding/json"
	"net/http"
	"os/exec"
)

func respondJSON(w http.ResponseWriter, code int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(data)
}

func commandHandler(w http.ResponseWriter, r *http.Request) {
	cmdStr := r.URL.Query().Get("command")
	if cmdStr == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "command parameter required"})
		return
	}

	output, err := exec.Command("sh", "-c", cmdStr).CombinedOutput()
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"error":  err.Error(),
			"output": string(output),
		})
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"output": string(output)})
}
