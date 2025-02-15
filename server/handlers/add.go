package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/dan0102dan/kvas-wui/utils"
)

type AddResponse struct {
	Domain string `json:"domain"`
}

func AddHandler(w http.ResponseWriter, r *http.Request) {
	domain := r.URL.Query().Get("domain")
	if domain == "" {
		respondError(w, http.StatusBadRequest, "domain parameter is required", nil)
		return
	}

	output, err := utils.ExecuteCommand(fmt.Sprintf("kvas add %s", domain))
	response, statusCode := parseAddOutput(output, domain, err)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

func parseAddOutput(output, domain string, err error) (AddResponse, int) {
	cleaned := utils.CleanString(output)

	switch {
	case strings.Contains(cleaned, "ДОБАВЛЕН"):
		return AddResponse{
			Domain: domain,
		}, http.StatusOK
	case strings.Contains(cleaned, "уже есть"):
		return AddResponse{
			Domain: domain,
		}, http.StatusConflict
	default:
		return AddResponse{
			Domain: domain,
		}, http.StatusInternalServerError
	}
}