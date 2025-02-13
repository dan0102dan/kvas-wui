package utils

import (
    "regexp"
    "strings"
	"os/exec"
)

// cleanString очищает строку от ANSI escape-последовательностей и лишних пробелов
func CleanString(text string) string {
    text = regexp.MustCompile(`\x1B\[[0-9;]*[a-zA-Z]`).ReplaceAllString(text, "")
    return strings.TrimSpace(text)
}

// executeCommand выполняет команду и возвращает очищенный вывод
func ExecuteCommand(cmd string) (string, error) {
    output, err := exec.Command("sh", "-c", cmd).CombinedOutput()
    return CleanString(string(output)), err
}