#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example to .env and set ConnectionStrings__DefaultConnection." >&2
  exit 1
fi
source .env
if [[ -z "${ConnectionStrings__DefaultConnection:-}" ]]; then
  echo "ConnectionStrings__DefaultConnection is empty in .env." >&2
  exit 1
fi
if [[ -d "$HOME/.dotnet" && -z "${DOTNET_ROOT:-}" ]]; then
  export DOTNET_ROOT="$HOME/.dotnet"
  export PATH="$DOTNET_ROOT:$PATH"
fi
command -v dotnet >/dev/null || { echo "Install the .NET 8 SDK first." >&2; exit 1; }
command -v npm >/dev/null || { echo "Install Node.js and npm first." >&2; exit 1; }
[[ -d frontend/node_modules ]] || { echo "Run npm ci in frontend first." >&2; exit 1; }

export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://localhost:5062
export ConnectionStrings__DefaultConnection

(
  cd backend
  dotnet run --project SOMS.Api/SOMS.Api.csproj
) & backend_pid=$!
(
  cd frontend
  npm run dev -- --host 0.0.0.0
) & frontend_pid=$!

cleanup() {
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
wait -n "$backend_pid" "$frontend_pid"
