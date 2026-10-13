# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–21, 22A og 22B ✅ (22B bekreftet av Ståle 2026-10-13 med «vi er ferdig med 22B», uten at enkeltpunkter er oppgitt). Ikke prøvd fra 22A/22B: figuren følger flaten ved rulling, er borte når «Legg inn endring» er åpen, klikk virker der den står, «Figur: av» + omlasting, smalt vindu, ytelse; klatring på blokker kan være sjelden (se loggen). Ikke prøvd fra Fase 21: «Navn» som snur lista i Ukeplan, person med flere oppsett, nettbrettbredde (769–1024 px), Admin-sidene og endringsvinduet på smal skjerm, ekte telefon eller pad. Fase 13: resultatet etter siste justering av Admin → Ansatte er ikke sett. Fase 4: nytt rollenavn i Ansatte ikke testet; Fase 7: rolle og lokasjon på en ansatt ikke bekreftet enkeltvis.
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.3.7 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring (Fase 22B). `next build` ikke kjørt i Fase 10–22B (en kjørende `next dev` kan komme i konflikt); sist kjørt ved faseslutt i Fase 8.
- Reglene for å legge inn, rette og slette en endring er prøvd i Node med oppdiktede rader (28 av 28) og sett virke i nettleseren: ansatt legger inn, administrator godkjenner (Ukeplan og Admin).
- Ikke prøvd fra før: retting og sletting i vinduet, klikk i Måned (prikk og mobilkalender), vedlikeholdsmodus mot en ansatt som lagrer, to faner samtidig, alt i Fase 18, 17, 16, 15, 14, 13, 12 og 10, endringslogg, masseendring, sletting av status/type i bruk, ny lagring ved låst fil, team med flere enn to team.

## Neste
**Fase 23** i `plan.md`: «Avvis» og bare administrator sletter (tyngste modell, endrer skjemaet til versjon 11). Deretter 24 «Mine endringer» (tyngste), 25 rette fra godkjenningslista, 26 Admin → Dager, 27 fridager, 28 mobil/pad-rest, 29 sikkerhetsgjennomgang (tyngste). Entra og database er parkert som Fase 30–33. Rekkefølgen er brukerens valg. Planmodus først hvis noe nytt skal inn i planen.

## Arbeidsmåte neste økt
- `[skjemasteg-er-låst-etter-test]` Er datafila lagret etter at et versjonssteg ble skrevet, rett data med et nytt steg, ikke ved å endre det gamle. (Fase 23 lager versjon 11.)
- `[klikkflate-hele-ruta]` Noe som skal trykkes gjøres klikkbart over hele ruta, og ser trykkbart ut også uten mus (ramme eller bakgrunn, ikke bare hover). (Fase 23 legger til «Avvis».)
- `[utseende-spør-først]` (2. runde) Ønsker brukeren noe som skal se ut eller oppføre seg på en bestemt måte og det finnes ingen referanse: be om en, eller vis ett enkelt utkast, FØR et helt system bygges på gjetning. Brutt i 22B: lovet det, bygde alt etter «start».

