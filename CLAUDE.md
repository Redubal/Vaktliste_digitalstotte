@AGENTS.md

## Fase-arbeidsflyt

Prosjektet kjøres i faser med verifiseringsport: plan i `kunnskap/plan.md` →
én fase per økt → brukeren verifiserer → `/faseflyt:fase-slutt` → `/clear`.
Ny økt: les `kunnskap/STATUS.md` først — ikke utforsk kodebasen for ting den
svarer på. Utforskning delegeres til Explore-subagent.

**Fasesnittet:** én fase er noe brukeren kan se virke, i én økt. Verifiseringen
i planen skrives som noe brukeren gjør og ser («åpne siden, se at listen viser
tre rader»), ikke som en kommando Claude kjører («kjør testene»), og ikke som en
oppgave uten den som gjør den («layouten sjekkes på smal skjerm» — skriv «du ser
at siden holder i et smalt vindu»). Trengte fasen `/compact`, eller gikk den over
flere økter, var den for stor — si det ved faseslutt og foreslå et nytt snitt
for de gjenstående fasene.

**Claude installerer aldri verktøy for å se resultatet selv** — nettlesere,
skjermbildeverktøy, `playwright`, `puppeteer`, `chromium`. Verifiseringen er
brukerens: si hva som skal åpnes og hva brukeren skal se. `.claude/settings.json`
sperrer de vanligste kommandoene, men mønstre kan omgås — regelen gjelder uansett.

**`/compact` brukes bare midt i en fase som ikke rekker å bli ferdig.** Ellers
er veien alltid `/faseflyt:fase-slutt` → `/clear`: en frisk økt med skarp
STATUS slår en lang tråd.

**Modellvalg:** planlegging, arkitektur og sikkerhetskritiske valg gjøres med
den tyngste modellen. Fasene i planen er mekanisk arbeid og går på Sonnet:
`/model sonnet` før fase 0, og tilbake til tyngste modell før planen endres.
Claude sier fra når en fase ikke er mekanisk, i stedet for å bytte i stillhet.

**Rytmevakter (stående regler for Claude).** Alle tre er varslingsregler: vakten
sier fra og venter. Ingen av dem er en fullmakt til å utføre det den foreslår.

1. **Plan-vakt:** vesentlig nytt arbeid uten godkjent plan i `kunnskap/plan.md`
   → foreslå planmodus (be om byttet via EnterPlanMode) og vent på svar. Ikke
   begynn å kode i mellomtiden.
2. **Fase-slutt-vakt:** når brukeren bekrefter at verifiseringen er OK → si
   straks fra at porten er nådd og **foreslå** `/faseflyt:fase-slutt` + `/clear`.
   Deretter **vent på klarsignal.**

   **Porten, med en test du kan sjekke:** faseslutt skjer bare når brukeren har
   bedt om det i en egen melding — `/faseflyt:fase-slutt`, «avslutt fasen» eller
   tilsvarende. Finner du ikke en slik melding, er dette et vakt-utløst forslag,
   og da gjør du **ingenting** av rutinen: verken å kalle skillen eller å utføre
   stegene selv (logg, STATUS, commit). Begge veier ender i samme sted —
   commit-steget committer og pusher uten eget klarsignal, så en
   verifiseringsbekreftelse ville alene utløst en push, og verifiseringsporten
   som er hele poenget med flyten er omgått. «Verifisert, alt OK» betyr ikke
   «avslutt fasen».

   Dette har gått galt to ganger i test, begge under en svakere formulering —
   regn det som en kjent felle, ikke en teoretisk. Blir konteksten lang midt i en
   fase: si fra FØR kvaliteten faller.
3. **Scope-vakt:** ber brukeren om noe utenfor gjeldende fase → foreslå
   `TODO.md`, fullfør fasen i stedet for å ese. **Ikke argumenter for
   tillegget, og ikke spør hvordan det skal løses** — begge deler er esing med
   ekstra steg, og en valgmeny med «gjør det nå» blant valgene er å utføre.
   Målt 2026-08-25: vakten fyrte riktig, men gjorde begge deler.

## Snakk norsk

Alt brukeren ser skrives på vanlig norsk; et fagord brukes bare hvis det
forklares i samme setning. Ordene flyten består av forklares første gang de
dukker opp i økten: **fase** — en bit arbeid som er liten nok til at du kan
se at den virker. **fase 0** — oppsett, og en sjekk på at det så vidt virker.
**verifisere** — at DU ser at det virker, ikke at Claude sier det.
**faseslutt** — du har godkjent fasen; Claude oppsummerer og lagrer.
**planmodus** — Claude bare planlegger og endrer ingenting; du godkjenner
først. **`/clear`** — tømmer samtalen; alt viktig er lagret i filer.

