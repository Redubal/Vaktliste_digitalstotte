# Logg

## 2026-09-30 (senere økt) — Fase 1: data normalisert, månedsvisning, layout

- Levert: `data/*.json` er nå fem tabeller (`brukere`, `lokasjoner`, `oppsett`, `endringer`, `dager`) med `id` og fremmednøkler, `null` for tomt og `HH:MM` for klokkeslett. `lib/vaktlista.ts` slår dem sammen til `Ansatt`/`Endring` for UI. Sammenlignet mot gamle filer: 0 avvik (47 ansatte, 303 endringer).
- Levert: fane «Måned» (`components/MaanedClient.tsx`, `beregnMaaned` i `lib/ukeplan.ts`); ukeplanen bruker nå de samme cellefunksjonene. Fast tabellbredde (`table-layout: fixed`), `width: 100%` på `.page-shell`, mobilregler. «Kilde: Excel-arbeidsbok» fjernet, ny overskrift «Digital Støtte - Vaktlista».
- **Beslutning (bruker, team):** team er bare Øst og Vest; importen stopper på alt annet.
- **Beslutning (bruker, lokasjoner):** bare lokasjoner fra arket Lokasjoner gjelder, PUS fjernes (tre endringer får lokasjonId null). Tolkning av «stor forbokstav»: navn får stor forbokstav ved import.
- Funn (belegg: importkjøring): Excel bruker rad-id-er flere ganger (OST-0232 tre ganger, 0234, 0238, 0241). Nye rader får suffiks; bør rettes i Excel.
- Funn (hypotese, ikke sett i nettleser): sidebredden var ulik mellom faner fordi `body` er flex-kolonne og `margin: 0 auto` krymper siden til innholdet. `width: 100%` er lagt til, men brukeren har ikke bekreftet.
- Remote satt opp: https://github.com/Redubal/Vaktliste_digitalstotte.git, `master` pushet (7b08521 = data-normaliseringen).
- Ikke verifisert hos bruker: Måned-fanen, lik bredde mellom faner og uker, mobilvisning, og restlisten fra forrige innslag.
- Sjekk: `tsc --noEmit`, `npm run lint` og `npm run build` grønne etter månedsvisningen; etterpå bare overskriftstekst, der `tsc` og `lint` ble kjørt grønt. Ikke kjørt på nytt i fase-slutt.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 2 treff. `data/` og `*.xlsx` er ikke tracket. Ny STATUS: 33 linjer.
- fase-slutt: 15:12–15:14, 2 min.
## 2026-09-30 — Fase 1: Ukeplan per team (skrevet, verifisering delvis hos bruker)

**Etter verifisering (senere økt, samme dag):**
- Bruker åpnet siden og så ukeplanen for Øst i uke 39: celler lå stablet loddrett i første dagskolonne. Årsak: `.celle` (`display: flex`) lå på `<td>`. Rettet ved å legge klassen på en `div` inni cellen (`components/UkeplanClient.tsx`). Bruker bekreftet «ble bra» på nytt skjermbilde.
- Observert: merknaden «Samling 1.år bli kjent» over 23. sep kommer fra arket `Dager` i Excel (via `data/dager.json`). Bruker hadde selv lagt den inn.
- Faseflyt-oppsettet ble fullført i `app/`: `sikkerhet.md`, `arkitektur.md`, `TODO.md`, `.claude/settings.json`, `.claude/skills/README.md`, faseflyt-avsnitt i `CLAUDE.md`.
- **Beslutning (SR, database 2026-09-30):** ingen databasetilgang nå, så JSON i `data/` inntil videre. Blokkerer bare Fase 3.
- **Beslutning (Claude, persondata):** løsningen skal ende med reelle persondata i appen, så den er ikke en ren prototype. Behandlingsgrunnlag er ført som `TODO.md` punkt 1. Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt, ikke skrevet.
- Ikke verifisert: uke 32 (Syk), uke 41, team Vest/Begge, Ansatte-fanen, årsskifte 2026→2027. Bruker svarte at de ikke hadde fått beskjed om å sjekke dette (økten startet i mappa over `app/`, så STATUS-listen ble aldri lest). Fasen kollapses derfor ikke i planen ennå.
- Funn: fase-start ble kjørt fra mappa over `app/` og fant ingen STATUS. Repoet og `kunnskap/` ligger i `app/`.
- Sjekk: `tsc --noEmit` og `npm run lint` rene rett etter celle-rettelsen; `npm run build` kjørt i fase-slutt: OK (kompilerte, 3 sider generert).
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 2 treff. `data/` og `*.xlsx` er ikke tracket. Ny STATUS: 32 linjer.

**Levert:**
- `npm run import` (`scripts/import-excel.mjs`) leser Excel-fila og skriver `data/ansatte|endringer|dager|lokasjoner.json` (47 / 303 / 20 / 14 rader).
- `lib/uker.ts` (ISO-uke), `lib/ukeplan.ts` (fletter fast lokasjon + godkjente endringer per dag), `lib/vaktlista.ts` utvidet.
- UI: tabs Ukeplan/Ansatte, team-velger Øst/Vest/Begge, uke-navigering, skolekalender-merknader, fargekodede celler.
- Gammel `data/vaktliste.json` fjernet (erstattet av `ansatte.json`).

**Beslutninger:**
- **Beslutning (SR, formål):** katalog + ukeplan-visning; appen skal erstatte Excel, ikke kopiere den.
- **Beslutning (SR, database):** utsatt, SR sjekker om SQLite kan installeres. Fase 1 bruker JSON.
- **Beslutning (SR, omfang/auth):** faseinndelt, Fase 1 uten «Min plan»; «Velg deg selv»-dropdown til Entra SSO kommer (Fase 4).
- **Beslutning (Claude, datamodell):** ukeplanen regnes ut fra Ansatte + Endringer + Dager, ikke importert fra Excels avledede Ukeplan-ark.
- **Beslutning (Claude, persondata):** `/data/` og `*.xlsx` lagt i `.gitignore` fordi filene har navn, e-post og sykefravær. Ny klone må kjøre `npm run import` med Excel-fila i `app/`. Appen viser tom liste uten data. SR bør bekrefte eller si fra om data skal versjoneres på annen måte.

**Funn:**
- Excel-fila ligger i `app/`, ikke ett nivå opp; planen hadde feil sti, skriptet bruker riktig.
- Én endring (VEST-0044) gjelder Ismail (Øst-ansatt) på Vest-arket; personId slås derfor opp på navn (navn er unike, 0 duplikater).
- ISO-uke ga først feil (uke 40 for 5. okt); rettet til `Math.ceil` med torsdagsregelen og testet mot 8 datoer inkl. årsskifte.
- Observert: siden viser Uke 40 (28. sep – 2. okt) med Ismail på Nøtterøy og Lukasz «Fri» (OST-0234). Uke 41-merknad og uke 32-«Syk» er IKKE observert i nettleser; ad hoc-test i Node feilet (importer uten filendelse), så det gjenstår hos bruker.
- Dev-server: port 3000 var alt i bruk av en tidligere server (PID 20388).

**Sjekk:** `npx tsc --noEmit` 0 feil, `npm run lint` rent, `npm run build` OK (kl. ca. 13:25, etterpå bare `.gitignore` og `kunnskap/`).

Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 3 treff. Ingen data-uttrekk tracket (`data/`, `*.xlsx`); søket dekket staget innhold.

STATUS: 31 linjer. `plan.md`: 158 linjer (over 100–150; Fase 1 kollapses etter verifisering).
fase-slutt: 13:29–13:31, ca. 2 min. Ingen remote, så ingen push.
