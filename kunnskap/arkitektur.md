# Arkitekturbeslutninger

<ett avsnitt per beslutning som IKKE er selvforklarende fra koden: hvorfor denne
løsningen og ikke den enkle/opplagte. Oppdateres når en beslutning tas, ikke i bulk.>

## Datalag: JSON-filer i `data/` inntil videre

Appen leser `data/*.json` (generert av `npm run import` fra Excel-fila) med
`fs.readFileSync`. Ukeplanen regnes ut i `lib/ukeplan.ts` fra ansatte + endringer +
dager, ikke importert ferdig fra Excel. Database er utsatt fordi det foreløpig ikke
er tilgang til en på utviklingsmaskinen. `data/` er gitignorert (navn, e-post,
sykefravær). Se plan.md, «Avklarte beslutninger».

## Admin: egen datamodell i én fil (besluttet 2026-09-30, ikke bygget ennå)

Appen skal eie dataene og bygges ikke som en avbildning av Excel-arket. Excel blir
en engangsinnlasting. Modellen er ekte tabeller med primær- og fremmednøkler, så den
kan flyttes til SQLite senere.

- **Én fil, `data/vaktliste.json`**, ikke én per tabell. Flere filer kan ikke lagres
  atomisk sammen på Windows; krasj mellom to lagringer gir brutte koblinger. Felt på
  toppnivå: `skjemaVersjon`, `revisjon` (teller ved hver lagring), `sistEndretAv`.
- **Tabeller:** `team`, `roller`, `lokasjoner`, `endringstyper`, `statuser` (alle med
  `id, navn, sortering, aktiv`), `personer` (`erAdministrator`), `oppsett`,
  `endringer`, `dager`. `endringer.team` finnes ikke: team utledes fra personen.
- **Semantikk i felt, ikke i navn:** `statuser.virkning` (`godkjent|venter|avvist`)
  erstatter `status !== "Godkjent"` i `lib/ukeplan.ts`; `endringstyper.kategori`
  (`fravaer|lokasjon|annet`) erstatter navnelisten i `classifyCelle`. Kodene er uten
  æøå fordi norske tegn har blitt ødelagt stille i verktøykjeder her.
- **Sletting** av rad i bruk nektes med beskjed om hvem som bruker den. `aktiv` er
  utveien.
- **Skriving:** temp-fil i `data/` (ikke systemets temp), lukk før rename, prøv på nytt
  ved `EPERM/EACCES/EBUSY`, sikkerhetskopi før hver lagring, revisjonssjekk mot
  samtidige faner. Autorisasjon sjekkes inne i hver handling, aldri bare i `proxy.ts`.
- **Admintilgang** er feltet `erAdministrator`, ikke en rolle. «Velg deg selv» er ikke
  sikkerhet; det erstattes av Entra i senere fase.
