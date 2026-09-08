#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export PATH="$PATH:/snap/bin:${HOME}/go/bin"

if ! command -v go >/dev/null 2>&1; then
  echo "go não encontrado. Abra um terminal novo ou rode: source ~/.zshrc"
  exit 1
fi

pids=()

cleanup() {
  trap - EXIT INT TERM
  for pid in "${pids[@]+"${pids[@]}"}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "→ postgres"
docker compose up -d

echo "→ aguardando banco"
until docker compose exec -T db pg_isready -U voice >/dev/null 2>&1; do
  sleep 0.4
done

if [[ ! -d "$ROOT/client/node_modules" ]]; then
  echo "→ npm install"
  (cd "$ROOT/client" && npm install)
fi

echo "→ api :8080"
if ss -tln | grep -q ':8080 '; then
  echo "→ encerrando o processo antigo em :8080"
  fuser -k 8080/tcp >/dev/null 2>&1 || true
  sleep 0.4
fi
(cd "$ROOT/api" && go run .) &
pids+=($!)

echo "→ client :5173"
(cd "$ROOT/client" && npm run dev) &
pids+=($!)

echo
echo "API     http://localhost:8080/health"
echo "Client  http://localhost:5173"
echo "Ctrl+C para parar a API e o Vite (o Postgres continua no Docker)"
echo

wait
