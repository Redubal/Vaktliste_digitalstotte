# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–17 ✅. Fase 17 («Små rettinger») er bekreftet av bruker 2026-10-13 («ok, det fungerer») på Admin → Endringstyper etter to rettinger av fargevalget. Etternavn-kolonnen, navn A–Å som standard og fargene i Ukeplan og Måned ble ikke nevnt særskilt. Fase 16 (Lagre alle, rollefilter) og 15 (mobilformat) og 14 (vedlikeholdsmodus) bekreftet uten at hva som ble prøvd ble oppgitt punkt for punkt. Fase 13 (sortering): resultatet etter siste justering av Admin → Ansatte er ikke sett. Forbehold fra tidligere faser: omdøping av «Godkjent» lar planen stå uendret er ikke sett (Fase 5); nytt rollenavn i Ansatte er ikke testet (Fase 4); rolle og lokasjon på en ansatt er ikke bekreftet enkeltvis (Fase 7).
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring i Fase 17. `next build` ikke kjørt i Fase 10–17 (en kjørende `next dev` kan komme i konflikt); sist kjørt ved faseslutt i Fase 8.
- Ikke testet av meg i nettleser: alt i Fase 17, 16, 15, 14, 13, 12 og 10, og fra før: endringslogg, masseendring, omdøping av «Godkjent», «Vises i plan», sletting av status/type i bruk, to faner samtidig, ny lagring ved låst fil, team med flere enn to team, advarsel ved menyvalg mellom Admin-sider. Omgjøringene v2 → v6 er testet bare med oppdiktede rader i Node; v7 → v9 er sett virke i Admin på brukerens egen fil, ikke i Node.
- Fase 17 ikke prøvd: kolonnebredden i Admin → Ansatte med to navnekolonner under 1280 px, farge på en type med ny lokasjon, ugyldig farge i skjemaet. Fase 16 ikke prøvd: ugyldig rad blant gyldige i «Lagre alle», rollefilter i Måned og på smal skjerm.

## Neste
Fase 18, «Godkjenningsliste i Admin» (`plan.md`): tyngste modell (rettighetsregler). Deretter 19 status direkte i planen (tyngste modell) og 20 mobil/pad-test og logo (Sonnet). Entra og database er parkert som Fase 21–24 («Senere» i `plan.md`).

## Arbeidsmåte neste økt
- `[knapp-har-forutsetning]` Knapp som krever et valg: grå den ut til valget finnes, og skjul gammel feilmelding når valget endres.
- `[skjemasteg-er-låst-etter-test]` Er datafila lagret etter at et versjonssteg ble skrevet, rett data med et nytt steg, ikke ved å endre det gamle.

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; push uten force gikk 2026-09-30. Gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- Åpne Claude Code i `app/`: repoet, `kunnskap/`, `TODO.md` og CLAUDE.md ligger der. Rotmappa har en pekerfil `CLAUDE.md` (utenfor git) som sier det samme.
- **Alle data ligger i `data/vaktliste.json`** (én fil, ikke i git). Appen eier dataene; Excel var en engangsinnlasting (`npm run migrer` er kjørt). `npm run import` nekter å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi i `data/sikkerhetskopi/`, atomisk lagring). Admin sjekkes inne i hver handling (`utfor` i `app/admin/handlinger.ts`), ikke bare på siden.
- **Endringsloggen** (`lib/endringslogg.ts`) skrives fra `endreVaktliste` til `data/endringslogg.jsonl` (ikke i git). Nye tabeller eller felt må inn i `TABELLER` og `FELTNAVN` der, ellers vises rå feltnavn. `endretAv` er oppsettets id; synk (Fase 21, parkert) trenger egen avsender (`TODO.md`).
- **Vedlikeholdsmodus:** `Vaktliste.innstillinger`. Rotlayouten `app/layout.tsx` skjuler alle sider for ikke-administratorer; «Velg deg selv» står igjen der.
- `lib/domene.ts` deles med skriptene og har ingen imports (skjemaversjon 9). Node 26.8.2 importerer `.ts` direkte; i `node`-skript på Windows må absolutte stier i `import` skrives som `file:///C:/...`.
- **Endringstyper har `farge`** (`#rrggbb` eller `null` = standardfarge for kategorien, `STANDARDFARGER` i `lib/domene.ts`, samme farger som stilarket). En farge lik standarden lagres som `null`. Cellefarge: `egenCelleStil` og `egenFarge` i `lib/ukeplan.ts`. Navn er ett felt; `delNavn` i `lib/sortering.ts` gir fornavn og etternavn (siste ord).
- Admin er egne sider under `/admin`. Sider som leser fra disk trenger `export const dynamic = "force-dynamic"`. Ansatte-skjemaene bruker oppsettets id, ikke brukerens: en person kan ha flere oppsett.
- **Deaktiverte ansatte (`Bruker.aktiv = false`) er ikke med i `getAnsatte`**. Admin → Ansatte leser `lesVaktliste()` direkte for å vise dem; ny kode som trenger alle personer må gjøre det samme. `entraId` er tom til Fase 21.
- Admin-skjemaer er ukontrollerte og bruker `useSkjemaStatus` i `components/AdminFelles.tsx`. Nye `*Admin`-skjemaer bruker samme kroken, ikke `key={revisjon}`. Feltene er `defaultValue`: endres en rad utenfra (masseendring, «Lagre alle»), bytt nøkkel først når siden har fått ny revisjon (`ventende` i `AnsattAdmin.tsx`). En `"use server"`-fil kan bare eksportere funksjoner; konstanter ligger i `lib/domene.ts`.
- **Sortering og rollefilter:** `?sorter=kolonne` / `-kolonne`, `?rolle=` og `?fane=` skrives med `replaceState`; nye tabeller bruker `useSortering(kolonner, standard?)` + `sorterRader`. Admin → Ansatte har kolonnelayout fra 1280 px (`.ansatt-rutenett` i `globals.css`); nye felt i raden må inn i kolonnemalen der.
- **Mobil:** Ukeplan og Måned har både tabell (`.visning-tabell`) og kortliste (`.visning-kort`); CSS bytter ved 768 px. Ny kolonne eller felt må inn begge steder. Etter CSS-endringer kan nettleseren vise gammel versjon (Ctrl+F5).
- «Velg deg selv» er ikke sikkerhet; erstattes av Entra (Fase 22, parkert). Ukeplanen tar bare med endringer der statusen har `visesIPlan`; team er data (`ALLE_TEAM = "*"`).
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit. CSS-klassenavn uten æøå. Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database nå: JSON i `data/`. Reelle persondata i appen krever behandlingsgrunnlag, `TODO.md` punkt 1. En bruker med flere oppsett gir flere rader med samme id, så nøkler i lister bruker `teamId-id`.
- Persondata-deny-settet er tilbudt i `.claude/settings.json`, ikke besluttet. Fila har en ucommittet endring (`git push` tillatt) som er brukerens egen godkjenning; den tas ikke med i faseslutt-commit.
