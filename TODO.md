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

Løst i Fase 15 (2026-10-13, kort per person under 768 px), se logg.md. Resten av testen på pad og mobil er Fase 28 i `plan.md`.
**Beslutning (bruker, 2026-09-30):** vi må finne et bedre format for mobil. Kom opp under
verifiseringen av Fase 1, punkt 9.

## 4. Flere endringer på samme dag, med klokkeslett

Fase 35 levert 2026-10-13 (klokkeslett og flere linjer i Ukeplan, se logg). Fase 36
(Måned) og 37 (varsel ved overlapp) gjenstår i `plan.md`. Ønsket av Ståle under Fase 24.
Max-tilfellet (endring flyttet til en «okkupert» dag vises ikke riktig) er ikke
bekreftet mot hans data.

## 5. Hurtigknapp «Registrer» for administrator, foran Ukeplan

Ønsket av Ståle 2026-10-13, under Fase 25. En administrator skal få en
«Registrer»-knapp foran Ukeplan som åpner et kjapt skjema, i stedet for å lete opp
personen i kalenderen og klikke på dagen. Ikke vurdert i koden. Trenger plan, og
planmodus med tyngste modell før den får fasenummer. Endringsvinduet
(`components/EndringVindu.tsx`) har i dag bare inngang via en dag i planen eller,
fra Fase 25, «Rett» i Admin → Godkjenning.

## 6. Ukenummer i kalenderen

Ønsket av Ståle 2026-10-13, under Fase 26. Ukenummer skal vises i kalenderen
(Måned, og eventuelt mobilkalenderen). Ikke vurdert i koden. `lib/uker.ts` og
`lib/ukeplan.ts` har allerede ISO-ukeregning (`isoWeek`), men ingen visning av
ukenummer i Måned. Må få fasenummer i planen før den gjøres.

## 7. Kolonnene i Admin → Ansatte overlapper

Levert i Fase 31, se logg 2026-10-13. Årsak: faste kolonner låste navnene på 50 px
(siden er maks 1200 px); `DeaktivertRad` hadde samme rutenett, så det var ikke feilen.
**Beslutning (Ståle, plass til navn):** kortere faste kolonner, ingen høyere rader.

## 8. Lista over deaktiverte ansatte vil bli lang

Ståle 2026-10-13 under Fase 30: deaktiverte ligger nederst i Admin → Ansatte,
alle sammen. Med synk fra Entra vokser lista for hver som slutter, og den kan
ikke listes uendelig. Ikke vurdert hvordan det skal løses. Trenger plan.

## 9. Måned på mobil: mandager kan havne i lørdagskolonnen (hypotese)

Funnet 2026-10-13 ved lesing av koden under planleggingen av punkt 4, ikke sett i
nettleseren. Kalenderen `.mkal` i `MaanedClient.tsx` har 7 kolonner (M–S), men
`plan.dager` fra `beregnMaaned` (`lib/ukeplan.ts`) har bare hverdager. Da vil
mandagen i uke to havne under «L». Avgjøres ved å åpne Måned i et smalt vindu og se
om datoene står under riktig ukedag.

