# Kjøre appen i Docker (bare for utvikling)

Krever Docker Desktop. Kommandoene kjøres i mappa som inneholder `docker-compose.yml`.

## Første gang

1. Kopier `.env.eksempel` til `.env` og fyll inn `STARTPASSORD` (startpassordet for første innlogging).
2. Bygg og lag containeren, uten å starte den:
   ```
   docker compose build
   docker compose create
   ```
3. Legg inn databasen. Steng først dev-serveren på maskinen som har fila, så ingen skriver til den.
   Fila er én enkelt fil (`data/vaktliste.db`), så det er nok å kopiere den:
   ```
   docker compose cp <sti til>\vaktliste.db vaktliste:/app/data/vaktliste.db
   docker compose run --rm --no-deps --user root --entrypoint chown vaktliste node:node /app/data/vaktliste.db
   ```
   Hopper du over dette steget, starter appen med en tom database og ingen kan logge inn.
4. Start:
   ```
   docker compose up
   ```
5. Åpne <http://localhost:3000> og logg inn.

## Daglig bruk

- Stoppe: `docker compose down` (databasen ligger i volumet `vaktliste-data` og beholdes).
- Starte igjen: `docker compose up`.
- Slette databasen også: `docker compose down -v`.
- Etter kodeendringer: `docker compose up --build`.
- Appen nås bare fra samme maskin (`127.0.0.1`). Innloggingskapselen er `Secure` i produksjon, og nettleseren godtar den over `http://localhost`, men ikke over en nettverksadresse.
