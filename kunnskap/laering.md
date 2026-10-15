# Læringslogg

## 2026-10-15 (avslutning Fase 47, verifisert) — siden hopper ikke sidelengs

- `[rester-etter-feil]` — ikke utløst: ingen feil skrev tilstand. Gjenstående faser (MySQL, Entra) kan utløse den; videreføres uten rundetall.
- `[verifisering-krever-data]` — ikke utløst: verifiseringen var å se på fanebytte, og Ståles miljø har data. Gjenstående faser (MySQL, Entra) kan utløse den; videreføres uten rundetall.
- Nye punkter: ingen. **Fasesnitt:** Fase 47 (undersøkelse, plan, én CSS-linje, verifisering) fikk plass i én økt uten `/compact`. Ingen deling foreslått.
- **Issue til pakkerepoet:** ikke aktuelt.

## 2026-10-15 (avslutning Fase 46, verifisert) — Docker for appen

- `[rester-etter-feil]` — ikke utløst: ingen feil skrev tilstand. Gjenstående faser (MySQL, Entra) kan utløse den; videreføres uten rundetall.
- `[verifisering-krever-data]` — skrevet tidligere i økten og ikke satt på prøve ennå; videreføres uten rundetall.
- Nye punkter: ingen. **Fasesnitt:** Fase 46 (skriving og verifisering hos Ståle) fikk plass i én økt uten `/compact`. Ingen deling foreslått.
- **Issue til pakkerepoet:** ikke aktuelt.

## 2026-10-15 (avslutning Fase 46, midt i fasen) — Docker for appen

**Evaluering av forrige økts punkter:**
- `[rester-etter-feil]` — ikke utløst: ingen feil skrev tilstand i denne økten. Gjenstående faser (MySQL, Entra) kan utløse den; videreføres uten rundetall.

**Nye punkter:**
- `[verifisering-krever-data]` Før en fase skrives der verifiseringen er «logg inn» eller «se dataene», sjekk først at miljøet der det skal skje har data, og si hva som må flyttes dit. Belegg: planens Fase 46-verifisering sier «logg inn», men en ny database har ingen brukere; det kom fram først etter at alle Docker-filene var skrevet, og krevde et spørsmål til Ståle.

**Brudd på regel i `CLAUDE.md`:** `cd` i Bash (femte gang), `cd /dev/null` i et grep-kall; kallet gjorde ingenting. Regelen står allerede; ikke ført som STATUS-punkt (én adresse).
**Fasesnitt:** skrivingen fikk plass i én økt uten `/compact`, men verifiseringen venter på hjemme-pc-en. Ingen deling foreslått; planens verifiseringslinje bør likevel nevne at databasefila kopieres inn (foreslått, ikke endret).
**Issue til pakkerepoet:** ikke aktuelt.

## 2026-10-15 (avslutning Fase 45) — Pålogging med e-post og passord

**Evaluering av forrige økts punkter:**
- `[farge-mot-palett]` — fulgt: innloggingssiden og kontoboksen bruker bare `--border`, `--heading`, `--muted` fra `globals.css`, ingen nye farger; ingen forhåndsvisning var lovet. Strykes som innarbeidet.

**Nye punkter:**
- `[rester-etter-feil]` Når en feil har skrevet tilstand (database, fil), skal rettingen også rydde det feilen alt skrev, og prøven skal starte fra den tilstanden. Belegg: første retting av pausetelleren hindret nye feiltellinger, men lot de gamle stå, så Ståle ble sperret på nytt etter pausen og trengte en ny runde.

**Brudd på regel i `CLAUDE.md`:** `cd` i Bash (fjerde gang), i en lese-kommando tidlig i økten; sagt fra straks. Regelen står allerede; ikke ført som STATUS-punkt (én adresse).
**Fasesnitt:** Fase 45 fikk plass i én økt uten `/compact`. Ingen deling foreslått.
**Issue til pakkerepoet:** ikke aktuelt (kredensial-hooken er organisasjonens, ikke pakkens).

## 2026-10-15 (avslutning Fase 44) — Endringslogg, synkstatus og import i databasen

**Evaluering av forrige økts punkter:**
- `[kommando-med-mappe]` — fulgt: flyttingen ble gitt som kopierbar blokk som startet med `cd app`, og skriptet kjørte uten feil første gang. Strykes som innarbeidet.
- `[farge-mot-palett]` — ikke utløst (ingen ny farge). Fase 45 (innloggingsside) kan utløse den; videreføres, rundetallet står (2. runde).

**Nye punkter:** ingen.

**Fasesnitt:** Fase 44 fikk plass i én økt uten `/compact`. Ingen deling foreslått.
**Issue til pakkerepoet:** ikke aktuelt.

## 2026-10-15 (avslutning Fase 43) — SQLite i stedet for JSON

**Evaluering av forrige økts punkter:**
- `[farge-mot-palett]` — ikke utløst (ingen ny farge). Fase 45 (innloggingsside) kan utløse den; videreføres, rundetallet står (2. runde).

