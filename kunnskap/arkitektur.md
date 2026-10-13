# Arkitekturbeslutninger

<ett avsnitt per beslutning som IKKE er selvforklarende fra koden: hvorfor denne
løsningen og ikke den enkle/opplagte. Oppdateres når en beslutning tas, ikke i bulk.>

## Datalag: JSON-filer i `data/` inntil videre

Appen leser `data/*.json` (generert av `npm run import` fra Excel-fila) med
`fs.readFileSync`. Ukeplanen regnes ut i `lib/ukeplan.ts` fra ansatte + endringer +
dager, ikke importert ferdig fra Excel. Database er utsatt fordi det foreløpig ikke
er tilgang til en på utviklingsmaskinen. `data/` er gitignorert (navn, e-post,
sykefravær). Se plan.md, «Avklarte beslutninger».

## Admin: egen datamodell i én fil (besluttet 2026-09-30, bygget i Fase 3 for lokasjoner)

Status Fase 3: `data/vaktliste.json` er i bruk (`lib/lager.ts` leser og skriver atomisk med
revisjon og sikkerhetskopi i `data/sikkerhetskopi/`, siste 20). Tabellene som finnes er
`lokasjoner`, `brukere`, `oppsett`, `endringer`, `dager`; resten kommer i Fase 4–7. `npm run
migrer` slår de gamle fem filene sammen én gang; `npm run import` nekter å overskrive en
eksisterende `vaktliste.json` uten `--overskriv`. Kilden til feltene på lokasjon er Excel-fanen
Lokasjoner (navn og team); id-en er en kode laget ved opprettelse og endres aldri ved omdøping.
Reglene bor i `lib/domene.ts` (uten imports, deles med skriptene).

Fase 4 la til `roller` (`id, name`) og byttet `oppsett.role` (fritekst) mot `rolleId`.
Skjemaversjonen er 2.

## Ny skjemaversjon: omgjøring ved lesing (besluttet 2026-10-13, Fase 4)

`lesVaktliste` sender en fil i eldre versjon gjennom `oppgraderVaktliste` (`lib/domene.ts`),
som går ett steg om gangen (`tilVersjon2` …). Fila på disk skrives først ved neste lagring,
og `endreVaktliste` tar sikkerhetskopi av den gamle versjonen før det. Ukjent eller nyere
versjon gir feil. Skriptene (`import`, `migrer`) bygger det gamle formatet og kaller samme
funksjon, så omgjøringen finnes bare ett sted. Ny tabell i Fase 5–7: øk `SKJEMA_VERSJON` og
legg til et `tilVersjonN`-steg (Fase 6 er `tilVersjon4`). Id-ene som lages er deterministiske, så gjentatt lesing av
en ulagret v1-fil gir de samme id-ene hver gang.

Fase 5 la til `statuser` (`id, name, visesIPlan`) og `endringstyper` (`id, name, kategori`) og
byttet `endringer.status`/`endringer.type` (fritekst) mot `statusId`/`typeId`. Skjemaversjonen
er 3. Avvik fra tabelllisten under: `visesIPlan` (av/på) i stedet for `virkning`
(`godkjent|venter|avvist`), fordi ukeplanen bare trenger å vite om raden skal med; `sortering`
og `aktiv` er ikke tatt med (listene sorteres på navn, sletting av rad i bruk nektes).
`ukeplan.ts` leser `Endring.visesIPlan` og `Endring.kategori`, ikke navn. Kategorien «lokasjon»
gir lokasjonsfarge, «fravær» fri-farge. Omgjøringen 2 → 3 gir kategori fravær til de fem navnene
som før fikk fri-farge på navn (ferie, fri, avspasering, fridag / helligdag, syk) og
`visesIPlan` bare til «Godkjent»; et nytt navn som bare skiller seg i store/små bokstaver slås
sammen med det første. Side: `/admin/endringstyper` (begge listene).

Fase 6 la til `team` (`id, name`) og byttet `oppsett.team`/`lokasjoner.team` (navnet «Øst»/«Vest»)
mot `teamId`. `endringer.team` er fjernet, som tabelllisten under sier. Skjemaversjonen er 4.
Rekkefølgen i `team`-tabellen er rekkefølgen i teamvelgeren (ikke alfabetisk, som ville satt Vest
før Øst); omgjøringen 3 → 4 legger Øst og Vest først og skriver dem alltid slik, og stopper med
feil hvis en oppsett-rad eller lokasjon mangler team. Id-ene blir `ost` og `vest`. Filteret i
Ukeplan og Måned er en team-id eller `ALLE_TEAM = "*"` («Alle team», tidligere «Begge»);
`Ansatt` har både `teamId` (filter og telling) og `team` (navnet, til visning). Sorteringen ved
«Alle team» går fortsatt på teamnavn. Et team kan ikke slettes mens en person eller en lokasjon
bruker det, og det siste teamet kan aldri slettes. Side: `/admin/team`. `import-excel.mjs` har
fortsatt sin egen Øst/Vest-liste: den lager v1, og omgjøringen gjør resten.

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
