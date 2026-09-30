# STATUS

**Plan:** kunnskap/plan.md

## Tilstand
Fase 1 (ukeplan per team) er skrevet, men ikke verifisert av bruker. Fase 2–5 står i planen.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`. Ingen remote (push feiler til en er satt opp).

## Verifisert
- `tsc --noEmit`, `npm run lint`, `npm run build`: grønt.
- Siden gir HTTP 200 og viser Uke 40 med riktige lokasjoner og en «Fri»-endring.

## Gjenstår hos bruker
- Åpne http://localhost:3000, bla til uke 32 (Lukasz «Syk»), uke 41 (høstferie-merknad), bytt team, test Ansatte-tab.
- Bekrefte at `data/` og `*.xlsx` skal være i `.gitignore`.
- Sjekke om SQLite/Prisma kan installeres (databasevalg til Fase 3).

## Neste steg
Etter verifisering: kollaps Fase 1 i planen, start Fase 2 («Min plan» + «Velg deg selv»-dropdown).

## Det en ny økt må vite
- Excel-fila `Vaktliste_2026-2027_Team_Ost_og_Vest.xlsx` ligger i `app/` (ikke i git). `npm run import` regenererer `data/*.json`.
- Excel er source of truth i Fase 1; ukeplan-cellene regnes ut, importeres ikke.
- Bare endringer med status «Godkjent» vises i ukeplanen.
- Node-skript kan ikke importere `.ts` direkte (mangler filendelse); test via `next dev`/`build`.
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.

## Arbeidsmåte neste økt
- `[dev-server-først]` Sjekk om dev-server alt kjører på port 3000 før `npm run dev`.
- `[persondata-i-plan]` Planer som importerer registre må avklare `.gitignore` for uttrekket.
