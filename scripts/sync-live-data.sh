#!/usr/bin/env bash
#
# Pull live Supabase data into the local Supabase stack.
#
# - Dumps the live public schema data only (--data-only, COPY format).
# - Excludes auth.users / user_roles so no live authentication data is imported.
# - Wipes local data (db reset) before loading, then applies live rows.
#
# Requirements: supabase CLI linked to the live project, local stack running
# (`supabase start`), and psql on PATH.
#
# Usage: scripts/sync-live-data.sh

set -euo pipefail

DUMP_FILE="${TMPDIR:-/tmp}/supabase_live_data.sql"

echo "→ Dumping live public data (excludes auth.users, user_roles)..."
supabase db dump --data-only --use-copy --linked --schema public \
  --exclude public.user_roles -f "$DUMP_FILE"
echo "  dumped to $DUMP_FILE"

echo "→ Resetting local database (applies migrations)..."
supabase db reset --local

echo "→ Loading live data into local database..."
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 -f "$DUMP_FILE"

echo "→ Done. Local Supabase now mirrors live content data."