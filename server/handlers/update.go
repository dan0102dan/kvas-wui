package handlers

import (
	"log"
	"net/http"

	"github.com/dan0102dan/kvas-wui/utils"
)

func UpdateHandler(w http.ResponseWriter, r *http.Request) {
    log.Println("Starting update process...")
    go func() {
        _, err := utils.ExecuteCommand("(curl -fsSL https://raw.githubusercontent.com/dan0102dan/kvas-wui/main/install.sh | sh > /dev/null 2>&1)&")
        if err != nil {
            log.Printf("Update failed: %v", err)
        }
    }()
    
    w.WriteHeader(http.StatusOK)
}