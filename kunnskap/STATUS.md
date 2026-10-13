# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–7 ✅. Fase 7 (ansattes team, rolle og lokasjon i Admin) er godkjent av bruker 2026-10-13 med «fungerer» etter å ha byttet team og sett personen flytte seg i Ukeplan; rolle og lokasjon er ikke bekreftet enkeltvis. Planen har ingen flere faser. Forbehold fra tidligere: omdøping av «Godkjent» lar planen stå uendret er ikke sett (Fase 5); nytt rollenavn i Ansatte er ikke testet (Fase 4). Mobilvisningen trenger et bedre format (utsatt, `TODO.md`).
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit`, `npm run lint` og `next build` rene ved faseslutt (Fase 7: bare `tsc` og `lint` kjørt grønt, se logg).
- Omgjøringene v2 → v3 og v3 → v4 er testet med oppdiktede rader i Node, ikke mot ekte data. Ikke testet i nettleser av meg: omdøping av «Godkjent», «Vises i plan» av/på, ny type med kategori fravær, sletting av status/type i bruk, to faner samtidig, ny lagring ved låst fil, opprydding av sikkerhetskopier, team med flere enn to team i alle visninger, endring av rolle og lokasjon på en ansatt.

## Neste
Planen er ferdig. Bruker har lagt nye ønsker i `TODO.md`: markering av ulagrede endringer (rødt) og lagret (grønt) i hele Admin, full endringslogg, hopp mellom ansatt på forsiden og i Admin, og ansatte/Entra-synk (se når ansatt kom inn, masseendringer, deaktivere, synk-tidspunkt og tvunget synk, adminstatus). Neste økt: lag en ny plan av dem i planmodus med tyngste modell (`/model` til tyngste før planen skrives). Planmodus er når Claude bare planlegger og du godkjenner først.

## Arbeidsmåte neste økt
- `[bash-cd-persisterer]` Mappebyttet fra `cd` blir stående mellom Bash-kall: bruk full sti i hvert kall, og sjekk mappen før et tomt svar tolkes som «ingenting».

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; push uten force gikk 2026-09-30. Gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- Åpne Claude Code i `app/`: repoet, `kunnskap/`, `TODO.md` og CLAUDE.md ligger der. Rotmappa har en pekerfil `CLAUDE.md` (utenfor git) som sier det samme.
- **Alle data ligger i `data/vaktliste.json`** (én fil, ikke i git). Appen eier dataene; Excel var en engangsinnlasting (`npm run migrer` er kjørt). `npm run import` nekter å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi i `data/sikkerhetskopi/`, atomisk lagring). Admin sjekkes inne i hver handling (`utfor` i `app/admin/handlinger.ts`), ikke bare på siden.
- `lib/domene.ts` deles med skriptene og har ingen imports. Node 26.8.2 importerer `.ts` direkte (gir en ufarlig modultype-advarsel; `node --no-warnings` skjuler den). I `node`-skript på Windows må absolutte stier i `import` skrives som `file:///C:/...`.
- Admin er egne sider under `/admin` (team, ansatte, lokasjoner, roller, endringstyper), ikke en fane. Sider som leser fra disk trenger `export const dynamic = "force-dynamic"`. Ansatte-skjemaene bruker oppsettets id, ikke brukerens: en person kan ha flere oppsett.
- «Velg deg selv» er ikke sikkerhet; hvem som helst kan velge en administrator. Erstattes av Entra.
- Ukeplanen tar bare med endringer der statusen har `visesIPlan`, og fri-farge styres av `kategori` på typen (`lib/ukeplan.ts`). Navn på status og type betyr ingenting for beregningen.
- Team er data: filter og telling går på `teamId`, navnet (`Ansatt.team`) er bare til visning. Valget «Alle team» er `ALLE_TEAM = "*"` i `lib/ukeplan.ts`. Rekkefølgen i tabellen `team` er rekkefølgen i velgeren.
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit, ikke store heredocs med flere filer.
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database nå: JSON i `data/` (blokkerer SQLite). Reelle persondata i appen krever behandlingsgrunnlag, se `TODO.md` punkt 1. `TODO.md` punkt 2: fjern «Fast lokasjon»-kolonnen.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet. Fila har en ucommittet endring (`git push` tillatt) som er brukerens egen godkjenning.
