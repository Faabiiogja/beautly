#!/usr/bin/env bash
# Aplica supabase/migrations/ no projeto Supabase de staging usado pelo E2E.
#
# A conexão direta (db.<ref>.supabase.co) só existe em IPv6; muitas redes locais/CI não têm rota IPv6,
# então usamos o connection pooler (Supavisor, IPv4) montado a partir de .env.e2e.local.
# Idempotente: reaplicar não duplica nada porque cada migration usa "create table"/"create extension"
# sem "if not exists" de propósito (mesmo padrão do projeto) — rodar duas vezes falha alto e óbvio
# em vez de mascarar uma migration corrompida. Por isso só aplicamos se a ÚLTIMA migration ainda não
# tiver rodado (checar só a 1ª tabela marcaria "já aplicado" mesmo com uma falha no meio do caminho).
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.e2e.local"
[ -f "$ENV_FILE" ] || { echo "Falta $ENV_FILE (veja README: E2E / Playwright)." >&2; exit 1; }

get() { grep -E "^$1=" "$ENV_FILE" | head -n1 | cut -d= -f2-; }

DB_PASSWORD=$(get SUPABASE_DB_PASSWORD)
POOLER_HOST=$(get SUPABASE_DB_POOLER_HOST)
POOLER_USER=$(get SUPABASE_DB_POOLER_USER)
[ -n "$DB_PASSWORD" ] && [ -n "$POOLER_HOST" ] && [ -n "$POOLER_USER" ] || {
  echo "SUPABASE_DB_PASSWORD / SUPABASE_DB_POOLER_HOST / SUPABASE_DB_POOLER_USER ausentes em $ENV_FILE" >&2
  exit 1
}

ENCODED_PASSWORD=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASSWORD")
DB_URL="postgresql://${POOLER_USER}:${ENCODED_PASSWORD}@${POOLER_HOST}:5432/postgres"

# marcador da última migration (20260929000005_client_booking_limit.sql), não da primeira —
# senão uma falha no meio do caminho passaria despercebida como "já aplicado" numa próxima chamada.
ALREADY_APPLIED=$(psql "$DB_URL" -tAc "select to_regproc('public.enforce_client_booking_limit') is not null")

if [ "$ALREADY_APPLIED" = "t" ]; then
  echo "Schema já aplicado no staging (última migration já rodou) — nada a fazer."
  exit 0
fi

echo "Aplicando migrations no staging..."
for file in supabase/migrations/*.sql; do
  echo "  -> $(basename "$file")"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$file"
done
echo "Migrations aplicadas."