**Nye punkter:**
- `[kommando-med-mappe]` Når brukeren skal kjøre en kommando selv, gi den som en kopierbar blokk som starter med mappebyttet (`cd app`), ikke «i terminalen i `app/`». Belegg: `npm run til-sqlite` ble kjørt i mappa over og feilet med ENOENT; terminalen åpner i overmappa.

**Fasesnitt:** planlegging og Fase 43 i én økt uten `/compact`. Ingen deling foreslått.
**Issue til pakkerepoet:** ikke aktuelt.

## 2026-10-15 (avslutning Fase 42) — Rammefarge og fyll

**Evaluering av forrige økts punkter:**
- `[farge-mot-palett]` — brutt igjen (2. runde): situasjonen oppsto (ny farge til en utheving). Standardene ble holdt (mørk ramme, ingen fyll), men startverdien i fyllvelgeren (`#ffe9a8`) ble valgt uten å sammenligne med `.prikk--*` («Annet» er gul `#f2c94c`), og forhåndsvisningen som skulle sette fargen mot endringsfargene ble ikke bygget.
- `[sosken-visning]` — ikke utløst, og planen har ingen gjenstående fase. Strøket; en ny visning i et senere planarbeid må huske Uke/Måned/Dag-sammenligningen (står i Fase 40 i loggen).

**Nye punkter:** ingen.

**Fasesnitt:** én økt uten `/compact`. Ingen deling foreslått.
**Issue til pakkerepoet:** ikke aktuelt.

## 2026-10-15 (avslutning Fase 41) — Ukenummer i Måned

**Evaluering av forrige økts punkter:**
- `[farge-mot-palett]` — ikke utløst: ukenummeret bruker `--muted`, ingen ny utheving. Videreføres, rundetallet står: TODO punkt 12 (rammefarge i Admin) kan utløse det.
- `[sosken-visning]` — ikke utløst: Fase 41 la til en rad i Måned, ikke en ny visning. Videreføres, rundetallet står: en senere visning kan utløse det.

**Nye punkter:** ingen.

**Fasesnitt:** én økt uten `/compact`. Ingen deling foreslått.
**Issue til pakkerepoet:** ikke aktuelt.

## 2026-10-14 (avslutning Fase 40) — Dag-visning

**Evaluering av forrige økts punkter:**
- `[farge-mot-palett]` — ikke utløst: Fase 40 innførte ingen ny farge (fargene kommer fra `Celle`). Videreføres, rundetallet står: TODO punkt 12 (rammefarge) og senere faser kan utløse det.

**Nye punkter:**
- `[sosken-visning]` En ny visning av samme data skal sammenlignes med søsken-visningene (Uke, Måned) for felles oppførsel — valgt person øverst, filtre, start på eget team — før den leveres, ikke etter at Ståle ser den. Belegg: Dag manglet «valgt person øverst» (`forstFor`), og Ståle måtte si det.

**Fasesnitt:** én økt uten `/compact`. Ingen deling foreslått.
**Issue til pakkerepoet:** ikke aktuelt.

## 2026-10-14 (avslutning Fase 39) — «Uke» og dagens dato

**Evaluering av forrige økts punkter:**
- `[forelder-layout]` — fulgt: ringen i mobilkalenderen kom etter at reglene til `.mkal` og `.prikk--venter`/`--godkjent` var lest, og ble lagt inni firkanten (innvendig skygge). Strykes som innarbeidet.

**Nye punkter:**
- `[farge-mot-palett]` Ny farge til en utheving skal sammenlignes med fargene som allerede står i `globals.css` (`--accent`, `.prikk--*`) før den velges, helst som ramme eller form i stedet for en ny flate. Belegg: første utheving brukte `--accent` som fyll i kolonnen, og Ståle sa at den var «veldig lik andre farger».

**Fasesnitt:** én økt uten `/compact`, inkludert planskriving. Ingen deling foreslått.
**Issue til pakkerepoet:** ikke aktuelt.

## 2026-10-14 (avslutning Fase 38) — «Registrer»-knapp

**Evaluering av forrige økts punkter:**
- `[forelder-layout]` — ikke utløst: knappen står i verktøylinja, ikke i en celle eller firkant. TODO punkt 6 (ukenummer i Måned) kan utløse det, så det videreføres uten å øke runden (2. runde).

**Nye punkter:** ingen.

**Fasesnitt:** én økt uten `/compact`, inkludert planmodus. Ingen deling foreslått.

## 2026-10-14 (avslutning, liten økt) — Mobilkalenderen i Måned

**Evaluering av forrige økts punkter:**
- `[forelder-layout]` — ikke utløst: økten la ikke noe merke, ring eller tall i en celle. TODO punkt 6 (ukenummer i Måned) kan utløse det, så det videreføres uten å øke runden (2. runde).

**Nye punkter:** ingen.

**Fasesnitt:** én økt uten `/compact`; en liten rettelse utenfor plan (TODO punkt 9), ikke en egen fase. Ingen deling foreslått.

## 2026-10-14 (avslutning Fase 37) — Varsel ved overlapp

