package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/dan0102dan/kvas-wui/utils"
)

type TunnelResponse struct {
	InternetGateway   InternetGateway `json:"internet_gateway"`
	Tunnel            Tunnel          `json:"tunnel"`
	AvailableNetworks []Network       `json:"available_networks"`
	ScannedNetworks   []Network       `json:"scanned_networks"`
}

type InternetGateway struct {
	Provider   string `json:"provider"`
	Interface  string `json:"interface"`
	IP         string `json:"ip"`
	Keenetic   string `json:"keenetic"`
	Connection bool   `json:"connection"`
}

type Tunnel struct {
	Name       string       `json:"name"`
	Connection bool         `json:"connection"`
	IP         string       `json:"ip"`
	Config     TunnelConfig `json:"config"`
}

type TunnelConfig struct {
	Server     string `json:"server"`
	ServerPort int    `json:"server_port"`
	LocalPort  int    `json:"local_port"`
	Method     string `json:"method"`
}

type Network struct {
	Name        string `json:"name"`
	IP          string `json:"ip,omitempty"`
	Interface   string `json:"interface"`
	Description string `json:"description,omitempty"`
	Type        string `json:"type,omitempty"`
}

// HTTP-обработчик для команды "kvas tunnel"
func TunnelHandler(w http.ResponseWriter, r *http.Request) {
	output, err := utils.ExecuteCommand("kvas tunnel")
	if err != nil {
		http.Error(w, "command execution failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resp, err := parseTunnelOutput(output)
	if err != nil {
		http.Error(w, "parsing failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("JSON encode error: %v", err)
	}
}

// parseTunnelOutput обрабатывает весь вывод и собирает итоговую структуру.
func parseTunnelOutput(output string) (*TunnelResponse, error) {
	// Удаляем строки с меткой времени и пустые строки.
	lines := strings.Split(output, "\n")
	var filteredLines []string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		// Если строка содержит "Output:" (например, "2025/02/13 19:51:47 Output:"), пропускаем её.
		if strings.Contains(trimmed, "Output:") {
			continue
		}
		filteredLines = append(filteredLines, line)
	}
	cleanedOutput := strings.Join(filteredLines, "\n")

	// Будем группировать секции по заголовкам.
	// Линии, состоящие только из тире, будем считать разделителями.
	reDivider := regexp.MustCompile(`^-{3,}$`)

	type section struct {
		header  string
		content []string
	}
	var sections []section

	var currentHeader string
	var currentContent []string
	for _, line := range strings.Split(cleanedOutput, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		// Если строка — разделитель (линия из тире), завершаем текущую секцию
		if reDivider.MatchString(trimmed) {
			if currentHeader != "" && len(currentContent) > 0 {
				sections = append(sections, section{header: currentHeader, content: currentContent})
				currentHeader = ""
				currentContent = nil
			}
			continue
		}
		// Если строка заканчивается двоеточием, считаем её заголовком
		if strings.HasSuffix(trimmed, ":") {
			// Если уже есть заголовок с контентом – сохраняем его
			if currentHeader != "" && len(currentContent) > 0 {
				sections = append(sections, section{header: currentHeader, content: currentContent})
			}
			currentHeader = trimmed
			currentContent = nil
		} else {
			// Иначе добавляем строку в текущий контент
			currentContent = append(currentContent, trimmed)
		}
	}
	// Добавляем последнюю секцию, если есть
	if currentHeader != "" && len(currentContent) > 0 {
		sections = append(sections, section{header: currentHeader, content: currentContent})
	}

	// Заполняем итоговую структуру
	var resp TunnelResponse
	for _, sec := range sections {
		switch {
		case strings.Contains(sec.header, "Интернет шлюз"):
			parseInternetGateway(sec.content, &resp)
		case strings.Contains(sec.header, "Тоннель"):
			parseTunnelSection(sec.content, &resp)
		case strings.Contains(sec.header, "Конфигурация"):
			parseConfigSection(sec.content, &resp)
		case strings.Contains(sec.header, "Доступные"):
			// Для секции "Доступные для тоннеля сети:" ожидаем 4 колонки (Name, IP, Interface, Description)
			resp.AvailableNetworks = parseNetworkSection(sec.content, true)
		case strings.Contains(sec.header, "Полученные"):
			// Для секции "Полученные сканированием сети:" – 3 колонки (Name, Interface, Description)
			resp.ScannedNetworks = parseNetworkSection(sec.content, false)
		default:
			log.Printf("Unknown section header: %s", sec.header)
		}
	}

	return &resp, nil
}

// parseInternetGateway парсит секцию «Интернет шлюз».
// Пример содержимого:
//   Название                                                             Provider
//   Keenetic-имя                                                         GigabitEthernet0/Vlan4
//   Сетевой интерфейс                                                    eth2.4
//   Подключение                                                          есть
//   IP                                                                   10.4.135.112
func parseInternetGateway(lines []string, resp *TunnelResponse) {
	// Если первая строка выглядит как заголовок таблицы, пропускаем её.
	if len(lines) > 0 && strings.HasPrefix(lines[0], "Название") && strings.Contains(lines[0], "Provider") {
		lines = lines[1:]
	}
	for _, line := range lines {
		parts := regexp.MustCompile(`\s{2,}`).Split(line, 2)
		if len(parts) < 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		switch key {
		case "Название":
			resp.InternetGateway.Provider = value
		case "Keenetic-имя":
			resp.InternetGateway.Keenetic = value
		case "Сетевой интерфейс":
			resp.InternetGateway.Interface = value
		case "Подключение":
			resp.InternetGateway.Connection = (value == "есть")
		case "IP":
			resp.InternetGateway.IP = value
		}
	}
}

// parseTunnelSection парсит секцию «Тоннель».
// Пример содержимого:
//   Название                                                             ShadowSocks
//   Подключение                                                          есть
//   IP                                                                   185.119.196.115
func parseTunnelSection(lines []string, resp *TunnelResponse) {
	for _, line := range lines {
		parts := regexp.MustCompile(`\s{2,}`).Split(line, 2)
		if len(parts) < 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		switch key {
		case "Название":
			resp.Tunnel.Name = value
		case "Подключение":
			resp.Tunnel.Connection = (value == "есть")
		case "IP":
			resp.Tunnel.IP = value
		}
	}
}

// parseConfigSection парсит секцию с конфигурацией (JSON-подобные строки).
// Пример содержимого:
//   "server": "185.119.196.115",
//   "server_port": 62084,
//   "local_port": 1181,
//   "method": "chacha20-ietf-poly1305",
//   password проверьте самостоятельно!
func parseConfigSection(lines []string, resp *TunnelResponse) {
	var jsonLines []string
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		// Выбираем только строки, начинающиеся с кавычки
		if strings.HasPrefix(trimmed, `"`) {
			// Удаляем завершающую запятую (если есть)
			trimmed = strings.TrimRight(trimmed, ",")
			jsonLines = append(jsonLines, trimmed)
		}
	}
	// Собираем валидную JSON-строку
	jsonStr := "{" + strings.Join(jsonLines, ",") + "}"
	var cfg TunnelConfig
	if err := json.Unmarshal([]byte(jsonStr), &cfg); err != nil {
		log.Printf("Error parsing config JSON: %v. JSON: %s", err, jsonStr)
		return
	}
	resp.Tunnel.Config = cfg
}

// parseNetworkSection парсит секции с данными по сетям.
// Если isAvailable == true – ожидается 4 колонки (Name, IP, Interface, Description),
// иначе – 3 колонки (Name, Interface, Description). При этом, если во втором столбце нет точки,
// то считаем, что IP отсутствует.
func parseNetworkSection(lines []string, isAvailable bool) []Network {
	var networks []Network
	for _, line := range lines {
		if line == "" {
			continue
		}
		parts := strings.Split(line, "|")
		// Обрезаем пробелы вокруг каждой колонки
		for i := range parts {
			parts[i] = strings.TrimSpace(parts[i])
		}
		var nw Network
		if isAvailable {
			// Ожидаем 4 колонки
			if len(parts) < 4 {
				continue
			}
			nw.Name = parts[0]
			nw.IP = parts[1]
			nw.Interface = parts[2]
			nw.Description = parts[3]
		} else {
			// Ожидаем 3 колонки.
			// Если во второй колонке присутствует точка (например, IP-адрес),
			// то обрабатываем как для available, иначе – как 3 колонки.
			if len(parts) >= 3 && strings.Contains(parts[1], ".") {
				nw.Name = parts[0]
				nw.IP = parts[1]
				nw.Interface = parts[2]
				if len(parts) >= 4 {
					nw.Description = parts[3]
				}
			} else {
				// 3 колонки: Name, Interface, Description
				if len(parts) < 3 {
					continue
				}
				nw.Name = parts[0]
				nw.Interface = parts[1]
				nw.Description = parts[2]
			}
		}

		// Если в поле Interface есть тип подключения в квадратных скобках,
		// выделяем его и оставляем чистое название интерфейса.
		if strings.Contains(nw.Interface, "[") {
			subParts := strings.SplitN(nw.Interface, "[", 2)
			nw.Interface = strings.TrimSpace(subParts[0])
			nw.Type = strings.TrimSuffix(strings.TrimSpace(subParts[1]), "]")
		}
		// Удаляем кавычки из описания (если есть)
		nw.Description = strings.Trim(nw.Description, `"`)
		networks = append(networks, nw)
	}
	return networks
}
