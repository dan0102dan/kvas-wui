package utils

import (
	"log"
	"os"
	"path/filepath"
)

func InitLogger(logDir string) {
	err := os.MkdirAll(logDir, 0755)
	if err != nil {
		log.Fatalf("Не удалось создать директорию для логов: %v", err)
	}

	logFilePath := filepath.Join(logDir, "app.log")
	
	f, err := os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Fatalf("Не удалось открыть файл лога: %v", err)
	}

	log.SetOutput(f)
}
