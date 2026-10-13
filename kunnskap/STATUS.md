# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–15 ✅. Fase 15 (mobilformat: kort per person i Ukeplan og Måned under 768 px) er bekreftet av bruker 2026-10-13 («ser ok ut, finner ingen åpenbare feil») uten at hva som ble prøvd ble oppgitt punkt for punkt. Fase 14 (vedlikeholdsmodus) bekreftet på samme måte. Fase 13 (sortering i kolonner): layouten i Admin → Ansatte (ekte kolonner fra 1280 px) er justert to ganger etter skjermbilder; resultatet etter siste justering er ikke sett. Forbehold fra tidligere faser (hva som ble prøvd ble ikke oppgitt): omdøping av «Godkjent» lar planen stå uendret er ikke sett (Fase 5); nytt rollenavn i Ansatte er ikke testet (Fase 4); rolle og lokasjon på en ansatt er ikke bekreftet enkeltvis (Fase 7).
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit` ren etter siste kodeendring i `.tsx`/`.ts` i Fase 15; `npm run lint` kjørt ved faseslutt Fase 15 (se loggen). `next build` ble ikke kjørt i Fase 10–15 (en kjørende `next dev` kan komme i konflikt); sist kjørt ved faseslutt i Fase 8.
- Ikke testet av meg i nettleser: alt i Fase 15, 14, 13, 12 og 10, og fra før: endringslogg, masseendring (`beregnEndringer` ikke kjørt i Node; tre loggrader, «Velg alle synlige», «Deaktiver valgte», «Fjern», feilmeldinger ikke bekreftet), omdøping av «Godkjent», «Vises i plan», sletting av status/type i bruk, to faner samtidig, ny lagring ved låst fil, team med flere enn to team, «Lagret»-farge i «legg til»-skjemaene, advarsel ved menyvalg mellom Admin-sider. Omgjøringene v2 → v6 er testet bare med oppdiktede rader i Node.
- Fase 15 ikke sett av bruker: «Vis i ukeplan» fra Admin som ruller til kortet, sortering på kortene, Måned-kalender for måned som starter midt i uka.

## Neste
Fase 16, «Synk av ansatte, med lokal testkilde» (`plan.md`), på tyngste modell. Fase 17–19 venter på tilganger (app-registrering, Graph, database). «Lagre alle»-knapp og rollefilter i uke-/månedsplanen er ønsket av bruker, utenfor planen, se `TODO.md`.

## Arbeidsmåte neste økt
- (ingen aktive punkter)

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; push uten force gikk 2026-09-30. Gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- Åpne Claude Code i `app/`: repoet, `kunnskap/`, `TODO.md` og CLAUDE.md ligger der. Rotmappa har en pekerfil `CLAUDE.md` (utenfor git) som sier det samme.
- **Alle data ligger i `data/vaktliste.json`** (én fil, ikke i git). Appen eier dataene; Excel var en engangsinnlasting (`npm run migrer` er kjørt). `npm run import` nekter å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi i `data/sikkerhetskopi/`, atomisk lagring). Admin sjekkes inne i hver handling (`utfor` i `app/admin/handlinger.ts`), ikke bare på siden.
- **Endringsloggen** (`lib/endringslogg.ts`) skrives fra `endreVaktliste` til `data/endringslogg.jsonl` (ikke i git), én linje per rad lagt til/endret/fjernet. Nye tabeller eller felt må inn i `TABELLER` og `FELTNAVN` der, ellers vises rå feltnavn. `innstillinger` er ikke en tabell: `rader()` gjør den til én rad. `endretAv` er oppsettets id; Fase 16 trenger egen avsender for synk (`TODO.md`).
- **Vedlikeholdsmodus:** `Vaktliste.innstillinger` (skjemaversjon 6). Rotlayouten `app/layout.tsx` leser den og skjuler alle sider for ikke-administratorer; «Velg deg selv» står igjen der. `utfor` revaliderer `/` med `"layout"`.
- `lib/domene.ts` deles med skriptene og har ingen imports. Node 26.8.2 importerer `.ts` direkte (ufarlig modultype-advarsel; `node --no-warnings` skjuler den). I `node`-skript på Windows må absolutte stier i `import` skrives som `file:///C:/...`.
- Admin er egne sider under `/admin` (team, ansatte, lokasjoner, roller, endringstyper, logg). Sider som leser fra disk trenger `export const dynamic = "force-dynamic"`. Ansatte-skjemaene bruker oppsettets id, ikke brukerens: en person kan ha flere oppsett.
- **Deaktiverte ansatte (`Bruker.aktiv = false`) er ikke med i `getAnsatte`**. Admin → Ansatte leser `lesVaktliste()` direkte for å vise dem; ny kode som trenger alle personer må gjøre det samme. `entraId` er tom til Fase 16.
- Admin-skjemaer er ukontrollerte og bruker `useSkjemaStatus` i `components/AdminFelles.tsx` (rød/grønn rad, `beforeunload`). Nye `*Admin`-skjemaer bruker samme kroken, ikke `key={revisjon}`. Feltene er `defaultValue`: endres en rad utenfra (masseendring), bytt nøkkel først når siden har fått ny revisjon (`ventende` i `AnsattAdmin.tsx`). En `"use server"`-fil kan bare eksportere funksjoner; konstanter ligger i `lib/domene.ts`.
- **Sortering:** `?sorter=kolonne` / `-kolonne` og `?fane=` skrives med `replaceState` (`components/Sortering.tsx`, `Tabs.tsx`); nye tabeller bruker `useSortering` + `sorterRader` fra `lib/sortering.ts`. Admin → Ansatte har kolonnelayout fra 1280 px (`.ansatt-rutenett` i `globals.css`); nye felt i raden må inn i kolonnemalen der.
- **Mobil:** Ukeplan og Måned har både tabell (`.visning-tabell`) og kortliste (`.visning-kort`); CSS bytter ved 768 px. Ny kolonne eller felt i raden må inn begge steder. Etter CSS-endringer kan nettleseren vise gammel versjon (Ctrl+F5).
- «Velg deg selv» er ikke sikkerhet; hvem som helst kan velge en administrator. Erstattes av Entra.
- Ukeplanen tar bare med endringer der statusen har `visesIPlan`, og fri-farge styres av `kategori` på typen (`lib/ukeplan.ts`). Team er data: filter går på `teamId`, `ALLE_TEAM = "*"` i `lib/ukeplan.ts`; rekkefølgen i tabellen `team` er rekkefølgen i velgeren.
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit, ikke store heredocs med flere filer. CSS-klassenavn uten æøå.
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database nå: JSON i `data/` (blokkerer SQLite). Reelle persondata i appen krever behandlingsgrunnlag, `TODO.md` punkt 1. `Ansatt.id` er bruker-id; en bruker med flere oppsett gir flere rader med samme id, så nøkler i lister bruker `teamId-id`.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet. Fila har en ucommittet endring (`git push` tillatt) som er brukerens egen godkjenning; den tas ikke med i faseslutt-commit.
