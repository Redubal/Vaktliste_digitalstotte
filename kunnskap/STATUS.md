# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–21, 22A, 22B, 23–31 og 35 ✅. 35 (klokkeslett og flere endringer samme dag i Ukeplan) sett av Ståle 2026-10-13 på bred og smal skjerm. **Ikke oppgitt fra 35:** «Rett» fra dagens liste, vanlig ansatt (ikke administrator) som legger inn endring nummer to, «Godkjenn»/«Avvis» på en linje i en celle med flere, å rette en endring som har klokkeslett. **Ikke oppgitt fra 31:** bred skjerm (navn fritt, deaktivert rad, langt navn med «…»), smalt vindu uendret. **Ikke oppgitt fra 30:** linjene for hver kjøring i Endringslogg, automatisk synk på tidspunkt. **Ikke oppgitt fra eldre faser** (detaljer i loggen): 29 skjulte kommentarer for ansatt; 28 nettbrettbredde 800–1200 px, Admin og endringsvinduet på 390 px, ekte telefon/pad; 26 radtellingen Excel «Dager» mot appen er ikke gjort; 25 ny dato i lista og Ukeplan; 24 grønn ring i Måned, «Mine endringer» smalt; 23 slett-knapp skjult for ansatt, «Avvis» i Måned; 22A/22B figuren ved rulling og smalt vindu; 21 «Navn» som snur Ukeplan, person med flere oppsett; 13 siste justering av Ansatte; 4 og 7 rolle/lokasjon enkeltvis.
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.4.0 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring (Fase 35). `next build` sist kjørt ved Fase 30. Fase 29: funn F1–F10 i `sikkerhet.md`, alle rettet eller besluttet.
- Klokkeslettreglene prøvd i Node med oppdiktede rader (Fase 35: 14 av 14). Synk-reglene: Fase 30 (37 av 37). Endringer og avvisning: Fase 23 (20 av 20) og sett i nettleseren (Fase 24–25).
- Ikke prøvd fra før: retting og sletting i vinduet fra Ukeplan, klikk i Måned, vedlikeholdsmodus mot en ansatt som lagrer, to faner samme dag, Fase 10–18 delvis, masseendring, ny lagring ved låst fil.

## Neste
**Fase 36** (flere endringer i Måned: delt firkant) og **37** (varsel ved overlapp), planlagt og godkjent 2026-10-13 (`plan.md`, «TODO punkt 4»). Mekanisk, går på Sonnet. Fase 32 (Entra-innlogging, krever app-registrering) og 33 (ekte Graph-synk) trenger tilganger utenfor appen. Ellers `TODO.md` punkt 5 («Registrer»-knapp), 6 (ukenummer), 8 (lang liste med deaktiverte) og 9 (mandager i Måned på mobil, bare lest i koden). Radtellingen fra Fase 26 er fortsatt ikke gjort.

