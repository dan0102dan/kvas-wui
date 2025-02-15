// clear.go
package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/dan0102dan/kvas-wui/utils"
)

type ClearForceResponse struct {
	Message string `json:"message"`
	Backup  string `json:"backup,omitempty"`
}

func ClearForceHandler(w http.ResponseWriter, r *http.Request) {
	// Выполняем команду "kvas clear force"
	output, err := utils.ExecuteCommand("kvas clear force")
	response, statusCode := parseClearForceOutput(output, err)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

func parseClearForceOutput(output string, err error) (ClearForceResponse, int) {
	cleaned := utils.CleanString(output)

	if err != nil {
		return ClearForceResponse{
			Message: "Ошибка при выполнении команды",
		}, http.StatusInternalServerError
	}

	// Если команда выполнена успешно и список очищен:
	if strings.Contains(cleaned, "ОЧИЩЕН") {
		backup := ""
		// Пробуем извлечь путь к резервной копии
		idx := strings.Index(cleaned, "сохранён в файл")
		if idx != -1 {
			parts := strings.Split(cleaned, "сохранён в файл")
			if len(parts) > 1 {
				backup = strings.TrimSpace(parts[1])
			}
		}
		return ClearForceResponse{
			Message: "Защищённый список очищен",
			Backup:  backup,
		}, http.StatusOK
	}

	// Если список уже пуст:
	if strings.Contains(cleaned, "уже пуст") {
		return ClearForceResponse{
			Message: "Защищённый список уже пуст",
		}, http.StatusOK
	}

	// Если результат не удалось распознать:
	return ClearForceResponse{
		Message: "Неизвестный результат команды",
	}, http.StatusInternalServerError
}
