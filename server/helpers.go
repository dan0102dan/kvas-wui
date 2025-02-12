package main

import (
	"regexp"
	"strings"
)

// cleanString очищает строку от ANSI escape-последовательностей и лишних пробелов
func cleanString(text string) string {
	// Регулярное выражение для удаления ANSI escape-последовательностей
	re := regexp.MustCompile(`\x1B\[[0-9;]*[a-zA-Z]`)
	// Заменяем все escape-последовательности на пустую строку
	text = re.ReplaceAllString(text, "")
	// Убираем лишние пробелы
	text = strings.ReplaceAll(text, "-", "")
	text = regexp.MustCompile(`[^\S\r\n]+`).ReplaceAllString(text, " ")
	return strings.TrimSpace(text)
}
