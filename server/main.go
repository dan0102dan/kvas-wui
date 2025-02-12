package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// CORS middleware для обработки кросс-доменных запросов
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Обработчик для раздачи статичных файлов и fallback для SPA
func spaHandler(staticPath, indexPath string) http.Handler {
	fs := http.FileServer(http.Dir(staticPath))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Формируем абсолютный путь к файлу на основе запроса
		path := filepath.Join(staticPath, r.URL.Path)

		// Проверяем, существует ли файл
		_, err := os.Stat(path)
		if os.IsNotExist(err) {
			// Файл не найден — отдаем index.html
			http.ServeFile(w, r, filepath.Join(staticPath, indexPath))
			return
		} else if err != nil {
			// При возникновении другой ошибки возвращаем ошибку сервера
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		// Файл существует — передаем запрос стандартному файловому серверу
		fs.ServeHTTP(w, r)
	})
}

func main() {
	// Запуск API сервера на порту 5000
	apiMux := http.NewServeMux()

	apiMux.HandleFunc("/command", commandHandler)
	apiMux.HandleFunc("/tunnel", tunnelHandler)

	// Запуск API сервера
	go func() {
		log.Println("API server started on :5000")
		if err := http.ListenAndServe(":5000", corsMiddleware(apiMux)); err != nil {
			log.Fatalf("API server failed: %v", err)
		}
	}()

	// Запуск сервера для статики
	staticMux := http.NewServeMux()
	staticMux.Handle("/", spaHandler("/opt/etc/kvas-wui/build", "index.html"))

	log.Println("Static file server started on :3000")
	if err := http.ListenAndServe(":3000", staticMux); err != nil {
		log.Fatalf("Static server failed: %v", err)
	}
}