**Evaluering av forrige økts punkter:**
- `[nåtid-om-planlagt]` — fulgt: i åpningen skrev jeg «varselet finnes ikke ennå, det kommer i Fase 37». Strykes som innarbeidet.
- `[forelder-layout]` — brutt igjen (2. runde): jeg la utropstegn og varsel i celler og firkanter uten å lese `.mkal`-reglene (rutenett, ring med `outline-offset`) først; med −6 px på kanten krasjet de i naboen og ringen, og Ståle måtte be om to rettinger.

**Nye punkter:** ingen.

**Fasesnitt:** 37 fikk plass i én økt uten `/compact`. Ingen deling foreslått.

## 2026-10-14 (avslutning Fase 36) — Flere endringer i Måned

**Evaluering av forrige økts punkter:**
- `[nåtid-om-planlagt]` — ikke utløst: jeg beskrev ikke noe ubygget i nåtid. Videreføres, for Fase 37 (varsel) er ikke bygget.
- `[forelder-layout]` — ikke utløst: firkanten har samme størrelse, tallet er `position: absolute` utenfor flyten, og ingen celle ble høyere. Videreføres, for Fase 37 legger merker i celler.

**Nye punkter:** ingen. Rettelsene Ståle ba om (status på andres endringer) var ønsker, ikke brudd.

**Fasesnitt:** 36 fikk plass i én økt uten `/compact`. Ingen deling foreslått.

## 2026-10-13 (avslutning Fase 35) — Klokkeslett og flere endringer samme dag

**Evaluering av forrige økts punkter:**
- `[css-gjenbruk]` — fulgt: før cella fikk flere linjer leste jeg alle reglene for `.celle`, `.celle-aapne`, `.admin-avkryssing` og `.kort-dag`, også i `@media`, og `.celle.celle--flere` er skrevet for å slå `.celle { padding }` i media-blokken. Strykes.

**Brutt, men har allerede en regel (ingen nye STATUS-punkt):** `cd` i Bash (CLAUDE.md, «Bruk aldri `cd` i Bash») ble brukt én gang under kontrollen; `node_modules/next/dist/docs/` ble ikke lest før koden (`AGENTS.md`).

**Nye punkter:**
- `[nåtid-om-planlagt]` Jeg skrev «slik legger brukeren inn mer enn ett valg» og «klikk på dagen» i nåtid om noe som ikke var bygget, og Ståle svarte to ganger at han ikke fant det («får ikke opp muligheten», «har ikke klokkeslett», «tror ikke jeg har siste versjon»).
- `[forelder-layout]` Da cella ble høy (fire linjer), endret jeg ikke regelen til beholderen `.kort-dag` (`align-items: center`), og dagnavnet havnet midt på cella. Ståle så det på skjermbildet.

**Fasesnitt:** 35 fikk plass i én økt uten `/compact` (planlegging og bygging i samme økt). Ingen deling foreslått.

## 2026-10-13 (avslutning Fase 31) — Kolonnene i Admin → Ansatte

**Evaluering av forrige økts punkter:**
- `[css-gjenbruk]` — brutt igjen (2. runde): overskriftscellene fikk den eksisterende `.admin-bruk` uten at jeg leste reglene for klassen; den har `min-width: 130px` og ville sprengt de 50–90 px brede kolonnene. Fanget ved gjennomlesing før commit, ikke av brukeren.

**Nye punkter:** ingen.

**Fasesnitt:** 31 fikk plass i én økt uten `/compact`. Ingen deling foreslått.

## 2026-10-13 (avslutning Fase 30) — Synk av ansatte

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere.

**Nye punkter:**
- `[css-gjenbruk]` Før en eksisterende layoutklasse brukes i en ny komponent: søk etter klassen i `globals.css`, også i `@media`-blokkene. Belegg: «Nye, mangler team» fikk `.admin-ansattinnhold`, som har et fast rutenett med åtte kolonner på bred skjerm, og tekst lå oppå hverandre i brukerens første skjermbilde.

**Fasesnitt:** 30 fikk plass i én økt uten `/compact`, men vokste underveis: Graph-feltnavn og logging av hver kjøring kom fra brukeren under verifiseringen. Ingen deling foreslått.

## 2026-10-13 (avslutning Fase 29) — Sikkerhetsgjennomgang

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere.

**Nye punkter:** ingen. Beslutningene (innlogging, nettverk, xlsx, oppslagslogg) ble lagt fram som valg og ført med begrunnelse; bruker valgte, Claude utførte bare det som ble valgt. Fase-slutt-vakten fyrte riktig: «ser i orden ut» ble møtt med forslag og venting.

**Fasesnitt:** 29 fikk plass i én økt uten `/compact`; ingen deling foreslått.

## 2026-10-13 (avslutning Fase 28) — Mobil/pad-testen

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere.

**Nye punkter:** ingen. Claude gjettet ikke på CSS uten skjermbilde, men ba om test per punkt; to funn kom fra brukeren og ble rettet. Fase-slutt-vakten fyrte riktig: «ferdig med denne» ble møtt med forslag og venting, ikke med avslutning.

**Fasesnitt:** 28 fikk plass i én økt uten `/compact`; ingen deling foreslått.

