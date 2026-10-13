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

Ønsket av Ståle 2026-10-13, under Fase 24. En dag skal kunne ha flere endringer
med klokkeslett, f.eks. annen lokasjon 08–12 og avspasering resten av dagen.
- Overlappende klokkeslett for samme person skal gi et **varsel, men ikke stoppes**.
- Administrator må kunne endre (rette tidene, eller la overlappen stå).

Slik er det i dag (lest i koden, ikke prøvd): en dagcelle viser bare én endring
(`beregnCelle` i `lib/ukeplan.ts` tar den første som treffer, godkjente først),
så en endring nummer to samme dag er bare synlig i lister. `fromTime`/`toTime`
finnes på endringen og vises i perioden, men vinduet for endringer setter dem
ikke (ny endring lagres med `null`). Trenger plan: celle og prikk må vise flere
endringer, også i kortlisten og i Måned.

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

## I planen (Fase 22, 25–29, godkjent 2026-10-13)
- Figur som vandrer rundt på siden, som «Sheep» — Fase 22.
- Rette en endring fra godkjenningslisten i Admin — Fase 25.
- Dager fra Excel mangler, både skolekalender og fridager — Fase 26 (Admin → Dager, merknader i Måned) og Fase 27 (fridager). Innlastingen leser bare kolonne A–C i arket «Dager», og fridag finnes ikke som begrep.
- Full mobil- og pad-test — Fase 28.
- Full sikkerhetsgjennomgang (`/security-review`) — Fase 29.

## Brukerhandling (ingen fase)
- «Flyttet» kan lagres uten lokasjon, og dagsruta viser da bare «Flyttet» (sett på Max, uke 42). Lokasjon kreves bare for typer i kategorien «Lokasjon» (`EndringVindu.tsx`, `lib/domene.ts`); ruta var gul, så «Flyttet» ligger trolig i «Annet» (slutning fra bildet, data ikke sett). Rettes ved å sette «Flyttet» til «Lokasjon» i Admin → Endringstyper; eksisterende endring må rettes for seg.

## Senere (Entra og database, Fase 30–33 i `plan.md`)
- Synk mot Entra: sette når og hvor ofte, og kunne tvinge en synk — Fase 30. Det kan hende andre parametere må settes for å få synken til å virke — Fase 30–32.
- Fase 30: endringsloggen må få en egen avsender for synken (f.eks. «Synk (Entra)»). `endretAv` er i dag id-en til valgt administrator, og `hvem()` i `lib/endringslogg.ts` må godta avsenderen, ellers vises id-teksten rått.
- Fase 30: en synk gir én logglinje per person og oppsett og kan fylle «Endringslogg». Vurder filter på avsender.
- Superadmin, som også har tilgang til Entra- og databasekoblingen — merknad i Fase 31.
- Dytte til Outlook, f.eks. ved sykdom — merknad i Fase 32 (samme Graph-tilgang).
- Varsel utenfor appen (e-post eller Teams) når en endring blir godkjent, avvist eller får annen status. Spurt av Ståle 2026-10-13 under Fase 23. Beskjeden **i appen** er Fase 24 og skal komme uansett: «det må likevel være en del av siden». Varsel utenfor appen trenger Graph-tilgang som Fase 30–32, og vet først hvem mottakeren er når e-post kommer fra Entra.