Vis til ting med navn, aldri med bokstav eller nummer fra en tidligere melding
(«A og B», «punkt 3») — brukeren skal ikke måtte bla opp for å se hva svaret
gjelder. Dette gjelder også den korte teksten som følger hvert verktøykall:
brukeren leser den mens du jobber.

**Hver sjekk forklares før den kjøres.** Skal du kjøre en kommando, et skript
eller et søk for å sjekke noe — at prosjektet virker, at ingen passord ligger i
filene, at forrige økt ble avsluttet — si først i én setning hva den gjør,
hvorfor, og hva et godt utfall ser ut som. Gjelder uansett om Claude Code spør
om lov først eller ikke: uten dialog er setningen det eneste brukeren ser. Det
samme gjelder commit og push: si at du lagrer et sjekkpunkt og sender det til
GitHub før du gjør det.

## Kunnskapsfangst

Alt vi lærer (observert oppførsel, overraskelser, beslutninger) dokumenteres i
`kunnskap/` SAMME økt som det oppdages: `logg.md` (datert), `arkitektur.md`,
`sikkerhet.md`. Brukerbeslutninger loggføres som
`**Beslutning (<beslutningstaker>, <tema>):**` MED begrunnelse — personen som
bestemte, ikke bare temaet. Funn føres som observert kun når et kall faktisk ble
forsøkt og utfallet sett; ellers som hypotese med hva som ville avgjort den.

## Skills

Felles skills til bruk i Vestfold (faseflyt m.fl.) deklareres i
`.claude/settings.json` og hentes fra fellesrepoet — de kopieres ALDRI inn i
dette repoet. Kun prosjektets egen domenekunnskap bor i `.claude/skills/`.

## Personvern: Claude henter aldri produksjonsdata selv

Claude kjører ikke kommandoer som henter data fra Excel-fila med vaktlisten
(`npm run import` og uttrekket i `data/`), og leser ikke `.env` eller `data/`.
Arbeidsflyt: Claude forbereder kommandoen, brukeren kjører den manuelt og limer
inn resultatet (uten persondata).

**Denne regelen er hovedvernet, ikke et supplement.** Deny-reglene i
`.claude/settings.json` støtter den, men de er verktøy-scopet og dekker mindre
enn navnene antyder — på Windows ikke PowerShell-verktøyet, og de hindrer ikke
at en dekket fil slettes (se «Deny-settets grenser» i maler.md). Regel og
deny-sett hører sammen som par, og ingen av dem er en sandkasse.

## Windows og PowerShell

- **Encoding på Windows PowerShell 5.1 — to halvdeler som hører sammen:** BOM er
  uønsket i filer scriptet PRODUSERER, og påkrevd i `.ps1`-KILDEKODE som
  inneholder æøå.
  - *Output:* alle `Get-Content`/`Set-Content`/`Add-Content` skal ha eksplisitt
    `-Encoding utf8`. Uten den leses/skrives ANSI og æøå mojibakes stille
    (`æ` → `Ã¦`). `Out-File` og `>`/`>>` skriver ofte UTF-8 MED BOM, som knekker
    shebang-linjer og JSON-parsere — sjekk output-filer for BOM når andre verktøy
    skal lese dem.
  - *Kildekode:* 5.1 tolker en `.ps1` UTEN BOM som ANSI, så strenglitteraler med
    æøå mojibakes i utskriften selv om fila er korrekt UTF-8 på disk.
    Write-verktøyet lagrer uten BOM, så HVERT nytt script med norske tegn må
    lagres på nytt med `Set-Content -Encoding utf8` (skriver BOM i 5.1).
    Symptomet som identifiserer feilen: et kommandolinje-argument kommer ut
    riktig i samme kjøring der litteraler i fila er korrupte ⇒ det er
    fildekodingen, ikke konsollet.
- **Flerlinjede commit-meldinger:** skriv meldingen til fil og bruk
  `git commit -F <fil>` — here-strings avvises i enkelte oppsett av Claude Code.
- **PowerShell 5.1 mangler `&&`/`||` (bruk `A; if ($?) { B }`), ternary/`??`/`?.`,
  og Unix-kommandoene `head`/`tail`/`touch`/`which`/`wc`.**
