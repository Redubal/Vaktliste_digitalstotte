# Læringslogg

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
