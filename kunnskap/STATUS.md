# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1 (ukeplan per team og Måned) og Fase 2 («Hvem er du») er ✅ verifisert av bruker 2026-09-30. Forbehold: mobilvisningen trenger et bedre format (utsatt, `TODO.md`).
«Admin fungerer ikke» var en `data/brukere.json` som ikke var lagret; ingen kodeendring. Administratorer: Espen, Ståle og Jens.
Admin er planlagt i plan.md («Admin-fasene», datamodell i arkitektur.md). Neste fase er Fase 3.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit` og `npm run lint` rene (kjørt ved faseslutt).
- `/admin` gir 200 med kapsel `vaktliste-identitet=stale` og 307 uten identitet (curl mot dev-serveren). Bruker bekreftet Fase 2-verifiseringen i nettleseren.
- Ukeplan for Øst vises riktig (bruker, uke 39). Normaliserte data: 0 avvik mot gamle filer.

## Neste
Fase 3 — Lokasjoner kan redigeres i Admin. Skrivelaget bygges her (`lib/domene.ts`, `lib/lager.ts`, `app/admin/handlinger.ts`). Verifiseringen står i plan.md.

## Arbeidsmåte neste økt
- `[historikk-omskriving-push-først]` Før historikk skrives om: avklar at den kan sendes ut.
- `[rammen-først]` Spør om Excel fortsatt er fasit før datamodell planlegges.
- `[status-i-undermappe]` Finner `fase-start` ikke STATUS: let i undermapper før `nytt-prosjekt` foreslås.

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken (`filter-branch`). Bruker slettet GitHub-repoet og la det inn på nytt tomt, så `git push -u origin master` gikk gjennom uten force (2026-09-30). Gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- Åpne Claude Code i `app/`: repoet, `kunnskap/` og CLAUDE.md ligger der.
- **Ikke kjør `npm run import` nå:** den skriver over `data/brukere.json` og fjerner `erAdministrator`. Excel-fila `Vaktliste_2026-2027_Team_Ost_og_Vest.xlsx` ligger i `app/` (ikke i git).
- Admin er egne sider under `/admin`, ikke en fane. Nye sider som leser fra disk trenger `export const dynamic = "force-dynamic"`.
- «Velg deg selv» er ikke sikkerhet; hvem som helst kan velge en administrator. Erstattes av Entra.
- Node 26.8.2 importerer `.ts` direkte (målt), så validering kan deles med innlastingsskriptet. Ingen imports i delte filer.
- Bare endringer med status «Godkjent» vises i ukeplanen (hardkodet i `lib/ukeplan.ts:58`, omlegges i Fase 5).
- Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan; `data/` og xlsx er ikke i git.
- Ingen database nå: JSON i `data/` (blokkerer SQLite). Reelle persondata i appen krever behandlingsgrunnlag, se `TODO.md` punkt 1. `TODO.md` punkt 2: fjern «Fast lokasjon»-kolonnen.
- Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt i `.claude/settings.json`, ikke besluttet.