## 2026-10-13 (avslutning Fase 27) — Fridager

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere.

**Nye punkter:** ingen. Scope-vakten fyrte riktig da Ståle pekte på flere endringer samme dag (allerede `TODO.md` punkt 4): ingen argumentasjon, ingen valgmeny. Fase-slutt-vakten fyrte riktig: «fungerer» ble møtt med forslag og venting.

**Fasesnitt:** 27 fikk plass i én økt uten `/compact`; ingen deling foreslått.

## 2026-10-13 (avslutning Fase 26) — Admin → Dager

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere.

**Nye punkter:** ingen. Scope-vakten fyrte riktig på ukenummer-ønsket (ført i `TODO.md`, ingen argumentasjon, ingen valgmeny). Tellingen fra planen ble forberedt som kommando for brukeren, men svaret kom ikke; ført som «ikke gjort» i loggen.

**Fasesnitt:** 26 fikk plass i én økt uten `/compact`; ingen deling foreslått.

## 2026-10-13 (avslutning Fase 25) — «Rett» fra godkjenningslista

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere.

**Nye punkter:** ingen. Scope-vakten fyrte riktig på «Registrer»-ønsket (foreslo `TODO.md`, argumenterte ikke, spurte ikke hvordan det skulle løses); et «start» uten innhold ble møtt med et oppklarende spørsmål i stedet for å gjette.

**Fasesnitt:** 25 fikk plass i én økt uten `/compact`; ingen deling foreslått.

## 2026-10-13 (avslutning Fase 24) — «Mine endringer» med status

**Evaluering av forrige økts punkter:** `[sjekk-stilen-som-gjelder]` **fulgt:** stilreglene for `logg-tabell`, `visning-kort` (`display: block` på smal skjerm) og `.table-wrapper` ble lest før egne regler; lista fikk `table-layout: auto` og egen boks rundt kortene. Strøket. `[utseende-spør-først]` **fulgt:** merket ble avklart med tre forslag med enkle skisser før noe ble bygd; strøket.

**Nye punkter:** ingen.

**Fasesnitt:** 24 fikk plass i én økt uten `/compact`; ingen deling foreslått.

## 2026-10-13 (avslutning Fase 23) — Avvis-knapp og bare administrator sletter

**Evaluering av forrige økts punkter:** `[skjemasteg-er-låst-etter-test]` **fulgt:** feltet kom i et nytt steg (`tilVersjon11`), versjon 10 er urørt; strøket. `[klikkflate-hele-ruta]` **fulgt:** «Avvis» har ramme og bakgrunn og er knapp over hele ruta, 44 px på berøring; strøket. `[utseende-spør-først]` ikke utløst (ingen ba om et bestemt utseende; vinduet ble levert som utkast med beskjed om det); Fase 24 lager en ny liste og kan utløse det, videreføres uten ny runde.

**Nytt punkt:** `[sjekk-stilen-som-gjelder]` — legges en knapp eller et vindu inn i en liste eller tabell som alt finnes, les stilreglene som gjelder der (`table-layout`, `margin`, `white-space`) og tenk på en smal kolonne, før du skriver egne. Belegg: «Avvis»-knappene brøt ordene midt i to runder (først `flex-wrap`, så `logg-tabell` med fast kolonnebredde), og vinduet havnet i hjørnet fordi Tailwind nullstiller marger. Ståle: «ikke imponert over de knappene», «ute av kurs med knapper igjen».

**Fasesnitt:** 23 fikk plass i én økt uten `/compact`; ingen deling foreslått.

## 2026-10-13 (avslutning Fase 22B) — Levende figur, atferd

**Evaluering av forrige økts punkter:** `[skjemasteg-er-låst-etter-test]` ikke utløst (ingen skjemaendring); Fase 23 og 27 lager nye steg, videreføres uten ny runde. `[klikkflate-hele-ruta]` ikke utløst (ingen nye knapper); Fase 23 og 25 legger til knapper, videreføres uten ny runde. `[utseende-spør-først]` **brutt igjen (2. runde):** jeg lovet å spørre om referanse eller vise ett utkast, men bygde all atferd på gjetning etter «start».

**Nye punkter:** ingen.

**Fasesnitt:** 22B fikk plass i én økt uten `/compact`; ingen deling foreslått.

## 2026-10-13 (avslutning Fase 22A) — Levende figur

**Evaluering av forrige økts punkter:** `[skjemasteg-er-låst-etter-test]` ikke utløst (ingen skjemaendring); Fase 23 og 27 lager nye steg, videreføres uten ny runde. `[klikkflate-hele-ruta]` ikke utløst (bare «Figur»-bryteren er ny, en vanlig knapp); Fase 23 og 25 legger til knapper, videreføres uten ny runde. `[start-verdi-følger-ikke-valg]` ikke utløst (figuren har ingen verdi fra props); **tas ut av STATUS fordi taket er tre punkter**, teksten står her: en visning som starter fra et valg (`useState` med verdi fra props) følger ikke med når valget byttes med `router.refresh()`; gi komponenten `key` fra valget (Fase 24–25 kan utløse den).

