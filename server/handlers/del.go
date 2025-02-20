package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/dan0102dan/kvas-wui/utils"
)

type DelResponse struct {
	Domain string `json:"domain"`
}

func DelHandler(w http.ResponseWriter, r *http.Request) {
	domain := r.URL.Query().Get("domain")
	if domain == "" {
		respondError(w, http.StatusBadRequest, "domain parameter is required", nil)
		return
	}

	output, err := utils.ExecuteCommand(fmt.Sprintf("kvas del %s", domain))
	response, statusCode := parseDelOutput(output, domain, err)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

func parseDelOutput(output, domain string, _ error) (DelResponse, int) {
	cleaned := utils.CleanString(output)

	switch {
	case strings.Contains(cleaned, "УДАЛЕН"):
		return DelResponse{
			Domain: domain,
		}, http.StatusOK
	case strings.Contains(cleaned, "отсутствует"):
		return DelResponse{
			Domain: domain,
		}, http.StatusNotFound
	default:
		return DelResponse{
			Domain: domain,
		}, http.StatusInternalServerError
	}
}
