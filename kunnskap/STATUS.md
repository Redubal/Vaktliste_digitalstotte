# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–21, 22A, 22B og 23–31 ✅. 31 (kolonnene i Admin → Ansatte) avsluttet av Ståle 2026-10-13 uten at det er oppgitt hva som ble sett; Claude har ikke sett resultatet. **Ikke oppgitt fra 31:** bred skjerm (navn fritt, deaktivert rad, langt navn med «…»), smalt vindu uendret. 30 godkjent 2026-10-13. **Ikke oppgitt fra 30:** linjene for hver kjøring i Endringslogg («kjørte (vellykket/feilet)»), automatisk synk på tidspunkt. **Ikke oppgitt fra eldre faser** (detaljer i loggen): 29 skjulte kommentarer for ansatt; 28 nettbrettbredde 800–1200 px, Admin og endringsvinduet på 390 px, ekte telefon/pad; 26 radtellingen Excel «Dager» mot appen er ikke gjort; 25 ny dato i lista og Ukeplan; 24 grønn ring i Måned, «Mine endringer» smalt; 23 slett-knapp skjult for ansatt, «Avvis» i Måned; 22A/22B figuren ved rulling og smalt vindu; 21 «Navn» som snur Ukeplan, person med flere oppsett; 13 siste justering av Ansatte; 4 og 7 rolle/lokasjon enkeltvis.
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.4.0 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring (Fase 31; siste CSS-rettelse kjørt på nytt ved faseslutt). `next build` sist kjørt ved Fase 30. Fase 29: funn F1–F10 i `sikkerhet.md`, alle rettet eller besluttet.
- Synk-reglene prøvd i Node med oppdiktede rader (Fase 30: 37 av 37). Endringer og avvisning: Fase 23 (20 av 20) og sett i nettleseren (Fase 24–25).
- Ikke prøvd fra før: retting og sletting i vinduet fra Ukeplan, klikk i Måned, vedlikeholdsmodus mot en ansatt som lagrer, to faner samtidig, Fase 10–18 delvis, masseendring, ny lagring ved låst fil.

## Neste
Brukerens valg. Fase 32 (Entra-innlogging, krever app-registrering) og 33 (ekte Graph-synk) trenger tilganger utenfor appen. Ellers `TODO.md` punkt 4 (flere endringer samme dag), 5 («Registrer»-knapp), 6 (ukenummer) og 8 (lang liste med deaktiverte). Alle trenger planmodus og tyngste modell før de får fasenummer. Radtellingen fra Fase 26 er fortsatt ikke gjort.

