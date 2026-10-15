# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–21, 22A, 22B, 23–31 og 35–43 ✅. **43** (SQLite i stedet for JSON) verifisert av Ståle 2026-10-15: flytting uten avvik, visningene som før, endring står etter omstart. Planlagt og godkjent 2026-10-15: **Fase 44–46** (endringslogg/synkstatus/import i databasen, pålogging med e-post og passord, Docker); MySQL i Docker er ikke fasesatt. **Ikke oppgitt fra 43:** ny linje i Admin → Logg etter endringen. Fra eldre faser (detaljer i loggen): 42 mobilkalender uten fyll, vedlikehold; 41 måned over årsskiftet; 40 smalt vindu, «venter» for ansatt; 37–38 merkene for overlapp, ansatt uten admin ser ikke «Registrer»; 30 automatisk synk; 28 ekte telefon/pad; 26 radtellingen Excel «Dager» mot appen.
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.4.0 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4, Node 26.8.2 med innebygd `node:sqlite`.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit`, `npm run lint` og `next build` grønne etter Fase 43 (2026-10-15). Fase 29: funn F1–F10 i `sikkerhet.md`, alle rettet eller besluttet.
- Databaselaget prøvd med oppdiktede data i minnet (7 av 7). Overlapp Fase 37 (9 av 9), klokkeslett Fase 35 (14 av 14), synk Fase 30 (37 av 37), farger Fase 42 (13 av 13).
- Ikke prøvd: retting og sletting fra Ukeplan, klikk i Måned, vedlikeholdsmodus mot en ansatt som lagrer, to faner samme dag, masseendring, lagring når databasefila er låst.

## Neste
**Fase 44** (Sonnet): endringslogg (`data/endringslogg.jsonl`) og `data/synkstatus.json` inn i databasen, og `npm run import` mot databasen. **Viktig nå:** `npm run import` skriver fortsatt `vaktliste.json`, som appen overser etter Fase 43 — ikke bruk den før 44. Ubesluttet: «Vis i ukeplan» fra Admin åpner Dag; skal den åpne Uke?

## Arbeidsmåte neste økt
- `[farge-mot-palett]` (2. runde) Ny farge til en utheving: sammenlign med `globals.css` (`--accent`, `.prikk--*`) før du velger, også startverdier, og bygg forhåndsvisningen planen lover eller si at den ble utelatt.
- `[kommando-med-mappe]` Kommandoer brukeren skal kjøre gis som kopierbar blokk som starter med `cd app` — terminalen åpner i overmappa.

## Det en ny økt må vite
- **Data ligger i `data/vaktliste.db` (SQLite, ikke i git).** `vaktliste.json` er urørt reserve. Skjema i `db/skjema.sql`; `lib/database.ts` gjør om mellom tabeller og `Vaktliste` (deles med `scripts/json-til-sqlite.mjs`, bare `import type` fra domene). Begrunnelser i `arkitektur.md` («Datalag: SQLite»).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (én transaksjon, revisjonssjekk, skriver bare endrede tabeller, `VACUUM INTO`-kopi etter lagring, 20 siste). **Nytt felt eller ny tabell:** ingen omgjøring i databasen finnes ennå — øk `SKJEMA_VERSJON`, legg en `ALTER TABLE`-migrering i `lib/lager.ts`, kolonnen i `db/skjema.sql` og i `TABELLER` i `lib/database.ts`.
- `app/layout.tsx` kaller `cookies()` før `lesVaktliste()`, så `next build` ikke leser databasen. Hold det slik.
- **Alle handlinger går gjennom `utforSom` i `lib/utfor.ts`** (`valgtAnsatt()`): Admin (`app/admin/handlinger.ts`) og planen (`app/handlinger.ts`). Hva en ansatt får gjøre sjekkes i `lib/domene.ts`.
- **Endringsloggen** (`lib/endringslogg.ts`, `data/endringslogg.jsonl`): nye tabeller eller felt må inn i `TABELLER` og `FELTNAVN`. `endretAv` er oppsettets id eller `SYNK_AVSENDER`.
- **Synk (Fase 30):** `lib/synk.ts` (`testkilde`: `data/entra-test.json`), `kjørSynk`, `synkHvisForfalt` via `after()` i layouten; reglene i `lib/domene.ts`. Fase 32 bytter `aktivKilde()` til Graph.
- **Innstillinger (skjemaversjon 15):** `vedlikehold`, `melding`, `idagFarge`, `idagFyll`; i databasen sammen med `synk` i tabellen `innstillinger`.
- `lib/domene.ts` deles med skriptene og har ingen imports. Node importerer `.ts` direkte; i `node`-skript på Windows skrives absolutte stier som `file:///C:/...`.
- **Godkjenning:** `Status.virkning` `godkjent|venter|avvist`. `EndringVindu.tsx` (`useEndringVindu`, `useRettVindu`), `Godkjenning.tsx`, `GodkjenningListe.tsx`. Flere endringer samme dag og overlapp: `UkeplanCelle.endringer`/`.overlapp`, `finnOverlapp` i domene.
- **Visninger:** Dag (`DagClient.tsx`, `beregnDag`), Uke (fane-id `ukeplan`), Måned (`MaanedClient.tsx`, `.mkal` M–F på mobil). Tabell/kort bytter ved 768 px; ny kolonne må inn begge steder. Etter CSS-endringer: Ctrl+F5.
- Admin-sider som leser fra disk trenger `export const dynamic = "force-dynamic"`. Admin-skjemaer er ukontrollerte (`useSkjemaStatus`, `defaultValue`). En `"use server"`-fil kan bare eksportere funksjoner.
- **Sikkerhet:** F1–F10 i `kunnskap/sikkerhet.md`. Identitet er usignert cookie (`vaktliste-identitet`), byttes i Fase 45; dev-serveren lytter på nettet (F10).
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit. CSS-klassenavn uten æøå. Aldri lim ekte rader inn i logg, STATUS eller plan. Nøkler i lister: `teamId-id`.
- Kortet ned ved Fase 43: detaljene om git-historikken (`refs/original/`), «Registrer», dagens dato, ukenummer, sortering, figur, Dager, «Mine endringer» og endringstypenes farge står i `git show 43ab5e2:kunnskap/STATUS.md` (siste commit før Fase 43).
- Persondata-deny-settet er tilbudt i `.claude/settings.json`, ikke besluttet. Fila har en ucommittet endring som er brukerens egen godkjenning; den tas ikke med i faseslutt-commit.
