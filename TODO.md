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

**Beslutning (SR, 2026-09-30):** Fast lokasjon er standard arbeidssted — det som
gjelder når ingenting er endret. Dagcellene viser det allerede, så kolonnen
gjentar samme opplysning og tar plass, særlig på smal skjerm der den skjules i
dag (`globals.css`, `.col-home`).

Fjern kolonnen fra `components/UkeplanClient.tsx`, og vurder samtidig om
`.col-home`-regelen i mobilvisningen kan gå ut. Sjekk om Måned-fanen har samme
dobbeltføring. Meldt under Fase 2; hører hjemme i en egen liten fase eller som
opprydding i en fase som uansett rører ukeplantabellen.

## 3. Mobilvisning trenger et bedre format

Ukeplan og Måned er tabeller som scroller sidelengs på smal skjerm.
**Beslutning (bruker, 2026-09-30):** vi må finne et bedre format for mobil; tas
etter Fase 3. Kom opp under verifiseringen av Fase 1, punkt 9.

##
Når man gjør endringer på alle steder .. så må det komme tydelig frem at man har endringer som ikke er lagret .. type rød farge og grønn når den er lagret .. gjelder over alt .

##
Full logg over alle endringer — levert i Fase 9, se logg 2026-10-13 og `/admin/logg`.

##
Mulig å gå fra ansatt på main til ansatt på admin

## Ansatte og synk mot Entra
- Kom inn, deaktivering og adminstatus — levert i Fase 10, se logg 2026-10-13 og `/admin/ansatte`.
- Mulig å gjøre masse endringer (flere ansatte om gangen)
- Synk mot Entra: sette når og hvor ofte, og kunne tvinge en synk
- Det kan hende andre parametere må settes for å få synken til å virke

##
Sortering i kolonner 

##
Sette siden i vedlikeholdsmodus

##
Ansatte må kunne legge inn ny status 

##
legge til etternavn på ansatte i lista i egen kolonne

##
Mangler en knapp for lagring dersom man gjør mange endringer

##
superadmin -- som også har tilgang til Entra kobling og database kobling

##
Fase 16 (synk): endringsloggen må få en egen avsender for synken (f.eks. «Synk (Entra)»). `endretAv` er i dag id-en til valgt administrator, og `hvem()` i `lib/endringslogg.ts` må godta avsenderen, ellers vises id-teksten rått.

##
Fase 16 (synk): en synk gir én logglinje per person og oppsett og kan fylle «Endringslogg». Vurder filter på avsender.