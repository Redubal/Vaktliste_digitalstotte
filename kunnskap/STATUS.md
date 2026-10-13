# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–5 ✅. Fase 5 (endringstyper og statuser kan redigeres i Admin) er godkjent av bruker 2026-10-13, med forbehold: at omdøping av «Godkjent» lar planen stå uendret er ikke sett. Neste er Fase 6 (Team). Forbehold fra Fase 4: nytt rollenavn i Ansatte er ikke testet. Mobilvisningen trenger et bedre format (utsatt, `TODO.md`).
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit`, `npm run lint` og `next build` rene ved faseslutt.
- Omgjøringen v2 → v3 er testet med oppdiktede rader i Node, ikke mot ekte data. Ikke testet i nettleser: omdøping av «Godkjent», «Vises i plan» av/på, ny type med kategori fravær, sletting av status/type i bruk, to faner samtidig, ny lagring ved låst fil, opprydding av sikkerhetskopier.

## Neste
Fase 6 — Team. Tyngst i planen: `Team` går fra union (`TEAM` i `lib/domene.ts`) til data, og «Begge» blir filter. Berører `vaktlista.ts`, `ukeplan.ts`, begge klientfilene og team-kortene i `VaktlisteClient.tsx`. Felle: objektnøkkel `acc[person.team]` ved `:28` må bli `team.id`. Verifiseringen står i plan.md. Fasen er ikke mekanisk: foreslå tyngste modell, og vurder planmodus før koding. Gjenbruk mønsteret fra roller/statuser: regler i `lib/domene.ts`, handlinger i `app/admin/handlinger.ts` (`utfor` tar stien), side under `app/admin/`, skjema som `components/EndringstypeAdmin.tsx`, delte `Feil`/`Bruk` i `components/AdminFelles.tsx`. Ny tabell: øk `SKJEMA_VERSJON` (nå 3) og legg til `tilVersjon4` i `oppgraderVaktliste` (se `arkitektur.md`); omgjøring skjer automatisk ved lesing.

## Arbeidsmåte neste økt
- `[les-skjermbildet-først]` Melder bruker at noe ikke vises: sammenlign skjermbildet med koden før omstart eller hurtigbuffer foreslås.

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; push uten force gikk 2026-09-30. Gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- Åpne Claude Code i `app/`: repoet, `kunnskap/`, `TODO.md` og CLAUDE.md ligger der. Rotmappa har en pekerfil `CLAUDE.md` (utenfor git) som sier det samme.
- **Alle data ligger i `data/vaktliste.json`** (én fil, ikke i git). Appen eier dataene; Excel var en engangsinnlasting (`npm run migrer` er kjørt). `npm run import` nekter å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi i `data/sikkerhetskopi/`, atomisk lagring). Admin sjekkes inne i hver handling, ikke bare på siden.
- `lib/domene.ts` deles med skriptene og har ingen imports. Node 26.8.2 importerer `.ts` direkte (gir en ufarlig modultype-advarsel). I `node`-skript på Windows må absolutte stier i `import` skrives som `file:///C:/...`.
- Admin er egne sider under `/admin`, ikke en fane. Sider som leser fra disk trenger `export const dynamic = "force-dynamic"`.
- «Velg deg selv» er ikke sikkerhet; hvem som helst kan velge en administrator. Erstattes av Entra.
- Ukeplanen tar bare med endringer der statusen har `visesIPlan`, og fri-farge styres av `kategori` på typen (`lib/ukeplan.ts:58` og `:129`). Navn på status og type betyr ingenting for beregningen.
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit, ikke store heredocs med flere filer.
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database nå: JSON i `data/` (blokkerer SQLite). Reelle persondata i appen krever behandlingsgrunnlag, se `TODO.md` punkt 1. `TODO.md` punkt 2: fjern «Fast lokasjon»-kolonnen.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet.
