package handlers

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"github.com/dan0102dan/kvas-wui/utils"
)

func ListHandler(w http.ResponseWriter, r *http.Request) {
	output, err := utils.ExecuteCommand("kvas list")
	if err != nil {
		http.Error(w, "command execution failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	domains := parseListOutput(output)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(domains)
}

func parseListOutput(output string) []string {
	cleaned := utils.CleanString(output)

	// Если в выводе присутствует запрос на восстановление,
	// возвращаем пустой список (отвечаем отрицательно на восстановление).
	if strings.Contains(cleaned, "? Восстановить") {
		return []string{}
	}

	// Разбиваем вывод по разделителям (последовательности из 3 и более дефисов).
	sections := regexp.MustCompile(`-{3,}`).Split(cleaned, -1)
	if len(sections) < 3 {
		return []string{}
	}

	// Предполагаем, что список доменов находится в третьей секции.
	domainSection := strings.TrimSpace(sections[2])
	lines := strings.Split(domainSection, "\n")

	var domains []string
	for _, line := range lines {
		domain := strings.TrimSpace(line)
		if domain != "" {
			domains = append(domains, domain)
		}
	}

	return domains
}