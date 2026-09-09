package version

import (
	"encoding/json"
	"net/http"
)

func HandleGet() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"min":     Min(),
			"current": Current(),
		})
	}
}