**Nytt punkt:** `[utseende-spør-først]` — ønsker brukeren noe som skal se ut eller oppføre seg på en bestemt måte (figur, animasjon, ikon) og det finnes ingen referanse: be om en referanse, eller vis ett enkelt utkast, før et helt system bygges på gjetning. Belegg: figuren ble bygd og forkastet to ganger («styggeste figuren jeg har sett», «helt lite levende») før brukeren viste til eSheep.

**Fasesnitt:** 22A fikk plass i én økt uten `/compact`. Den opprinnelige Fase 22 var for stor og ble delt i 22A/22B (planen oppdatert i økten); ingen ytterligere deling foreslått.

## 2026-10-13 (avslutning Fase 21) — Meg øverst og navn stigende

**Evaluering av forrige økts punkter:** `[skjemasteg-er-låst-etter-test]` ikke utløst (ingen skjemaendring); Fase 23 (`avvistGrunn`) og Fase 27 (`fri`) lager nye steg, så den videreføres uten ny runde. `[klikkflate-hele-ruta]` ikke utløst (ingen nye trykkflater); Fase 23 og 25 legger til knapper, så den videreføres uten ny runde. `[vis-felt-heller-enn-å-skjule]` ikke utløst; **tas ut av STATUS fordi taket er tre punkter**, teksten står her: felt som bare vises for visse verdier i data jeg ikke kan lese, vises alltid, som valgfritt (Fase 26–27 kan utløse den).

**Nytt punkt:** `[start-verdi-følger-ikke-valg]` — en visning som starter fra et valg (`useState` med verdi fra props) følger ikke med når valget byttes med `router.refresh()`; gi komponenten `key` fra valget. Belegg: «meg øverst» virket for Max, men ikke etter bytte til Ståle, for teamvalget sto igjen fra Max; bruker fant det, ikke jeg.

**Fasesnitt:** Fase 21 fikk plass i én økt uten `/compact`. Planen er utvidet med Fase 22–29 (se logg); ingen ytterligere deling foreslått.

## 2026-10-13 (avslutning Fase 20) — Mobil/pad-test og logo

**Evaluering av forrige økts punkter:** `[skjemasteg-er-låst-etter-test]` ikke utløst (ingen skjemaendring); Fase 21 og senere kan trenge nye felt, så den videreføres uten ny runde. `[vis-felt-heller-enn-å-skjule]` ikke utløst (ingen nye felt med data Claude ikke kan lese); videreføres uten ny runde. `[klikkflate-hele-ruta]` klikkflaten var allerede hele ruta, så den ble fulgt; bruddet var et annet (se nytt punkt), og punktet utvides i stedet for å få ny runde.

**Utvidet punkt:** `[klikkflate-hele-ruta]` sier nå også at noe som kan trykkes skal se trykkbart ut uten mus. Belegg: i Fase 19 fikk bare hover-rammen vist at en dag kunne trykkes; i telefonvisning så vanlige dager ut som ren tekst, og bruker skrev «mangler feltet å trykke i».

**Fasesnitt:** Fase 20 fikk plass i én økt uten `/compact`. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 19) — Status direkte i uke-/månedsvisning

**Evaluering av forrige økts punkter:** `[knapp-har-forutsetning]` fulgt (Lagre er grå til typen er valgt, og feilmeldingen skjules når noe i vinduet endres); strykes som innarbeidet. `[skjemasteg-er-låst-etter-test]` ikke utløst (ingen endring av skjemaversjon i fasen); Fase 21–24 kan trenge nye felt, så den videreføres uten ny runde.

**Nye punkter:**
- `[vis-felt-heller-enn-å-skjule]` Et felt som bare vises for visse verdier i data Claude ikke kan lese (personvern), vises alltid, som valgfritt. Belegg: lokasjonsfeltet vistes bare for kategori «Lokasjon», og bruker fant ikke feltet da typen «Flyttet» (kategori «Annet») ble valgt.
- `[klikkflate-hele-ruta]` Noe som skal trykkes i en rute eller celle gjøres klikkbart over hele ruta, ikke bare på teksten. Belegg: bruker så bare en tekstlenke i cella og ba om hele feltet.

**Fasesnitt:** Fase 19 fikk plass i én økt uten `/compact`, selv med tre rettelsesrunder etter bruker. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 18) — Godkjenningsliste i Admin

**Evaluering av forrige økts punkter:** `[knapp-har-forutsetning]` ikke utløst («Godkjenn» krever ikke et valg i skjema); Fase 19 (status valgt direkte i planen) kan utløse den, så den videreføres uten ny runde. `[skjemasteg-er-låst-etter-test]` ikke utløst (versjon 10 var en ny endring, ikke en retting av et steg som var lagret); videreføres, siden senere faser kan trenge rettinger.

**Nye punkter:** ingen. Ingenting gikk galt i økten.

**Fasesnitt:** Fase 18 fikk plass i én økt uten `/compact`. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 17) — Små rettinger

**Evaluering av forrige økts punkter:** `[knapp-har-forutsetning]` ikke utløst (ingen knapp som krever et valg ble bygget); Fase 18 (godkjenn-knapper) kan utløse den, så den videreføres uten ny runde.

