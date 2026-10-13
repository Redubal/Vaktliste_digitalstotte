# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1, 2, 3 og 4 ✅. Fase 4 (roller kan legges til, endres og slettes i Admin) er godkjent av bruker 2026-10-13, med ett forbehold: at nytt rollenavn vises hos en ansatt i Ansatte er ikke testet. Neste er Fase 5 (Endringstyper og statuser). Forbehold: mobilvisningen trenger et bedre format (utsatt, `TODO.md`).
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit`, `npm run lint` og `next build` rene ved faseslutt.
- Bruker godkjente Fase 4 i nettleseren (Roller-siden). Omgjøringen v1 → v2 er testet med oppdiktede rader i Node, ikke mot ekte data. Ikke testet: nytt rollenavn i Ansatte, to faner samtidig, ny lagring ved låst fil, opprydding av sikkerhetskopier.

## Neste
Fase 5 — Endringstyper og statuser. Rører ukeplanberegningen (`lib/ukeplan.ts:58` og `:129`). Verifiseringen står i plan.md. Gjenbruk mønsteret fra roller: regler i `lib/domene.ts`, handlinger i `app/admin/handlinger.ts` (`utfor` tar stien som parameter), side under `app/admin/`, skjema i `components/RolleAdmin.tsx` og delte `Feil`/`Bruk` i `components/AdminFelles.tsx`. Ny tabell: øk `SKJEMA_VERSJON` og legg til et steg i `oppgraderVaktliste` (se `arkitektur.md`); omgjøring skjer automatisk ved lesing.

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
- Bare endringer med status «Godkjent» vises i ukeplanen (hardkodet i `lib/ukeplan.ts:58`, omlegges i Fase 5).
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database nå: JSON i `data/` (blokkerer SQLite). Reelle persondata i appen krever behandlingsgrunnlag, se `TODO.md` punkt 1. `TODO.md` punkt 2: fjern «Fast lokasjon»-kolonnen.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet.