## Arbeidsmåte neste økt
- `[css-gjenbruk]` (2. runde) Før en eksisterende klasse brukes et nytt sted: søk etter den i `globals.css`, også i `@media`-blokkene, og les alle reglene for klassen (ikke bare navnet).

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- **Alle data ligger i `data/vaktliste.json`** (ikke i git). Appen eier dataene; Excel var en engangsinnlasting. `npm run import` nekter å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi, atomisk lagring). **Alle handlinger går gjennom `utforSom` i `lib/utfor.ts`** (`valgtAnsatt()` gir den som er valgt): Admin (`app/admin/handlinger.ts`) og planen (`app/handlinger.ts`). Hva en ansatt får gjøre sjekkes i `lib/domene.ts`, ikke bare i siden.
- **Endringsloggen** (`lib/endringslogg.ts`, `data/endringslogg.jsonl`): nye tabeller eller felt må inn i `TABELLER` og `FELTNAVN`. `endretAv` er oppsettets id, eller `SYNK_AVSENDER` («synk», vist som «Synk av ansatte»). Handlingen «kjørt» er én linje per synk-kjøring.
- **Synk (Fase 30):** `lib/synk.ts` har `SynkKilde` (nå `testkilde`: `data/entra-test.json`, kopi av `scripts/entra-test.eksempel.json`, Graph-feltene `id/givenName/surname/userPrincipalName`), `kjørSynk(startetAv)` og `synkHvisForfalt`, kalt med `after()` i `app/layout.tsx`. Reglene er rene funksjoner i `lib/domene.ts` (`anvendSynk` m.fl.). Bare personer med `entraId` deaktiveres; ukoblede røres ikke; tom kilde stopper; siste admin holdes; ingen aktiveres igjen. Status i `data/synkstatus.json`; innstillinger i `Vaktliste.synk` (skjemaversjon 13, automatisk av som standard). Personer uten oppsett vises under «Nye, mangler team» (`components/NyeAnsatte.tsx`, `giTeam`). Fase 32 bytter `aktivKilde()` til Graph.
- **Vedlikeholdsmodus:** `Vaktliste.innstillinger`; rotlayouten skjuler sidene for ikke-administratorer.
- `lib/domene.ts` deles med skriptene og har ingen imports. Node 26.8.2 importerer `.ts` direkte; i `node`-skript på Windows må absolutte stier i `import` skrives som `file:///C:/...`.
- **Godkjenning:** `Status.virkning` er `godkjent|venter|avvist`; uten status = venter. Ansatt får «venter», admin «godkjent» (første alfabetisk). `EndringVindu.tsx` (`useEndringVindu`, `useRettVindu`), `Godkjenning.tsx`, `GodkjenningListe.tsx`. Godkjent vinner på samme dag (`lib/ukeplan.ts`). Etter endringer i `app/page.tsx` kan dev-serveren sende gamle data: start den på nytt.
- **Dager:** `/admin/dager`, `sjekkDag`; `fri` gir «Fri» i cella via `beregnCelle`. **«Mine endringer»:** `getMineEndringer(id)` er eneste sted `avvistGrunn` leses ut.
- **Endringstyper har `farge`** (`#rrggbb` eller `null`, `STANDARDFARGER`). Navn er ett felt; `delNavn` i `lib/sortering.ts` gir fornavn og etternavn (siste ord) — egne felt fra Entra står i `TODO.md` til Fase 32.
- Admin-sider som leser fra disk trenger `export const dynamic = "force-dynamic"`. Ansatte-skjemaene bruker oppsettets id. Deaktiverte er ikke med i `getAnsatte`; Admin → Ansatte leser `lesVaktliste()` direkte.
- Admin-skjemaer er ukontrollerte (`useSkjemaStatus` i `AdminFelles.tsx`, `defaultValue`; bytt nøkkel først ved ny revisjon). En `"use server"`-fil kan bare eksportere funksjoner.
- **Sortering:** `?sorter=`, `?rolle=`, `?fane=` med `replaceState`; `useSortering` + `sorterRader`; valgt person øverst (`forstFor`).
- **Mobil:** tabell (`.visning-tabell`) og kort (`.visning-kort`) bytter ved 768 px; smale tabellregler til 1024 px. Ny kolonne må inn begge steder. Admin → Ansatte på bred skjerm (Fase 31): overskrift og rader har hvert sitt rutenett med samme tall; `.bare-smal` er tekst bare for smal visning, `.bare-bred` bare for bred. `.admin-ansattinnhold` har fast rutenett på bred skjerm. Etter CSS-endringer: Ctrl+F5.
- **Figur:** `components/figur/`; laget har `pointer-events: none`, skjules ved `dialog[open]`; av/på i `localStorage` (`figur-av`).
- **Sikkerhet:** F1–F10 i `kunnskap/sikkerhet.md`. `app/page.tsx` tømmer `upn` og `comment` og filtrerer avviste endringer før data sendes ut. «Velg deg selv» er ikke sikkerhet; dev-serveren lytter på nettet (F10): tas opp før ekte persondata.
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit. CSS-klassenavn uten æøå. Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan. Reelle persondata krever behandlingsgrunnlag (`TODO.md` punkt 1). Nøkler i lister: `teamId-id`.
- Persondata-deny-settet er tilbudt i `.claude/settings.json`, ikke besluttet. Fila har en ucommittet endring som er brukerens egen godkjenning; den tas ikke med i faseslutt-commit.