## Arbeidsmåte neste økt
- `[nåtid-om-planlagt]` Noe som ikke er bygget beskrives aldri i nåtid: skriv «dette finnes ikke ennå, det kommer i Fase N» først, så hvordan det blir.
- `[forelder-layout]` Endres høyden eller innholdet i en celle eller boks: les regelen til beholderen den ligger i (rutenett, `align-items`) før du sier at det er ferdig.

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- **Alle data ligger i `data/vaktliste.json`** (ikke i git). Appen eier dataene; Excel var en engangsinnlasting. `npm run import` nekter å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi, atomisk lagring). **Alle handlinger går gjennom `utforSom` i `lib/utfor.ts`** (`valgtAnsatt()` gir den som er valgt): Admin (`app/admin/handlinger.ts`) og planen (`app/handlinger.ts`). Hva en ansatt får gjøre sjekkes i `lib/domene.ts`, ikke bare i siden.
- **Endringsloggen** (`lib/endringslogg.ts`, `data/endringslogg.jsonl`): nye tabeller eller felt må inn i `TABELLER` og `FELTNAVN`. `endretAv` er oppsettets id, eller `SYNK_AVSENDER` («synk», vist som «Synk av ansatte»). Handlingen «kjørt» er én linje per synk-kjøring.
- **Synk (Fase 30):** `lib/synk.ts` har `SynkKilde` (nå `testkilde`: `data/entra-test.json`, kopi av `scripts/entra-test.eksempel.json`), `kjørSynk(startetAv)` og `synkHvisForfalt`, kalt med `after()` i `app/layout.tsx`. Reglene er rene funksjoner i `lib/domene.ts` (`anvendSynk` m.fl.). Bare personer med `entraId` deaktiveres; ukoblede røres ikke; tom kilde stopper; siste admin holdes; ingen aktiveres igjen. Status i `data/synkstatus.json`; innstillinger i `Vaktliste.synk` (skjemaversjon 13). Personer uten oppsett vises under «Nye, mangler team» (`components/NyeAnsatte.tsx`, `giTeam`). Fase 32 bytter `aktivKilde()` til Graph.
- **Vedlikeholdsmodus:** `Vaktliste.innstillinger`; rotlayouten skjuler sidene for ikke-administratorer.
- `lib/domene.ts` deles med skriptene og har ingen imports. Node 26.8.2 importerer `.ts` direkte; i `node`-skript på Windows må absolutte stier i `import` skrives som `file:///C:/...`.
- **Godkjenning:** `Status.virkning` er `godkjent|venter|avvist`; uten status = venter. Ansatt får «venter», admin «godkjent». `EndringVindu.tsx` (`useEndringVindu`, `useRettVindu`), `Godkjenning.tsx`, `GodkjenningListe.tsx`. Etter endringer i `app/page.tsx` kan dev-serveren sende gamle data: start den på nytt.
- **Flere endringer samme dag (Fase 35):** `UkeplanCelle.endringer` er alle (hele dagen først, så klokkeslett), `.endring` er den første og er det Måned bruker til Fase 36. `Celle` i `UkeplanClient.tsx` tegner én linje per endring når det er flere (`.celle--flere`, `.celle-linje`). Vinduet har tre visninger (`Valgt`: lista, en endring, ny); `startValg` velger. Klokkeslett: begge eller ingen, `TT:MM`, gjelder hver dag i perioden; avkrysningen «Bestemt klokkeslett» gir 08:00–16:00, 15 min steg.
- **Dager:** `/admin/dager`, `sjekkDag`; `fri` gir «Fri» i cella via `beregnCelle`. **«Mine endringer»:** `getMineEndringer(id)` er eneste sted `avvistGrunn` leses ut.
- **Endringstyper har `farge`** (`#rrggbb` eller `null`, `STANDARDFARGER`). Navn er ett felt; `delNavn` i `lib/sortering.ts` gir fornavn og etternavn (siste ord) — egne felt fra Entra står i `TODO.md` til Fase 32.
- Admin-sider som leser fra disk trenger `export const dynamic = "force-dynamic"`. Ansatte-skjemaene bruker oppsettets id. Deaktiverte er ikke med i `getAnsatte`; Admin → Ansatte leser `lesVaktliste()` direkte.
- Admin-skjemaer er ukontrollerte (`useSkjemaStatus` i `AdminFelles.tsx`, `defaultValue`; bytt nøkkel først ved ny revisjon). En `"use server"`-fil kan bare eksportere funksjoner.
- **Sortering:** `?sorter=`, `?rolle=`, `?fane=` med `replaceState`; `useSortering` + `sorterRader`; valgt person øverst (`forstFor`).
- **Mobil:** tabell (`.visning-tabell`) og kort (`.visning-kort`) bytter ved 768 px; smale tabellregler til 1024 px. Ny kolonne må inn begge steder. Admin → Ansatte på bred skjerm (Fase 31): overskrift og rader har hvert sitt rutenett med samme tall; `.bare-smal`/`.bare-bred`. Etter CSS-endringer: Ctrl+F5.
- **Figur:** `components/figur/`; laget har `pointer-events: none`, skjules ved `dialog[open]`; av/på i `localStorage` (`figur-av`).
- **Sikkerhet:** F1–F10 i `kunnskap/sikkerhet.md`. `app/page.tsx` tømmer `upn` og `comment` og filtrerer avviste endringer før data sendes ut. «Velg deg selv» er ikke sikkerhet; dev-serveren lytter på nettet (F10): tas opp før ekte persondata.
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit. CSS-klassenavn uten æøå. Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan. Reelle persondata krever behandlingsgrunnlag (`TODO.md` punkt 1). Nøkler i lister: `teamId-id`.
- Persondata-deny-settet er tilbudt i `.claude/settings.json`, ikke besluttet. Fila har en ucommittet endring som er brukerens egen godkjenning; den tas ikke med i faseslutt-commit.
