# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1 (ukeplan per team) er skrevet og delvis verifisert 2026-09-30: bruker har sett Øst i uke 39 etter at tabellcelle-feilen ble rettet. Resten av verifiseringen er ikke gjort (bruker fikk aldri sjekklisten): uke 32 (Lukasz «Syk»), uke 41 (høstferie-merknad), team Vest/Begge, Ansatte-fane, årsskifte 2026→2027.
Faseflyt er komplett i `app/` (CLAUDE.md-avsnitt, sikkerhet.md, arkitektur.md, TODO.md, .claude/settings.json). Settings leses først ved omstart.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`. Ingen remote (push feiler til en er satt opp).

## Verifisert
- `tsc --noEmit` og `npm run lint` rent etter siste kodeendring; `npm run build` kjørt i fase-slutt (se logg).
- Ukeplan for Øst vises riktig med endring, «Fri» og skolekalender-merknad.

## Neste
Bruker sjekker resten av Fase 1 på http://localhost:3000 (listen under Tilstand). Deretter: kollaps Fase 1 i planen og start Fase 2, «Min plan» + «Velg deg selv»-dropdown (planmodus først, fasen er ikke skissert i detalj i planen).

## Arbeidsmåte neste økt
- `[dev-server-først]` Sjekk om dev-server alt kjører på port 3000 før `npm run dev`.
- `[persondata-i-plan]` Planer som importerer registre må avklare `.gitignore` for uttrekket.
- `[celle-på-td]` Aldri `display: flex/block` på `td`/`tr`/`th`; legg stilen på en `div` inni.

## Det en ny økt må vite
- Åpne Claude Code i `app/`: repoet, `kunnskap/` og CLAUDE.md ligger der, mappa over er tom.
- Excel-fila `Vaktliste_2026-2027_Team_Ost_og_Vest.xlsx` ligger i `app/` (ikke i git). `npm run import` regenererer `data/*.json`.
- Excel er source of truth i Fase 1; ukeplan-cellene regnes ut, importeres ikke. Merknader over datoene kommer fra arket `Dager`.
- Bare endringer med status «Godkjent» vises i ukeplanen.
- Node-skript kan ikke importere `.ts` direkte (mangler filendelse); test via `next dev`/`build`.
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database tilgjengelig nå: JSON i `data/` til SR sier fra (blokkerer Fase 3). Reelle persondata i appen krever avklart behandlingsgrunnlag, se `TODO.md` punkt 1.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet.
