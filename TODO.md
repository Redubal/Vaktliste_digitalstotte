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