**Nye punkter:**
- `[skjemasteg-er-låst-etter-test]` Når brukeren har testet og lagret i appen, kan datafila alt stå på den nye skjemaversjonen. Rett data i et senere forsøk med et nytt versjonssteg, ikke ved å endre det som alt er sluppet. Belegg: de gamle fargene ble lagt i versjon 7-steget etter at fila var lagret som versjon 7, og ble hoppet over; det ble versjon 8 og 9 for ett felt.

**Fasesnitt:** Fase 17 fikk plass i én økt uten `/compact`. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 16) — «Lagre alle» og rollefilter

**Evaluering av forrige økts punkter:** ingen aktive punkter.

**Nye punkter:**
- `[knapp-har-forutsetning]` En knapp som krever et valg (avkrysning, utfylt felt) grås ut til forutsetningen er oppfylt, og en gammel feilmelding skjules når valget endres. Belegg: bruker fant at «Kryss av minst én ansatt først.» ble stående etter «Deaktiver valgte».

**Fasesnitt:** Fase 16 fikk plass i én økt uten `/compact`. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 15) — Bedre format på mobil

**Evaluering av forrige økts punkter:** `[sjekk-mål-før-layout]` fulgt (leste `.page-shell`- og `.panel`-polstring og eksisterende bruddpunkter før kortene ble bygget): strykes. `[ingen-cd-i-bash]` fulgt (`git -C` og full sti, ingen `cd`): strykes.

**Nye punkter:** ingen.

**Fasesnitt:** Fase 15 fikk plass i én økt uten `/compact`. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 14) — Vedlikeholdsmodus

**Evaluering av forrige økts punkter:** `[sjekk-mål-før-layout]` ikke utløst (bare et gult bånd i CSS, ingen kolonnebredder). Fase 15 (mobil) kan utløse det: videreføres, runde står.

**Nye punkter:**
- `[ingen-cd-i-bash]` Brukte `cd <sti> && npx tsc` i ett Bash-kall, mot CLAUDE.md-regelen; mappebyttet ble stående. Bruk `npx tsc --noEmit` uten `cd` (arbeidsmappen er alt `app/`) eller full sti. Belegg: miljøet meldte at arbeidsmappen byttet.

**Fasesnitt:** Fase 14 fikk plass i én økt uten `/compact`. Utvidelsen (logging) kom som del av fasen etter brukerens ønske, ikke som egen fase. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 13) — Sortering i kolonner

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere. `git -C` med full sti ble brukt; ingen `cd`.

**Nye punkter:**
- `[sjekk-mål-før-layout]` Smale kolonner i Admin → Ansatte ble satt med anslåtte breddetall, og raden stakk ut av rammen (brukerens skjermbilde). Gjør bredde-/layoutendringer ved å lese rammens faktiske bredde i CSS først (`max-width` på `.page-shell`, polstring i `.panel`), ikke gjette. Belegg: to runder med skjermbilder.

**Fasesnitt:** Fase 13 fikk plass i én økt uten `/compact`, men layout i Admin → Ansatte ble en egen runde. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 12) — Hopp mellom ansatt på forsiden og i Admin

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere. `git -C` med full sti ble brukt i hele økten; ingen `cd`.

**Nye punkter:** ingen.

**Fasesnitt:** Fase 12 fikk plass i én økt uten `/compact`. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 11) — Masseendring av ansatte

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere. Regelen om `cd` i Bash (nå i `app/CLAUDE.md`) ble brutt én gang: `cd .. && ls` i første kodeutforskning, så full sti. Ingen nytt punkt i STATUS, fordi regelen alt står i CLAUDE.md (én adresse).

**Nye punkter:** ingen.

**Fasesnitt:** Fase 11 fikk plass i én økt uten `/compact`. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 10) — Ansatte: kom inn, deaktivering og adminstatus

**Evaluering av forrige økts punkter:** ingen aktive punkter å evaluere. `git -C` med full sti ble brukt i hele økten (regelen i `app/CLAUDE.md` holdt).

**Nye punkter:** ingen.

**Fasesnitt:** Fase 10 fikk plass i én økt uten `/compact`. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 9) — Full endringslogg

**Evaluering av forrige økts punkter:**
- `[bash-cd-persisterer]` brutt igjen (3. runde): `cd app && git status --porcelain` ble kjørt i første git-sjekk ved faseoppstart, selv om punktet var kvittert. Bruker godkjente forslaget om å gjøre det til regel: skrevet inn i `app/CLAUDE.md` (Windows og PowerShell) og tatt ut av STATUS.

**Nye punkter:** ingen.

**Fasesnitt:** Fase 9 fikk plass i én økt uten `/compact`, selv med periodefilter og nedtrekksliste lagt til underveis. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 8) — Lagret/ikke lagret i Admin

**Evaluering av forrige økts punkter:**
- `[bash-cd-persisterer]` brutt igjen (2. runde): ved faseoppstart ble `cd app` kjørt to ganger i separate kall og havnet i `app/app`, i samme melding som STATUS (og punktet) ble lest. Oppdaget og rettet med `git -C` og full sti; resten av økten brukte full sti. Videreføres.

