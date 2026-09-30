# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1 (ukeplan per team) er skrevet, men ikke ferdig verifisert. Bruker har sett Øst i uke 39. Senere i fasen kom: data normalisert til fem JSON-tabeller, fane «Måned», fast tabellbredde, mobilregler og ny overskrift. Gjenstår hos bruker: uke 32 («Syk»), uke 41 (høstferie), team Vest/Begge, Ansatte-fane, årsskifte, Måned-fanen, lik bredde mellom faner/uker, mobilvisning (se plan.md Verifisering 1–9).
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte, gren `master`.

## Verifisert
- `tsc --noEmit` og `npm run lint` rent etter siste kodeendring; `npm run build` kjørt i fase-slutt (se logg).
- Ukeplan for Øst vises riktig med endring, «Fri» og skolekalender-merknad (bruker, uke 39).
- Normaliserte data gir samme ansatte/endringer som før (0 avvik mot gamle filer).

## Neste
Bruker sjekker resten av Fase 1 på http://localhost:3000 (plan.md Verifisering 1–9). Deretter: kollaps Fase 1 i planen og start Fase 2, «Min plan» + «Velg deg selv»-dropdown (planmodus først, fasen er ikke skissert i detalj i planen).

## Arbeidsmåte neste økt
- `[dev-server-først]` Sjekk om dev-server alt kjører på port 3000 før `npm run dev`.
- `[persondata-i-plan]` Planer som importerer registre må avklare `.gitignore` for uttrekket.
- `[lange-edits-via-fil]` Lange kodeendringer med Write/Edit, ikke `node -e` med sitert kode i Bash.

## Det en ny økt må vite
- Åpne Claude Code i `app/`: repoet, `kunnskap/` og CLAUDE.md ligger der, mappa over er tom.
- Excel-fila `Vaktliste_2026-2027_Team_Ost_og_Vest.xlsx` ligger i `app/` (ikke i git). `npm run import` regenererer `data/*.json` (fem tabeller med id/fremmednøkler, se plan.md Datamodell). Team er bare Øst/Vest; bare lokasjoner fra arket Lokasjoner gjelder; Excel gjenbruker noen rad-id-er (rettes i Excel).
- Excel er source of truth i Fase 1; ukeplan-cellene regnes ut, importeres ikke. Merknader over datoene kommer fra arket `Dager`.
- Bare endringer med status «Godkjent» vises i ukeplanen.
- Persondata-regel: `data/` og xlsx er ikke i git.
- Node-skript kan ikke importere `.ts` direkte (mangler filendelse); test via `next dev`/`build`.
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database tilgjengelig nå: JSON i `data/` til SR sier fra (blokkerer Fase 3). Reelle persondata i appen krever avklart behandlingsgrunnlag, se `TODO.md` punkt 1.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet.