## Levert (pekere)
- Tydelig ulagret (rødt) / lagret (grønt) — Fase 8 gjaldt hele Admin, se logg 2026-10-13. Ønsket sa «over alt»; om endringsvinduet i Ukeplan/Måned trenger det samme, er ikke vurdert.
- Full logg over alle endringer — Fase 9, se logg 2026-10-13 og `/admin/logg`.
- Kom inn, deaktivering og adminstatus for ansatte — Fase 10, `/admin/ansatte`.
- Masseendring (flere ansatte om gangen) — Fase 11.
- Gå fra ansatt på forsiden til ansatt i Admin — Fase 12.
- Sortering i kolonner — Fase 13.
- Vedlikeholdsmodus — Fase 14.
- Lagreknapp når man gjør mange endringer («Lagre alle») og filter på roller i Ukeplan/Måned — Fase 16.
- Etternavn i egen kolonne, navn stigende i Ansatte-listene, egne farger på endringstyper — Fase 17.
- Godkjenningsliste i Admin, godkjenning fra Ukeplan og Måned og merke på de som venter — Fase 18, `/admin/godkjenning`.
- Ansatt og admin legger inn/endrer status direkte i Ukeplan og Måned (godkjennes av admin) — Fase 19. Et eget skjema utenfor planen er ikke bygget.
- Vestfold-logoen på siden (designmanualen) — Fase 20.
- Den valgte personen øverst og navn stigende i Ukeplan og Måned — Fase 21 (Ukeplan og Måned hadde ingen standardsortering), se logg 2026-10-13.
- «Avvis»-knapp med begrunnelse — Fase 23, se logg 2026-10-13. **Beslutning (SR, slette-rett):** bare administrator kan slette en endring (`kanSletteEndring`); ansatt retter egne som venter.
- Lista over endringer som venter, også i Ukeplan (sett av bruker i Fase 21) — Fase 23 (alle som venter, uansett uke og team), se logg 2026-10-13.
- Ansatt ser egne endringer med status, begrunnelse og godkjent-merke — Fase 24, se logg 2026-10-13. **Beslutning (SR, beskjed):** i appen, ikke e-post/Teams nå; varsel utenfor appen står igjen under «Senere».

- Rette en endring fra godkjenningslista i Admin — Fase 25, se logg 2026-10-13, `useRettVindu` i `components/EndringVindu.tsx`.

## I planen (Fase 22, 26–29, godkjent 2026-10-13)
- Figur som vandrer rundt på siden, som «Sheep» — Fase 22.
- Dager fra Excel: skolekalender (Fase 26) og fridager (Fase 27) levert, se logg 2026-10-13. Radtellingen av innlastingen er ikke gjort (se STATUS).
- Full mobil- og pad-test — Fase 28.
- Full sikkerhetsgjennomgang — gjort i Fase 29, se logg 2026-10-13 og `kunnskap/sikkerhet.md`.

## Brukerhandling (ingen fase)
- «Flyttet» kan lagres uten lokasjon, og dagsruta viser da bare «Flyttet» (sett på Max, uke 42). Lokasjon kreves bare for typer i kategorien «Lokasjon» (`EndringVindu.tsx`, `lib/domene.ts`); ruta var gul, så «Flyttet» ligger trolig i «Annet» (slutning fra bildet, data ikke sett). Rettes ved å sette «Flyttet» til «Lokasjon» i Admin → Endringstyper; eksisterende endring må rettes for seg.

## Senere (Entra og database, Fase 30 og 32–34 i `plan.md`)
- Synk-tidspunkt, «Synk nå» og egen avsender i loggen — Fase 30, se logg 2026-10-13. Filter på avsender ikke bygget; kjøringer filtreres via «Synk av ansatte» i Tabell-lista. Det kan hende andre parametere må settes for å få synken mot ekte Entra til å virke — Fase 32–33.
- Superadmin, som også har tilgang til Entra- og databasekoblingen — merknad i Fase 32.
- Fase 33: lagre fornavn og etternavn fra Entra som egne felt på personen (synken leser dem allerede, `KildePerson.fornavn/etternavn`), og la visningen bruke dem i stedet for `delNavn` (siste ord = etternavn). Ellers vises doble etternavn feil. Spurt av Ståle 2026-10-13 under Fase 30.
- Dytte til Outlook, f.eks. ved sykdom — merknad i Fase 33 (samme Graph-tilgang).
- Varsel utenfor appen (e-post eller Teams) når en endring blir godkjent, avvist eller får annen status. Spurt av Ståle 2026-10-13 under Fase 23. Beskjeden **i appen** er Fase 24 og skal komme uansett: «det må likevel være en del av siden». Varsel utenfor appen trenger Graph-tilgang som Fase 30 og 32–33, og vet først hvem mottakeren er når e-post kommer fra Entra.