**Nye punkter:** ingen.

**Fasesnitt:** Fase 8 fikk plass i én økt uten `/compact`. Resten av planen står uendret.

## 2026-10-13 (avslutning Fase 7) — Ansatte i Admin

**Evaluering av forrige økts punkter:**
- `[les-skjermbildet-først]` ikke utløst: bruker meldte ikke at noe manglet på skjermen. Planen har ingen flere faser, så punktet strykes (se logg 2026-10-13, Fase 7).

**Nye punkter:**
- `[bash-cd-persisterer]` Mappebyttet fra `cd` i ett Bash-kall blir stående. Belegg: ved faseoppstart ga en andre `cd app` tomt `git log`-svar fra `app/app`. Bruk full sti i hvert kall, og tolk ikke tomt svar som «ingenting» før mappen er sjekket.

**Fasesnitt:** Fase 7 fikk plass i én økt uten `/compact`. Planen har ingen flere faser.

## 2026-10-13 (avslutning Fase 6) — Team som data

**Evaluering av forrige økts punkter:**
- `[les-skjermbildet-først]` ikke utløst: bruker meldte ikke at noe manglet på skjermen. Fase 7 kan utløse den. Videreført, rundetallet står.

**Nye punkter:** ingen.

**Fasesnitt:** Fase 6 fikk plass i én økt uten `/compact`, selv om den var den tyngste. Fase 7 kan stå som den er.

## 2026-10-13 (avslutning Fase 5) — Endringstyper og statuser i Admin

**Evaluering av forrige økts punkter:**
- `[les-skjermbildet-først]` ikke utløst: bruker meldte ikke at noe manglet på skjermen, bare at omdøping av «Godkjent» ikke var prøvd. Fase 6–7 kan utløse den. Videreført, rundetallet står.

**Nye punkter:** ingen.

**Fasesnitt:** Fase 5 fikk plass i én økt uten `/compact`.

## 2026-10-13 (avslutning Fase 4) — Roller i Admin

**Evaluering av forrige økts punkter:**
- `[status-i-undermappe]` brutt igjen (3. runde): `fase-start` ble kjørt fra rotmappa, STATUS ble ikke funnet, og jeg spurte om `nytt-prosjekt` uten å lete i `app/`. Promotert: pekerfil `CLAUDE.md` i rotmappa (utenfor git-repoet) sier at prosjektet ligger i `app/` og at `nytt-prosjekt` ikke skal foreslås. Strøket fra STATUS.
- `[ny-ui-temaklasser]` fulgt: lenken og knappene for Roller bruker `uke-btn` fra første utkast. Strøket som innarbeidet.
- `[les-skjermbildet-først]` ikke utløst (ingen skjermbilder i fasen), og Fase 5–7 kan utløse den. Videreført, rundetallet står.

**Nye punkter:** ingen.

**Fasesnitt:** Fase 4 fikk plass i én økt uten `/compact`.

## 2026-10-13 (avslutning Fase 3) — Lokasjoner i Admin

**Evaluering av forrige økts punkter:**
- `[historikk-omskriving-push-først]` ikke utløst, og ingen gjenstående fase skriver historikk om (git avklart 2026-09-30) — strøket, se logg.
- `[rammen-først]` fulgt: spurte om Excel fortsatt var fasit før datamodellen for lokasjoner; svaret styrte feltene og lagringen — strøket som innarbeidet.
- `[status-i-undermappe]` brutt igjen: STATUS ble ikke funnet i rotkatalogen, og jeg spurte om `nytt-prosjekt` uten å lete i `app/kunnskap/`; brukeren måtte si hvor fila lå — videreført (2. runde). Regelen står i STATUS og CLAUDE.md, som begge ligger i `app/` og derfor ikke var lest da fila manglet; den kan bare virke fra `fase-start` selv.

**Nye punkter:**
- `[ny-ui-temaklasser]` Nye lenker og knapper bruker temaets klasser (`uke-btn`) fra første utkast. Belegg: Lokasjoner-lenken var en rå `<a>` uten farge og så ut som vanlig tekst; brukeren fant den ikke.
- `[les-skjermbildet-først]` Sier brukeren at noe ikke vises, sammenlign skjermbildet med koden før du foreslår hurtigbuffer eller omstart. Belegg: skjermbildet viste den nye siden med usynlig lenke, men jeg la fram to teorier om gammel kode (to runder) før jeg sjekket.

**Fasesnitt:** Fase 3 fikk plass i én økt uten `/compact`.

Issue til pakkerepoet: tilbudt på nytt for `status-i-undermappe` (samme tekst som sist). `gh` er fortsatt ikke installert (kontrollert 2026-10-13), så teksten må opprettes for hånd.

## 2026-09-30 (avslutning Fase 1 og 2) — Admin verifisert

**Evaluering av forrige økts punkter:**
- `[historikk-omskriving-push-først]` ikke utløst (ingen historikk skrevet om) — videreføres, git-valget ligger fortsatt åpent
- `[rammen-først]` ikke utløst (ingen datamodell planlagt) — videreføres, Fase 3 kan utløse det

