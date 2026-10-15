#!/bin/sh
# Oppstart i containeren. Tabellene lages av appen selv fra db/skjema.sql første gang databasen åpnes.
set -e

if [ -z "$STARTPASSORD" ]; then
  echo "STARTPASSORD mangler i miljøet. Sett den i .env ved siden av docker-compose.yml." >&2
  exit 1
fi

exec node server.js
