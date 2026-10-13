# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–9 ✅. Fase 9 (full endringslogg) er godkjent av bruker 2026-10-13 med «virker», inkludert periodefilter, nedtrekksliste på tabell og låste kolonnebredder lagt til etter brukerens tilbakemelding. Forbehold fra tidligere: omdøping av «Godkjent» lar planen stå uendret er ikke sett (Fase 5); nytt rollenavn i Ansatte er ikke testet (Fase 4); rolle og lokasjon på en ansatt er ikke bekreftet enkeltvis (Fase 7). Mobilvisningen trenger et bedre format (utsatt, `TODO.md`).
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit` og `npm run lint` rene etter siste kodeendring i Fase 9. `next build` ble ikke kjørt i Fase 9 (en kjørende `next dev` kan komme i konflikt); sist kjørt ved faseslutt i Fase 8.
- Omgjøringene v2 → v3 og v3 → v4 er testet med oppdiktede rader i Node, ikke mot ekte data. `beregnEndringer` (endringsloggen) er ikke kjørt i Node. Ikke testet i nettleser av meg: loggføring av lagt til og fjernet rader, ødelagt linje i loggfila, taket på 500 linjer, omdøping av «Godkjent», «Vises i plan» av/på, sletting av status/type i bruk, to faner samtidig, ny lagring ved låst fil, opprydding av sikkerhetskopier, team med flere enn to team i alle visninger, «Lagret»-farge i «legg til»-skjemaene, advarsel ved menyvalg mellom Admin-sider.

## Neste
Fase 10, «Ansatte: når de kom inn, deaktivering og adminstatus» (`plan.md`, «Admin-forbedringer, ansatte og Entra»), på Sonnet. Skjemaversjon 5 (nytt steg i `oppgraderVaktliste`). Fase 16–19 går på tyngste modell; 17–19 venter på tilganger (app-registrering, Graph, database). «Lagre alle»-knapp er ønsket av bruker, utenfor planen, se `TODO.md`.

## Arbeidsmåte neste økt
Ingen aktive punkter. (`bash-cd-persisterer` er gjort til regel i `app/CLAUDE.md`.)

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; push uten force gikk 2026-09-30. Gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- Åpne Claude Code i `app/`: repoet, `kunnskap/`, `TODO.md` og CLAUDE.md ligger der. Rotmappa har en pekerfil `CLAUDE.md` (utenfor git) som sier det samme.
- **Alle data ligger i `data/vaktliste.json`** (én fil, ikke i git). Appen eier dataene; Excel var en engangsinnlasting (`npm run migrer` er kjørt). `npm run import` nekter å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi i `data/sikkerhetskopi/`, atomisk lagring). Admin sjekkes inne i hver handling (`utfor` i `app/admin/handlinger.ts`), ikke bare på siden.
- **Endringsloggen** (`lib/endringslogg.ts`) skrives fra `endreVaktliste` til `data/endringslogg.jsonl` (ikke i git), én linje per rad lagt til/endret/fjernet, med navn slått opp. Nye tabeller eller felt må inn i `TABELLER` og `FELTNAVN` der, ellers vises rå feltnavn. `endretAv` er oppsettets id; Fase 16 trenger egen avsender for synk (`TODO.md`).
- `lib/domene.ts` deles med skriptene og har ingen imports. Node 26.8.2 importerer `.ts` direkte (gir en ufarlig modultype-advarsel; `node --no-warnings` skjuler den). I `node`-skript på Windows må absolutte stier i `import` skrives som `file:///C:/...`.
- Admin er egne sider under `/admin` (team, ansatte, lokasjoner, roller, endringstyper, logg), ikke en fane. Sider som leser fra disk trenger `export const dynamic = "force-dynamic"`. Ansatte-skjemaene bruker oppsettets id, ikke brukerens: en person kan ha flere oppsett.
- Admin-skjemaer er ukontrollerte og bruker `useSkjemaStatus` i `components/AdminFelles.tsx` (rød/grønn rad, `beforeunload`). Nye `*Admin`-skjemaer skal bruke den samme kroken, ikke `key={revisjon}`.
- «Velg deg selv» er ikke sikkerhet; hvem som helst kan velge en administrator. Erstattes av Entra.
- Ukeplanen tar bare med endringer der statusen har `visesIPlan`, og fri-farge styres av `kategori` på typen (`lib/ukeplan.ts`). Navn på status og type betyr ingenting for beregningen.
- Team er data: filter og telling går på `teamId`, navnet (`Ansatt.team`) er bare til visning. Valget «Alle team» er `ALLE_TEAM = "*"` i `lib/ukeplan.ts`. Rekkefølgen i tabellen `team` er rekkefølgen i velgeren.
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit, ikke store heredocs med flere filer.
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database nå: JSON i `data/` (blokkerer SQLite). Reelle persondata i appen krever behandlingsgrunnlag, se `TODO.md` punkt 1. `TODO.md` punkt 2: fjern «Fast lokasjon»-kolonnen.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet. Fila har en ucommittet endring (`git push` tillatt) som er brukerens egen godkjenning; den tas ikke med i faseslutt-commit.