**Nye punkter:**
- `[status-i-undermappe]` Finner `fase-start` ikke `kunnskap/STATUS.md`, let i undermapper (`*/kunnskap/STATUS.md`) og si hvor den ligger, før `nytt-prosjekt` foreslås. Belegg: økten ble åpnet i rotkatalogen, `fase-start` foreslo oppsett, brukeren kalte `nytt-prosjekt`, og prosjektet lå ferdig i `app/`. Oppsettet ble stoppet før noe ble skrevet.

**Fasesnitt:** Fase 1 og 2 fikk plass i én økt uten `/compact`. «Admin fungerer ikke» var en `brukere.json` som ikke var lagret i editoren; ingen kodeendring.

Issue til pakkerepoet: godkjent av bruker, men ikke opprettet (`gh` er ikke installert på maskinen). Tekst: «fase-start bør lete i undermapper (`*/kunnskap/STATUS.md`) før den foreslår nytt oppsett».

## 2026-09-30 (kveldsøkt) — Admin planlagt, Fase 2 skrevet

**Evaluering av forrige økts punkter:**
- `[dev-server-først]` fulgt (porten ble sjekket med `netstat` før noe ble startet) — strykes som innarbeidet
- `[persondata-i-plan]` fulgt (planen sier at `data/` og sikkerhetskopiene står utenfor git, og Claude leste aldri `data/`) — strykes som innarbeidet
- `[lange-edits-via-fil]` fulgt (all kode skrevet med Write/Edit) — strykes som innarbeidet

**Nye punkter:**
- `[historikk-omskriving-push-først]` Før historikk skrives om, avklar at den nye kan sendes ut. Belegg: `filter-branch` kjørte, men force-pushen ble blokkert, så lokal og GitHub spriker 6/6 og vanlig push avvises.
- `[rammen-først]` Når brukeren nevner Excel som kilde, spør om Excel fortsatt er fasit før datamodellen planlegges. Belegg: hele første planutkast og designoppdraget bygde på at Excel var fasit; bruker måtte rette det to ganger.

**Fasesnitt:** økten fikk plass uten `/compact`, men rommet planlegging, historikkrydding og ikke-verifisert kode. Fase 2 er liten nok. Planen er snittet i seks små faser, se `plan.md`.

Issue til pakkerepoet: ikke aktuelt.

## 2026-09-30 (senere økt) — Fase 1, data og layout

**Evaluering av forrige økts punkter:**
- `[celle-på-td]` fulgt (månedsvisningen la stilen på `span`/`div` inni `td`/`th`) — strykes som innarbeidet
- `[dev-server-først]` ikke utløst (ingen dev-server startet) — videreføres, Fase 2 kan utløse det
- `[persondata-i-plan]` ikke utløst (ingen nytt register, bare omstrukturering av eksisterende, `data/` fortsatt ignorert) — videreføres, Fase 3 kan utløse det

**Nye punkter:**
- `[lange-edits-via-fil]` Lange kodeendringer gjøres med Write/Edit, ikke som `node -e` med sitert kode i Bash. Belegg: en slik kommando med enkeltanførselstegn i innholdet ga «unexpected EOF» og ingenting ble kjørt; det kostet en ekstra runde.

**Fasesnitt:** økten fikk plass uten `/compact`. Snittet holder.

Issue til pakkerepoet: ikke aktuelt.

## 2026-09-30 — Fase 1, delvis verifisering

**Evaluering av forrige økts punkter:**
- `[dev-server-først]` ikke utløst (bruker kjørte serveren selv) — videreføres, Fase 2 kan utløse det
- `[persondata-i-plan]` ikke utløst (ingen ny import planlagt) — videreføres, Fase 3 kan utløse det

**Nye punkter:**
- `[celle-på-td]` Aldri `display: flex/block` på `td`/`tr`/`th`; legg stilen på en `div` inni. Belegg: `.celle` på `<td>` stablet hele uka i én kolonne; tsc, lint og build så ingenting, bare brukeren så det i nettleseren.

**Fasesnitt:** Fase 1 fikk plass i én økt, rettelsen kom i en kort oppfølging. Snittet holder.

Issue til pakkerepoet: ikke aktuelt.

## 2026-09-30 — etter Fase 1

Ingen tidligere punkter å evaluere (første faseslutt).

**Fasesnitt:** Fase 1 fikk plass i én økt uten `/compact`. Snittet holder.

**Nye punkter:**
- `[dev-server-først]` Sjekk om en dev-server alt kjører (`localhost:3000`, `.next/dev/lock`) før `npm run dev`. Belegg: start på port 3210 feilet med «Another next dev server is already running».
- `[persondata-i-plan]` Når en plan importerer fra Excel/registre, skal planen ta stilling til `.gitignore` for uttrekket. Belegg: Fase 1-planen nevnte JSON-filer med navn/e-post/sykefravær uten ignore-regel; fanget først i fase-slutt.

Issue til pakkerepoet: ikke aktuelt.
