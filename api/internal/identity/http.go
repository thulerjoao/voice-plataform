package identity

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/thulerjoao/voice-plataform/api/internal/db"
	"github.com/thulerjoao/voice-plataform/api/internal/realtime"
)

type registerRequest struct {
	Nickname     string `json:"nickname"`
	UID          string `json:"uid"`
	RecoveryCode string `json:"recoveryCode"`
}

type restoreRequest struct {
	Code string `json:"code"`
}

func HandleRegister(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req registerRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		created, err := Register(r.Context(), store, RegisterInput{
			Nickname:     req.Nickname,
			UID:          req.UID,
			RecoveryCode: req.RecoveryCode,
		})
		if err != nil {
			writeIdentityErr(w, err, "Não foi possível criar a identidade.")
			return
		}

		status := http.StatusOK
		if req.UID == "" {
			status = http.StatusCreated
		}
		writeJSON(w, status, created)
	}
}

type renameRequest struct {
	UID      string `json:"uid"`
	Nickname string `json:"nickname"`
}

func HandleRename(store *db.DB, hub *realtime.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req renameRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		updated, err := Rename(r.Context(), store, req.UID, req.Nickname)
		if err != nil {
			if errors.Is(err, ErrNotFound) {
				writeError(w, http.StatusNotFound, "Identidade não encontrada.")
				return
			}
			writeIdentityErr(w, err, "Não foi possível alterar o nickname.")
			return
		}
		writeJSON(w, http.StatusOK, updated)
		emitNickname(r.Context(), store, hub, updated.UID, updated.Nickname)
	}
}

func HandleRestore(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req restoreRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		restored, err := Restore(r.Context(), store, req.Code)
		if err != nil {
			writeIdentityErr(w, err, "Não foi possível recuperar a conta.")
			return
		}
		writeJSON(w, http.StatusOK, restored)
	}
}

func writeIdentityErr(w http.ResponseWriter, err error, fallback string) {
	switch {
	case errors.Is(err, ErrInvalidNickname):
		writeError(w, http.StatusBadRequest, "Digite um nickname.")
	case errors.Is(err, ErrInvalidCode):
		writeError(w, http.StatusBadRequest, "Código de recuperação inválido.")
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, "Código não encontrado.")
	case errors.Is(err, ErrUIDTaken):
		writeError(w, http.StatusConflict, "Esta identidade já está em uso.")
	case errors.Is(err, ErrCodeCollision):
		writeError(w, http.StatusConflict, "Não foi possível gerar um código único.")
	default:
		writeError(w, http.StatusInternalServerError, fallback)
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
