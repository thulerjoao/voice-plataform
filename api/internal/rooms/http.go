package rooms

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/thulerjoao/voice-plataform/api/internal/db"
)

type createRequest struct {
	Name     string `json:"name"`
	UID      string `json:"uid"`
	Nickname string `json:"nickname"`
}

func HandleCreate(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req createRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		created, err := Create(r.Context(), store, CreateInput{
			Name:     req.Name,
			UID:      req.UID,
			Nickname: req.Nickname,
		})
		if err != nil {
			switch {
			case errors.Is(err, ErrInvalidName):
				writeError(w, http.StatusBadRequest, "Não foi possível criar a sala.")
			case errors.Is(err, ErrMissingIdentity):
				writeError(w, http.StatusBadRequest, "Identidade inválida.")
			default:
				writeError(w, http.StatusInternalServerError, "Não foi possível criar a sala.")
			}
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"id":   created.ID,
			"name": created.Name,
			"code": created.Code,
			"role": created.Role,
		})
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
