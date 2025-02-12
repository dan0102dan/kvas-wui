package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"strings"
)

// TunnelResponse - структура для ответа API
type TunnelResponse struct {
	InternetGateway struct {
		Provider  string `json:"provider"`
		Interface string `json:"interface"`
		IP        string `json:"ip"`
		Keenetic  string `json:"keenetic"`
		Connection bool   `json:"connection"`
	} `json:"internet-gateway"`

	Tunnel struct {
		Name       string `json:"name"`
		Connection bool   `json:"connection"`
		IP         string `json:"ip"`
		Domain     string `json:"domain"`
	} `json:"tunnel"`

	AvailableNetworks []struct {
		Name        string `json:"name"`
		IP          string `json:"ip"`
		Interface   string `json:"interface"`
		Description string `json:"description"`
	} `json:"aviable_networks"`
}

// executeCommand выполняет команду и возвращает её вывод
func executeCommand(cmd string) (string, error) {
	output, err := exec.Command("sh", "-c", cmd).CombinedOutput()
	return string(output), err
}

// parseTunnelResponse парсит вывод команды и формирует структуру TunnelResponse
func parseTunnelResponse(output string) (*TunnelResponse, error) {
	var response TunnelResponse

	// Парсим данные из вывода команд для Интернет шлюза
	lines := strings.Split(output, "\n")

	// Разбираем раздел 'Интернет шлюз'
	for _, line := range lines {
		// Пример строки: "Название                                                             Provider"
		if strings.Contains(line, "Название") {
			// Разбиваем строку на части и парсим каждую
			response.InternetGateway.Provider = parseValueFromLine(line)
		} else if strings.Contains(line, "Сетевой интерфейс") {
			response.InternetGateway.Interface = parseValueFromLine(line)
		} else if strings.Contains(line, "IP") {
			response.InternetGateway.IP = parseValueFromLine(line)
		} else if strings.Contains(line, "Keenetic-имя") {
			response.InternetGateway.Keenetic = parseValueFromLine(line)
		} else if strings.Contains(line, "Подключение") {
			connectionStatus := parseValueFromLine(line)
			response.InternetGateway.Connection = (connectionStatus == "есть")
		}
	}

	// Разбираем раздел 'Тоннель'
	for _, line := range lines {
		if strings.Contains(line, "Название") {
			response.Tunnel.Name = parseValueFromLine(line)
		} else if strings.Contains(line, "Подключение") {
			connectionStatus := parseValueFromLine(line)
			response.Tunnel.Connection = (connectionStatus == "есть")
		} else if strings.Contains(line, "IP") {
			response.Tunnel.IP = parseValueFromLine(line)
		} else if strings.Contains(line, "Домен") {
			response.Tunnel.Domain = parseValueFromLine(line)
		}
	}

	// Разбираем доступные сети для тоннеля
	// Предполагается, что вывод содержит список сетей в формате "name | ip | interface | description"
	for _, line := range lines {
		if strings.Contains(line, "|") {
			parts := strings.FieldsFunc(line, func(r rune) bool {
				return r == '|' || r == ' ' // Разбиваем по пробелам и '|'
			})
			if len(parts) >= 4 {
				network := struct {
					Name        string `json:"name"`
					IP          string `json:"ip"`
					Interface   string `json:"interface"`
					Description string `json:"description"`
				}{
					Name:        parts[0],
					IP:          parts[1],
					Interface:   parts[2],
					Description: parts[3],
				}
				response.AvailableNetworks = append(response.AvailableNetworks, network)
			}
		}
	}

	return &response, nil
}

// parseValueFromLine помогает извлечь значения из строк формата "ключ <value>"
func parseValueFromLine(line string) string {
	// Очистка и извлечение значения после "Название" или другого ключа
	parts := strings.SplitN(line, " ", 2)
	if len(parts) > 1 {
		return strings.TrimSpace(parts[1])
	}
	return ""
}

func tunnelHandler(w http.ResponseWriter, r *http.Request) {
	// Запускаем команду
	cmd := "kvas tunnel" // Вставьте вашу команду или путь к скрипту
	output, err := executeCommand(cmd)
	if err != nil {
		http.Error(w, fmt.Sprintf("Ошибка при выполнении команды: %v", err), http.StatusInternalServerError)
		return
	}

	// Очищаем вывод от ANSI-последовательностей
	cleanedOutput := cleanString(output)

	// Парсим очищенный вывод
	response, err := parseTunnelResponse(cleanedOutput)
	if err != nil {
		http.Error(w, fmt.Sprintf("Ошибка при разборе ответа: %v", err), http.StatusInternalServerError)
		return
	}

	// Отправляем JSON-ответ
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, fmt.Sprintf("Ошибка при отправке ответа: %v", err), http.StatusInternalServerError)
	}
}