## Det en ny økt må vite
- **Git er i orden:** jobbadressen er byttet ut i historikken; push uten force gikk 2026-09-30. Gammel historikk ligger lokalt som `refs/original/`. Repoet er satt til `mrredubal@gmail.com` lokalt.
- Åpne Claude Code i `app/`: repoet, `kunnskap/`, `TODO.md` og CLAUDE.md ligger der. Rotmappa har en pekerfil `CLAUDE.md` (utenfor git) som sier det samme.
- **Alle data ligger i `data/vaktliste.json`** (én fil, ikke i git). Appen eier dataene; Excel var en engangsinnlasting (`npm run migrer` er kjørt). `npm run import` nekter å overskrive uten `--overskriv`, og en slik import fjerner Admin-endringer og `erAdministrator`. Excel-fila ligger i `app/` (ikke i git).
- Skriving går alltid gjennom `endreVaktliste` i `lib/lager.ts` (revisjon, sikkerhetskopi i `data/sikkerhetskopi/`, atomisk lagring). **Alle handlinger går gjennom `utforSom` i `lib/utfor.ts`**: Admin (`app/admin/handlinger.ts`, krav «administrator») og planen (`app/handlinger.ts`, krav «ansatt»). Hva en ansatt får gjøre (egne endringer, bare de som venter) sjekkes i `lib/domene.ts` (`kanEndreEndring`), ikke bare i siden.
- **Endringsloggen** (`lib/endringslogg.ts`) skrives fra `endreVaktliste` til `data/endringslogg.jsonl` (ikke i git). Nye tabeller eller felt må inn i `TABELLER` og `FELTNAVN` der, ellers vises rå feltnavn. `endretAv` er oppsettets id; synk (Fase 30, parkert) trenger egen avsender (`TODO.md`).
- **Vedlikeholdsmodus:** `Vaktliste.innstillinger`. Rotlayouten `app/layout.tsx` skjuler alle sider for ikke-administratorer; «Velg deg selv» står igjen der. Handlingene i planen nekter også ansatte da.
- `lib/domene.ts` deles med skriptene og har ingen imports (skjemaversjon 10). Node 26.8.2 importerer `.ts` direkte; i `node`-skript på Windows må absolutte stier i `import` skrives som `file:///C:/...`.
- **Godkjenning og innlegging:** `Status.virkning` er `godkjent|venter|avvist`; en endring uten status venter. Klikk på en dag åpner `components/EndringVindu.tsx` (`<dialog>`, hook `useEndringVindu`); ansatt legger inn bare for seg selv og får «venter», administrator for alle og får «godkjent». `page.tsx` sender `revisjon` og `valg` til alle som har valgt seg selv, «Godkjenn» (`components/Godkjenning.tsx`) bare til administratorer. Er to endringer på samme dag, vinner den godkjente (`lib/ukeplan.ts`). Etter kodeendringer i `app/page.tsx` kan dev-serveren sende gamle data: start den på nytt (Ctrl+C, `npm run dev`).
- **Endringstyper har `farge`** (`#rrggbb` eller `null` = standardfarge for kategorien, `STANDARDFARGER` i `lib/domene.ts`). Navn er ett felt; `delNavn` i `lib/sortering.ts` gir fornavn og etternavn (siste ord).
- Admin er egne sider under `/admin`. Sider som leser fra disk trenger `export const dynamic = "force-dynamic"`. Ansatte-skjemaene bruker oppsettets id, ikke brukerens: en person kan ha flere oppsett.
- **Deaktiverte ansatte (`Bruker.aktiv = false`) er ikke med i `getAnsatte`**. Admin → Ansatte leser `lesVaktliste()` direkte for å vise dem; ny kode som trenger alle personer må gjøre det samme. `entraId` er tom til Fase 30.
- Admin-skjemaer er ukontrollerte og bruker `useSkjemaStatus` i `components/AdminFelles.tsx`. Feltene er `defaultValue`: endres en rad utenfra, bytt nøkkel først når siden har fått ny revisjon (`ventende` i `AnsattAdmin.tsx`). En `"use server"`-fil kan bare eksportere funksjoner; konstanter ligger i `lib/domene.ts`.
- **Sortering og rollefilter:** `?sorter=kolonne` / `-kolonne`, `?rolle=` og `?fane=` skrives med `replaceState`; nye tabeller bruker `useSortering(kolonner, standard?)` + `sorterRader`. Ukeplan og Måned: navn stigende som standard (`STANDARD_PERSON_SORTERING`), valgt person øverst (`forstFor`, `lib/sortering.ts`), og `key={jegId}` på visningene i `app/page.tsx` så de starter på nytt ved bytte i «Du er».
- **Mobil:** Ukeplan og Måned har både tabell (`.visning-tabell`) og kortliste (`.visning-kort`); CSS bytter ved 768 px, og de smale tabellreglene gjelder opp til 1024 px (nettbrett). Ny kolonne eller felt må inn begge steder. Berøringsregler (felt 16 px, knapper 44 px) ligger i `@media (pointer: coarse)` i `globals.css`. Logoen er `public/vestfold-logo.svg`, satt inn i `app/layout.tsx` (manualen: uendret fil, minst 75 px høy). Etter CSS-endringer kan nettleseren vise gammel versjon (Ctrl+F5).
- **Figur (22A + 22B):** `components/figur/{Figur,Tegning,motor,flater,pynt}`; `Tegning.tsx` er leddene (også munn og verktøy), `motor.ts` vrir dem, har fysikken og atferden (søvn, musa, klatring, pønk), `pynt.ts` eier det figuren etterlater (z, spraymerker, jord, løse bokstaver), `flater.ts` leser plassering av synlige blokker (`UTVALG`), aldri tekst. Laget har `pointer-events: none`, skjules ved `dialog[open]`; av/på i `localStorage` (`figur-av`) via bryteren i `app/layout.tsx`.
- «Velg deg selv» er ikke sikkerhet; erstattes av Entra (Fase 31, parkert). Team er data (`ALLE_TEAM = "*"`).
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit. CSS-klassenavn uten æøå. Data har navn, e-post og sykefravær: aldri lim ekte rader inn i logg, STATUS eller plan.
- Ingen database nå: JSON i `data/`. Reelle persondata i appen krever behandlingsgrunnlag, `TODO.md` punkt 1. En bruker med flere oppsett gir flere rader med samme id, så nøkler i lister bruker `teamId-id`.
- Persondata-deny-settet er tilbudt i `.claude/settings.json`, ikke besluttet. Fila har en ucommittet endring (`git push` tillatt) som er brukerens egen godkjenning; den tas ikke med i faseslutt-commit.
