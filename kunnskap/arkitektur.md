# Arkitekturbeslutninger

<ett avsnitt per beslutning som IKKE er selvforklarende fra koden: hvorfor denne
løsningen og ikke den enkle/opplagte. Oppdateres når en beslutning tas, ikke i bulk.>

## Datalag: JSON-filer i `data/` inntil videre

Appen leser `data/*.json` (generert av `npm run import` fra Excel-fila) med
`fs.readFileSync`. Ukeplanen regnes ut i `lib/ukeplan.ts` fra ansatte + endringer +
dager, ikke importert ferdig fra Excel. Database er utsatt fordi det foreløpig ikke
er tilgang til en på utviklingsmaskinen. `data/` er gitignorert (navn, e-post,
sykefravær). Se plan.md, «Avklarte beslutninger».
