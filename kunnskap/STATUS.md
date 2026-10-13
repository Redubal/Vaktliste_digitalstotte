# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1, 2 og 3 ✅. Fase 3 (lokasjoner kan legges til, endres og slettes i Admin) er godkjent av bruker 2026-10-13. Neste er Fase 4 (Roller). Forbehold: mobilvisningen trenger et bedre format (utsatt, `TODO.md`).
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit` og `npm run lint` rene ved faseslutt; `next build` kompilerer.
- Bruker godkjente Fase 3 i nettleseren. Ikke testet: to faner samtidig, ny lagring ved låst fil, opprydding av sikkerhetskopier.

## Neste
Fase 4 — Roller: ny tabell `roller`, `rolleId` på oppsett. Verifiseringen står i plan.md. Gjenbruk mønsteret fra lokasjoner: regler i `lib/domene.ts`, handlinger i `app/admin/handlinger.ts`, side under `app/admin/`, skjema i `components/LokasjonAdmin.tsx`. Ny tabell i `vaktliste.json` krever at skjemaversjonen økes og at fila migreres (`lesVaktliste` nekter ukjent versjon): avgjør hvordan ved planleggingen.

## Arbeidsmåte neste økt
- `[status-i-undermappe]` (2. runde) Finner `fase-start` ikke STATUS: let i undermapper før `nytt-prosjekt` foreslås.
- `[ny-ui-temaklasser]` Nye lenker og knapper bruker `uke-btn` og temaets øvrige klasser fra første utkast.
- `[les-skjermbildet-først]` Melder bruker at noe ikke vises: sammenlign skjermbildet med koden før omstart eller hurtigbuffer foreslås.

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; push uten force gikk 2026-09-30. Gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- Åpne Claude Code i `app/`: repoet, `kunnskap/` og CLAUDE.md ligger der.
- **Alle data ligger i `data/vaktliste.json`** (én fil, ikke i git). Appen eier dataene; Excel var en engangsinnlasting (`npm run migrer` er kjørt). `npm run import` nekter nå å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi i `data/sikkerhetskopi/`, atomisk lagring). Admin sjekkes inne i hver handling, ikke bare på siden.
- `lib/domene.ts` deles med skriptene og har ingen imports. Node 26.8.2 importerer `.ts` direkte (gir en ufarlig modultype-advarsel).
- Admin er egne sider under `/admin`, ikke en fane. Sider som leser fra disk trenger `export const dynamic = "force-dynamic"`.
- «Velg deg selv» er ikke sikkerhet; hvem som helst kan velge en administrator. Erstattes av Entra.
- Bare endringer med status «Godkjent» vises i ukeplanen (hardkodet i `lib/ukeplan.ts:58`, omlegges i Fase 5).
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database nå: JSON i `data/` (blokkerer SQLite). Reelle persondata i appen krever behandlingsgrunnlag, se `TODO.md` punkt 1. `TODO.md` punkt 2: fjern «Fast lokasjon»-kolonnen.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet.
