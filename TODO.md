# TODO — Vaktliste digitale tjenester

Parkeringsplass for «må huskes, men ikke nå» — fra dag 1, og for gjenstående
punkter etter at planens faser er levert. Vedlikeholdes manuelt.

En avklart post **fortettes til én pekerlinje** — hvor innholdet bor nå (dato i
`logg.md`, versjon i `CHANGELOG.md`, commit, issue) — framfor å slettes.
Begrunnelsen for hvorfor noe ble som det ble er ofte det mest verdifulle i fila,
og en tom plass forteller ingenting.

## 1. Behandlingsgrunnlag for persondata før appen tas i bruk

Løsningen skal ende med reelle persondata (navn, e-post, sykefravær) i selve
appen, ikke bare leses av brukeren underveis. Da er den ikke en prototype lenger:
behandlingsgrunnlag, personvernvurdering og hvem som får se sykefravær må
avklares utenfor faseflyten, før data fra Excel-fila legges ut noe sted der andre
enn utvikler kan nå det.

## 2. «Fast lokasjon» skal ikke være egen kolonne i ukeplanen

Levert i Fase 12 for Ukeplan, se logg 2026-10-13. **Beslutning (SR, 2026-09-30):**
kolonnen gjentok det dagcellene allerede viser og tok plass på smal skjerm.
Måned hadde ingen slik kolonne. Står igjen i Ansatte-fanen (`VaktlisteClient`).

## 3. Mobilvisning trenger et bedre format

Løst i Fase 15 (2026-10-13, kort per person under 768 px), se logg.md. Full test på pad og mobil står igjen.
**Beslutning (bruker, 2026-09-30):** vi må finne et bedre format for mobil. Kom opp under
verifiseringen av Fase 1, punkt 9.

##
Når man gjør endringer på alle steder .. så må det komme tydelig frem at man har endringer som ikke er lagret .. type rød farge og grønn når den er lagret .. gjelder over alt .

##
Full logg over alle endringer — levert i Fase 9, se logg 2026-10-13 og `/admin/logg`.

##
Mulig å gå fra ansatt på main til ansatt på admin — levert i Fase 12, se logg 2026-10-13.

## Fra verifiseringen av Fase 18 (godkjenning), 2026-10-13
- Rette en endring fra godkjenningslisten i Admin, ikke bare godkjenne den.
- «Avvis»-knapp. I dag avvises en endring bare ved å gi den en status med virkning «Avvist», og ingen får beskjed.
- Den ansatte får beskjed når en endring godkjennes eller avvises.
- Som ansatt (prøvd som Frode) ser man ikke hva som er godkjent: en godkjent endring vises uten merke, og bare de som venter er merket. Sett igjen i Fase 19 (Max fikk ingen beskjed om hva som ble godkjent). Brukers idé: en egen visning eller logg over egne endringer og hva som er godkjent.
- Den som er valgt i «Velg deg selv», bør stå øverst i Ukeplan og Måned.
- Sortering på navn stigende ser ikke ut til å virke i Ukeplan (sett av bruker, ikke undersøkt; sorteringen ble ikke endret i Fase 18).
- Legge inn endring ved å trykke i Ukeplan og Måned — levert i Fase 19, se logg 2026-10-13. Et eget skjema utenfor planen er ikke bygget.

## Ansatte og synk mot Entra
- Kom inn, deaktivering og adminstatus — levert i Fase 10, se logg 2026-10-13 og `/admin/ansatte`.
- Mulig å gjøre masse endringer (flere ansatte om gangen)
- Synk mot Entra: sette når og hvor ofte, og kunne tvinge en synk — parkert, Fase 21 i `plan.md` («Senere»)
- Det kan hende andre parametere må settes for å få synken til å virke — parkert, Fase 21–23

##
Sortering i kolonner 

##
Sette siden i vedlikeholdsmodus

##
Ansatte må kunne legge inn ny status 

##
Etternavn i egen kolonne — levert i Fase 17, se logg 2026-10-13.

##
Mangler en knapp for lagring dersom man gjør mange endringer

##
superadmin -- som også har tilgang til Entra kobling og database kobling

##
Fase 21 (synk, parkert): endringsloggen må få en egen avsender for synken (f.eks. «Synk (Entra)»). `endretAv` er i dag id-en til valgt administrator, og `hvem()` i `lib/endringslogg.ts` må godta avsenderen, ellers vises id-teksten rått.

##
Fase 21 (synk, parkert): en synk gir én logglinje per person og oppsett og kan fylle «Endringslogg». Vurder filter på avsender.

##
Legge til filtreing på roller på uke/mnd plan

##
Godkjenningsliste i Admin, godkjenning fra Ukeplan og Måned og tydelig merke på de som venter — levert i Fase 18, se logg 2026-10-13 og `/admin/godkjenning`.

##
ansatt og admin skal kunne endre staus direkte i ukes/mnd visning
endringer godkjennes av admin

##
full mobil og pad test

##
full claude-security sjekk

##
Egne farger på endringstyper — levert i Fase 17 (Admin → Endringstyper), se logg 2026-10-13.

##
hent logo og sett på siden
https://vestfoldfylke.no/no/Designmanual/meny/logo-og-bruk/

##
det finnes et program som heter Sheep .. det er en sau som finner på mye tull på skjermen ..
jeg vil ha noe tilsvarende med en litt fyr som er rundt på siden

##
Mulighet for å dytte til Outlook ved f.eks sykdom

##
Navn stigende som standard — levert i Fase 17, se logg 2026-10-13.

##
Dager fra excel er ikke tatt med
