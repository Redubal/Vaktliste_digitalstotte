# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–6 ✅. Fase 6 (team er data og kan redigeres i Admin) er godkjent av bruker 2026-10-13 med «ferdig»; de fire verifiseringspunktene er ikke bekreftet enkeltvis. Neste er Fase 7 (ansattes rolle, team og lokasjon). Forbehold fra tidligere: omdøping av «Godkjent» lar planen stå uendret er ikke sett (Fase 5); nytt rollenavn i Ansatte er ikke testet (Fase 4). Mobilvisningen trenger et bedre format (utsatt, `TODO.md`).
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit`, `npm run lint` og `next build` rene ved faseslutt.
- Omgjøringene v2 → v3 og v3 → v4 er testet med oppdiktede rader i Node, ikke mot ekte data. Ikke testet i nettleser av meg: omdøping av «Godkjent», «Vises i plan» av/på, ny type med kategori fravær, sletting av status/type i bruk, to faner samtidig, ny lagring ved låst fil, opprydding av sikkerhetskopier, team med flere enn to team i alle visninger.

## Neste
Fase 7 — ansattes rolle, team og lokasjon kan endres i Admin. Verifisering fra planen: endre team på en ansatt, og personen flytter seg i Ukeplan med en gang. Mekanisk arbeid etter kjent mønster (regler i `lib/domene.ts`, handling i `app/admin/handlinger.ts` med `utfor`, side under `app/admin/`, skjema som `components/RolleAdmin.tsx`, delte `Feil`/`Bruk` i `components/AdminFelles.tsx`). Oppsett har `teamId`, `rolleId` og `lokasjonId`; valgene kommer fra tabellene `team`, `roller` og `lokasjoner`. Ny tabell er ikke nødvendig, så `SKJEMA_VERSJON` (nå 4) står. Vurder planmodus hvis fasen viser seg større enn mønsteret.

## Arbeidsmåte neste økt
- `[les-skjermbildet-først]` Melder bruker at noe ikke vises: sammenlign skjermbildet med koden før omstart eller hurtigbuffer foreslås.

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; push uten force gikk 2026-09-30. Gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- Åpne Claude Code i `app/`: repoet, `kunnskap/`, `TODO.md` og CLAUDE.md ligger der. Rotmappa har en pekerfil `CLAUDE.md` (utenfor git) som sier det samme.
- **Alle data ligger i `data/vaktliste.json`** (én fil, ikke i git). Appen eier dataene; Excel var en engangsinnlasting (`npm run migrer` er kjørt). `npm run import` nekter å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi i `data/sikkerhetskopi/`, atomisk lagring). Admin sjekkes inne i hver handling, ikke bare på siden.
- `lib/domene.ts` deles med skriptene og har ingen imports. Node 26.8.2 importerer `.ts` direkte (gir en ufarlig modultype-advarsel; `node --no-warnings` skjuler den). I `node`-skript på Windows må absolutte stier i `import` skrives som `file:///C:/...`.
- Admin er egne sider under `/admin`, ikke en fane. Sider som leser fra disk trenger `export const dynamic = "force-dynamic"`.
- «Velg deg selv» er ikke sikkerhet; hvem som helst kan velge en administrator. Erstattes av Entra.
- Ukeplanen tar bare med endringer der statusen har `visesIPlan`, og fri-farge styres av `kategori` på typen (`lib/ukeplan.ts`). Navn på status og type betyr ingenting for beregningen.
- Team er data: filter og telling går på `teamId`, navnet (`Ansatt.team`) er bare til visning. Valget «Alle team» er `ALLE_TEAM = "*"` i `lib/ukeplan.ts`. Rekkefølgen i tabellen `team` er rekkefølgen i velgeren.
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit, ikke store heredocs med flere filer.
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database nå: JSON i `data/` (blokkerer SQLite). Reelle persondata i appen krever behandlingsgrunnlag, se `TODO.md` punkt 1. `TODO.md` punkt 2: fjern «Fast lokasjon»-kolonnen.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet. Fila har en ucommittet endring (`git push` tillatt) som er brukerens egen godkjenning.
