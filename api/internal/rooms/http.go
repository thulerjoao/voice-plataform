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

type joinRequest struct {
	Code     string `json:"code"`
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

func HandleGet(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		details, err := Get(r.Context(), store, r.PathValue("id"), r.URL.Query().Get("uid"))
		if err != nil {
			writeRoomErr(w, err, "Não foi possível carregar o servidor.")
			return
		}
		writeRoom(w, http.StatusOK, details)
	}
}

type renameRequest struct {
	Name string `json:"name"`
	UID  string `json:"uid"`
}

func HandleRename(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req renameRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		details, err := Rename(r.Context(), store, r.PathValue("id"), req.UID, req.Name)
		if err != nil {
			writeRoomErr(w, err, "Não foi possível alterar o nome.")
			return
		}
		writeRoom(w, http.StatusOK, details)
	}
}

func HandleJoin(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req joinRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		joined, err := Join(r.Context(), store, JoinInput{
			Code:     req.Code,
			UID:      req.UID,
			Nickname: req.Nickname,
		})
		if err != nil {
			switch {
			case errors.Is(err, ErrInvalidCode):
				writeError(w, http.StatusBadRequest, "Código inválido.")
			case errors.Is(err, ErrRoomNotFound):
				writeError(w, http.StatusNotFound, "Sala não encontrada.")
			case errors.Is(err, ErrMissingIdentity):
				writeError(w, http.StatusBadRequest, "Identidade inválida.")
			case errors.Is(err, ErrBlocked):
				writeError(w, http.StatusForbidden, "Você está bloqueado neste servidor.")
			default:
				writeError(w, http.StatusInternalServerError, "Não foi possível entrar na sala.")
			}
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"id":   joined.ID,
			"name": joined.Name,
			"code": joined.Code,
			"role": joined.Role,
		})
	}
}

type leaveRequest struct {
	UID string `json:"uid"`
}

func HandleLeave(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req leaveRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		err := Leave(r.Context(), store, r.PathValue("id"), req.UID)
		if err != nil {
			switch {
			case errors.Is(err, ErrMissingIdentity):
				writeError(w, http.StatusBadRequest, "Identidade inválida.")
			case errors.Is(err, ErrRoomNotFound):
				writeError(w, http.StatusNotFound, "Servidor não encontrado.")
			case errors.Is(err, ErrOwnerCannotLeave):
				writeError(w, http.StatusForbidden, "O dono não pode sair do servidor.")
			default:
				writeError(w, http.StatusInternalServerError, "Não foi possível sair do servidor.")
			}
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func writeRoom(w http.ResponseWriter, status int, details RoomDetails) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(details)
}

func writeRoomErr(w http.ResponseWriter, err error, fallback string) {
	switch {
	case errors.Is(err, ErrInvalidName):
		writeError(w, http.StatusBadRequest, "O nome precisa ter de 3 a 24 caracteres.")
	case errors.Is(err, ErrMissingIdentity):
		writeError(w, http.StatusBadRequest, "Identidade inválida.")
	case errors.Is(err, ErrRoomNotFound):
		writeError(w, http.StatusNotFound, "Servidor não encontrado.")
	case errors.Is(err, ErrChannelNotFound):
		writeError(w, http.StatusNotFound, "Sala não encontrada.")
	case errors.Is(err, ErrMemberNotFound):
		writeError(w, http.StatusNotFound, "Usuário não encontrado.")
	case errors.Is(err, ErrLastChannel):
		writeError(w, http.StatusConflict, "Não é possível apagar a última sala.")
	case errors.Is(err, ErrDuplicateName):
		writeError(w, http.StatusConflict, "Já existe uma sala com esse nome.")
	case errors.Is(err, ErrInvalidRole):
		writeError(w, http.StatusBadRequest, "Papel inválido.")
	case errors.Is(err, ErrForbidden):
		writeError(w, http.StatusForbidden, "Você não tem permissão.")
	default:
		writeError(w, http.StatusInternalServerError, fallback)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

type channelWriteRequest struct {
	UID         string `json:"uid"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func HandleCreateChannel(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req channelWriteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		channel, err := CreateSala(r.Context(), store, r.PathValue("id"), req.UID, req.Name, req.Description)
		if err != nil {
			if errors.Is(err, ErrInvalidName) {
				writeError(w, http.StatusBadRequest, "O nome da sala precisa ter de 1 a 24 caracteres.")
				return
			}
			writeRoomErr(w, err, "Não foi possível criar a sala.")
			return
		}
		writeJSON(w, http.StatusCreated, channel)
	}
}

func HandleUpdateChannel(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req channelWriteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		channel, err := UpdateSala(r.Context(), store, r.PathValue("id"), r.PathValue("channelId"), req.UID, req.Name, req.Description)
		if err != nil {
			if errors.Is(err, ErrInvalidName) {
				writeError(w, http.StatusBadRequest, "O nome da sala precisa ter de 1 a 24 caracteres.")
				return
			}
			writeRoomErr(w, err, "Não foi possível alterar a sala.")
			return
		}
		writeJSON(w, http.StatusOK, channel)
	}
}

func HandleDeleteChannel(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err := DeleteSala(r.Context(), store, r.PathValue("id"), r.PathValue("channelId"), r.URL.Query().Get("uid"))
		if err != nil {
			writeRoomErr(w, err, "Não foi possível apagar a sala.")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

type actorRequest struct {
	UID string `json:"uid"`
}

type roleRequest struct {
	UID  string `json:"uid"`
	Role string `json:"role"`
}

type blockRequest struct {
	UID       string `json:"uid"`
	TargetUID string `json:"targetUid"`
}

func HandleSetRole(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req roleRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		details, err := SetRole(r.Context(), store, r.PathValue("id"), req.UID, r.PathValue("memberUid"), req.Role)
		if err != nil {
			writeRoomErr(w, err, "Não foi possível alterar o cargo.")
			return
		}
		writeRoom(w, http.StatusOK, details)
	}
}

func HandleKick(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req actorRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		details, err := Kick(r.Context(), store, r.PathValue("id"), req.UID, r.PathValue("memberUid"))
		if err != nil {
			writeRoomErr(w, err, "Não foi possível excluir do servidor.")
			return
		}
		writeRoom(w, http.StatusOK, details)
	}
}

func HandleBlock(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req blockRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Dados inválidos.")
			return
		}

		details, err := Block(r.Context(), store, r.PathValue("id"), req.UID, req.TargetUID)
		if err != nil {
			writeRoomErr(w, err, "Não foi possível bloquear.")
			return
		}
		writeRoom(w, http.StatusOK, details)
	}
}

func HandleUnblock(store *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		details, err := Unblock(r.Context(), store, r.PathValue("id"), r.URL.Query().Get("uid"), r.PathValue("memberUid"))
		if err != nil {
			writeRoomErr(w, err, "Não foi possível desbloquear.")
			return
		}
		writeRoom(w, http.StatusOK, details)
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
