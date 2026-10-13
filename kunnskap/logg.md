# Logg

## 2026-10-13 — Fase 19 ✅ Status direkte i uke-/månedsvisning

- Bruker ba om faseslutt etter å ha prøvd det (som ansatt, Max, og som administrator): «kan godkjenne både i ukeplan og i admin liste». Hvilke deler som ble prøvd utover det (retting, sletting, Måned, mobil) ble ikke oppgitt punkt for punkt; føres derfor som ikke bekreftet nedenfor.
- Funn ved start: det fantes ingen måte å legge inn en endring på (ingen skjema, ingen handling); alle handlinger krevde administrator. Fasen bygger derfor innleggingen fra bunnen.
- Levert: klikk på en dag i Ukeplan (cella) eller Måned (prikk / kalenderdag) åpner et vindu (`components/EndringVindu.tsx`, native `<dialog>`) for ny endring eller retting/sletting. Handlingene `lagreEndring` og `slettEndring` i `app/handlinger.ts`; reglene i `lib/domene.ts` (`leggTilEndring`, `rettEndring`, `slettEndring`, `kanEndreEndring`, `venterStatus`). Admin-sjekken er flyttet til `utforSom` i `lib/utfor.ts`, som både Admin og planen bruker. `Endring` (visningen) har fått `typeId` og `lokasjonId`. Siden sender revisjon og valg (typer, lokasjoner) til alle som har valgt seg selv; «Godkjenn» vises fortsatt bare for administratorer.
- **Beslutning (bruker, hvem):** en ansatt legger inn endringer bare for seg selv; en administrator for alle. Begrunnelse: minst rom for feil.
- **Beslutning (bruker, admin):** det en administrator legger inn, er godkjent med en gang. Begrunnelse: slipper å godkjenne sin egen endring; endringsloggen viser hvem.
- **Beslutning (bruker, retting):** en ansatt kan rette og slette egne endringer som venter, ikke godkjente eller avviste; en administrator kan rette og slette alle. Begrunnelse: en godkjent endring skal ikke kunne forsvinne eller endres i stillhet.
- **Beslutning (bruker, felter):** vinduet spør om type, fra–til-dato og kommentar; ny lokasjon når typen er en lokasjonstype. Klokkeslett er ikke med.
- **Beslutning (bruker, lokasjon):** «Flyttet, så må jeg kunne si til hvor.» Lokasjonsfeltet står derfor alltid i vinduet: valgfritt, påkrevd for typer i kategori «Lokasjon». Begrunnelse: omgjøringen i versjon 3 ga aldri kategori «lokasjon», så typer som «Flyttet» ligger i «Annet»; første versjon viste feltet bare for kategori «Lokasjon», og bruker fant ikke feltet.
- **Beslutning (bruker, klikkflate):** hele cella (Ukeplan) og hele ruta rundt prikken (Måned) skal kunne trykkes, ikke bare teksten. Løst med en knapp som dekker cella (`::after`); «Godkjenn» ligger over og kan trykkes for seg.
- Observert: etter kodeendringen sendte dev-serveren gamle data fra `app/page.tsx` (uten `valg`), mens klientkoden var ny; vinduet krasjet («reading 'endringstyper'»). Rettet slik at dagene ikke kan klikkes når data mangler; siden må lastes fra en omstartet server.
- **Beslutning (Claude, status):** ny endring fra ansatt får den første statusen med virkning venter (navnerekkefølge), ellers ingen status (som også venter). Retting endrer ikke status, person eller klokkeslett. Ny id er `endring-<fra-dato>` (`-2`, `-3` … ved like). Vedlikeholdsmodus stenger handlingene for andre enn administratorer.
- Sjekk i Node med oppdiktede rader: 28 av 28 OK (legge inn, rette, slette; egen/andres; venter/godkjent; datoer, lokasjon, kommentarlengde; ingen venter-/godkjent-status). `tsc --noEmit` og `npm run lint` grønne.
- Ønsker fra bruker under fasen, ført i `TODO.md` og ikke gjort (utenfor fasen): innlogget person øverst i Ukeplan og Måned; navn stigende i Ukeplan; en ansatt ser ikke hva som er godkjent (Max fikk ingen beskjed), med brukerens idé om en egen visning eller logg over egne endringer.
- Ikke prøvd av noen: retting og sletting i vinduet, klikk i Måned (prikk og mobilkalender), vedlikeholdsmodus mot ansatt som lagrer, to faner samtidig mot lagring, `next build`.
- Sjekk: `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring (klikkflate og lokasjonsfelt); etterpå bare `kunnskap/`, `TODO.md` og `plan.md`, så de ble ikke kjørt på nytt ved faseslutt.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 1 treff. Datauttrekk og Excel ikke i git; de tre nye kodefilene 0 treff.
- STATUS er 43 linjer (tak 45). Fase 19 kollapset i `plan.md`; TODO-posten om innlegging i Ukeplan fortettet til peker. fase-slutt: 17:16–17:20, ca. 4 min fram til commit (pluss ventetid på svar).

## 2026-10-13 — Fase 18 ✅ Godkjenningsliste i Admin

- Levert: statusene har `virkning` (`godkjent|venter|avvist`) i stedet for `visesIPlan` (skjemaversjon 10, `tilVersjon10`). Ny side `/admin/godkjenning` (`app/admin/godkjenning/page.tsx`) med liste og «Godkjenn»-knapp per rad; Admin-forsiden viser antallet som venter. Handlingen `godkjenn` i `app/admin/handlinger.ts` bruker `godkjennEndring` og `godkjentStatus` i `lib/domene.ts` og sjekker admin som alle andre handlinger. Ukeplan og Måned viser endringer som venter med stiplet kant og tekstmerket «Venter» (felles del `components/Godkjenning.tsx`); administratorer får «Godkjenn» i cella (Ukeplan) og i en sammenleggbar liste over månedens ventende (Måned). Endringsloggen kjenner feltet `virkning` («Betyr»).
- Bruker bekreftet «Godkjenning fungerer» etter å ha sett merket som ansatt (uten knapp), listen i Admin (fire endringer med status «Utgår») og godkjent som administrator. Hvilke steder som ble prøvd (Ukeplan-cella, Admin-listen, Måned) ble ikke oppgitt punkt for punkt. Omgjøringen 9 → 10 er sett virke på brukerens egen fil, ikke bare i Node.
- Observert: statusen «Utgår» ble «venter» ved omgjøringen, fordi bare «Godkjent» viste i plan før. Bruker kan sette den til «Avvist» i Admin → Endringstyper og statuser om den ikke skal i godkjenningslisten.
- Bruker spurte om rettelse av endring, avvisning med beskjed til den ansatte, innlogget person øverst, navn stigende i Ukeplan, og å legge inn endring både i skjema og i Ukeplan; ført i `TODO.md` (Fase 19 får det siste). Bruker så også at en ansatt (Frode) ikke ser hva som er godkjent, siden bare de som venter er merket; ført i `TODO.md`.
- Ikke prøvd: Måned-visningen og mobilkortet med ventende endringer, en endring uten status, å sette en status til «Avvist», `next build`.
- **Beslutning (bruker, venter/avvist):** statusene får `virkning` (`godkjent|venter|avvist`) i stedet for `visesIPlan`. Begrunnelse: av/på-bryteren kan ikke skille en endring som venter fra en som er avslått, og godkjenningslisten skal bare vise dem som venter. Omgjøringen 9 → 10 (`tilVersjon10`) gir godkjent til statuser som viste i plan, venter til resten; avvist settes i Admin → Endringstyper. Opphever Claudes beslutning fra Fase 5 (avkrysning i stedet for `virkning`).
- **Beslutning (bruker, synlighet):** alle ser endringer som venter i Ukeplan og Måned, med merke; bare administratorer får «Godkjenn». Begrunnelse: passer med Fase 19, der en ansatt skal se sin egen endring som «ikke godkjent».
- **Beslutning (Claude, godkjenning):** å godkjenne setter endringens status til den første statusen med virkning godkjent (navnerekkefølge), `godkjentStatus` i `lib/domene.ts`. Bare endringer som venter kan godkjennes; avviste nektes. En endring uten status (eller med slettet status) regnes som venter. Begrunnelse: ingen ny tabell eller innstilling trengs; finnes ingen godkjent status, sier handlingen fra.
- **Beslutning (Claude, prioritet i cella):** treffer en godkjent og en ventende endring samme dag, viser cella den godkjente; den ventende står da bare i Admin → Godkjenning. Begrunnelse: planen skal vise det som faktisk gjelder.
- Sjekk i Node med oppdiktede rader: 9 → 10 og `godkjennEndring` (godkjenn, allerede godkjent, ukjent id, uten status, avvist, ingen godkjent status), 10 av 10 OK. `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring (kl. ca. 16:00); etterpå bare `kunnskap/` og `TODO.md`.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 3 treff. `data/` er ikke i git.
- STATUS er 42 linjer (tak 45). Fase 18 kollapset i `plan.md`; TODO-posten om godkjenningsliste fortettet til peker. fase-slutt: 16:30–16:36, ca. 6 min fram til commit.

## 2026-10-13 — Fase 17 ✅ Små rettinger (etternavn, navn A–Å, egne farger)

- Levert: Ansatte-fanen og Admin → Ansatte har kolonnene «Fornavn» og «Etternavn» (`delNavn` i `lib/sortering.ts`; navnet er ett felt, siste ord er etternavn). `useSortering` tar en standardsortering; begge lister starter på navn stigende. Endringstyper har valgfri egen farge (`farge: string | null` som `#rrggbb`, `Endringstype` i `lib/domene.ts`), valgt i Admin → Endringstyper (`KategoriOgFarge` i `components/EndringstypeAdmin.tsx`) og brukt i Ukeplan (cellefarge, `egenCelleStil`) og Måned (prikk og kalenderdag, `egenFarge` i `lib/ukeplan.ts`). Skjemaversjon 7 → 9 (`tilVersjon7–9`).
- **Beslutning (Claude, etternavn):** «Fornavn»-kolonnen beholder sorteringsnøkkelen `navn` (hele navnet), «Etternavn» sorterer på siste ord. Begrunnelse: gamle adresser med `?sorter=navn` virker fortsatt, og planen ba om «navn stigende» som standard.
- **Beslutning (Claude, farge):** `null` betyr standardfargen for kategorien fra stilarket (`STANDARDFARGER`: fravær `#9ab548`, lokasjon `#5b9bd5`, annet `#f2c94c`); fargen sjekkes som `#rrggbb` fordi den havner i en style-verdi.
- **Beslutning (bruker, standardfarge):** «hvis fargene er fra stilarket, skal det ikke være avhuket for egen farge». Begrunnelse: bruker så alle typer avhuket etter at jeg la de gamle fargene inn som egne (versjon 8). Rettet i versjon 9: en farge lik standarden for kategorien settes tilbake til `null`.
- Observert: bruker hadde lagret «Annet» med rosa før de gamle fargene kom inn, så datafila sto allerede på versjon 7 og et endret versjon 7-steg ble hoppet over. Dermed to nye versjonssteg (8 og 9) for ett felt; versjon 8 og 9 kjører samme funksjon. Observert: fargevelgeren viste fast blå på alle rader uten hake; den viser nå standardfargen for valgt kategori og bytter når kategorien byttes.
- Kjent endring: en endring med ny lokasjon var alltid blå; har typen egen farge, følger den nå typens farge. Uten egen farge er det som før.
- Bruker bekreftet «ok, det fungerer» på Admin → Endringstyper etter siste rettelse. Etternavn-kolonnen, navn A–Å som standard og fargene i Ukeplan og Måned ble ikke nevnt særskilt. Ikke testet: oppgraderingen mot en ekte versjon 7-fil (ikke kjørt i Node), kolonnebredden i Admin → Ansatte med to navnekolonner under 1280 px, `next build`.
- `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring (`KategoriOgFarge`). Fase 16-arbeidet lå ucommittet fra forrige økt og følger med i samme commit.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 2 treff. `data/` er ikke i git.
- STATUS er 41 linjer (tak 45). fase-slutt: 14:32–14:34 fram til commit.

## 2026-10-13 — Fase 16 ✅ «Lagre alle» og rollefilter

- Levert: «Lagre alle» i Admin → Ansatte lagrer alle rader med ulagrede endringer i én lagring (`lagreAlleAnsatte` i `app/admin/handlinger.ts`, alt eller ingenting, samme sjekker som `endreAnsatt`; to oppsett for samme bruker med ulik adminstatus nektes). Radene sier fra til `AnsattAdmin` via `meldEndret`; verdiene leses fra radskjemaene (`data-oppsett`) idet knappen trykkes; radene nullstilles med samme `versjon`-mekanisme som masseendring. Rollefilter (`?rolle=`, `components/Rollefilter.tsx`) i Ukeplan og Måned, filtrerer både tabell og kort.
- Rettet etter bruker: statustekst tar plassen til «Kom inn» så raden ikke vokser; knappene i masse-linja på egen linje 2 (to rader: valg, knapper); «Bruk på valgte» og «Deaktiver valgte» er grået ut uten avkrysning; en gammel feilmelding skjules når avkrysningen endres.
- **Beslutning (bruker, plassering):** knappene flyttes til linje to i masse-linja. Begrunnelse: blandingen av valg og knapper på én linje ble «hulter til bulter».
- Bruker bekreftet «det fungerer» etter at oppsettet var rettet; rollefilteret ble ikke nevnt særskilt. `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring; `next build` ikke kjørt. Ikke prøvd: ugyldig rad blant gyldige i «Lagre alle», flere oppsett for samme bruker, rollefilter i Måned og på smal skjerm.

## 2026-10-13 — Planendring: Entra og database parkert

**Beslutning (bruker, Entra og import):** alt som har med Entra og import å gjøre flyttes til senere.
Begrunnelse oppgitt ikke; tilgangene (app-registrering, Graph, database) og behandlingsgrunnlaget
(`TODO.md` punkt 1) mangler uansett. Gamle Fase 16–19 er nå Fase 21–24 under «Senere» i `plan.md`.
**Beslutning (bruker, neste faser):** i stedet kommer Fase 16 «Lagre alle» og rollefilter, 17 små
rettinger, 18 godkjenningsliste, 19 status direkte i planen, 20 mobil/pad-test og logo. Ingen kode endret.

## 2026-10-13 — Fase 15 ✅ Bedre format på mobil

- Levert: under 768 px skjules tabellene i Ukeplan og Måned (`.visning-tabell`) og en kortliste vises (`.visning-kort`, begge i `globals.css`). Ukeplan: ett kort per person, dagene under hverandre med lokasjon, farge og dagsmerknad. Måned: ett kort per person med kalender i sju kolonner (M T O T F L S), fargede ruter med dagnummer, første dag i riktig ukedagskolonne. Navn-/Rolle-sortering er flyttet over kortlisten. Uthevingen fra Admin ruller til det synlige elementet (tabellrad eller kort, valgt med `offsetParent`).
- **Beslutning (bruker, mobilformat):** «kort per person» valgt framfor «dag for dag». Begrunnelse: planen ba om liste per person, og kortet viser hva én person gjør hele uka; skisse av dagvelger (én dag om gangen) ble senere nevnt som mulig alternativ, men ikke valgt.
- Observert: brukeren så først den gamle tabellen på smal skjerm; årsaken var nettleserens hurtigbuffer (bekreftet av bruker: «det var cash»), ikke koden. Etter oppdatering: «ser ok ut, finner ingen åpenbare feil».
- Verifisering: bruker bekreftet i ord, uten punkt for punkt. Ikke sett: «Vis i ukeplan» fra Admin som ruller til kortet, sortering på kortene, Måned-kalenderen med måneder som starter midt i uka, bredt vindu tilbake til tabell.
- Sjekk: `tsc --noEmit` rent etter siste kodeendring i `.tsx` (CSS kom før typesjekken, påvirker den ikke); `npm run lint` kjørt ved faseslutt, ingen feil. `next build` ikke kjørt.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 1 treff. Ingen filer i `data/` ligger i git.
- Fase 13–14 (ucommittet fra forrige økt) og de nye filene `components/Sortering.tsx`, `VedlikeholdAdmin.tsx`, `personSortering.ts` og `lib/sortering.ts` tas med i samme commit; `.claude/settings.json` tas ikke med.
- STATUS: 41 linjer.
- fase-slutt: 12:32–12:36, 4 min (inkl. ventetid på svar om plan og `TODO.md`).

## 2026-10-13 — Fase 14 ✅ Vedlikeholdsmodus

- Levert: `innstillinger` (`vedlikehold`, `melding`) i `vaktliste.json`, skjemaversjon 5 → 6 (`tilVersjon6` i `lib/domene.ts`, avskrudd som standard). `app/layout.tsx` (nå `async`, leser cookie og vaktliste) viser bare meldingen for dem som ikke er administrator, med «Velg deg selv» stående så man kan bytte tilbake; administratorer får et gult bånd (`.vedlikehold-band`). Bryter og meldingsfelt i Admin (`components/VedlikeholdAdmin.tsx`, handling `settVedlikehold`). `utfor` kaller nå `revalidatePath("/", "layout")` så layouten ikke står igjen med gammel tilstand.
- **Beslutning (bruker, logging av vedlikehold):** brukeren ba om at å skru vedlikehold på/av føres i endringsloggen med hvem som gjorde det. Begrunnelse: vedlikeholdsmodus stenger appen for alle andre, så det må kunne spores. `innstillinger` er et objekt, ikke en tabell; `rader()` i `lib/endringslogg.ts` gjør det til én rad (id «vedlikehold»), og «Innstillinger» er ny tabell i filteret.
- Planen sier «`utfor` nekter skriving for andre»: ingen ny kode, `utfor` nekter allerede alt som ikke er administrator.
- Hypotese (ikke sett): layouter rendres ikke på nytt ved navigering på klientsiden (Next-dokumentasjonen), så en som har siden åpen ser den uendret til oppdatering. `router.refresh()` i «Velg deg selv» rendrer layouten på nytt. Avgjøres ved å la en ansatt ha siden åpen mens administrator skrur på.
- Verifisering: bruker svarte «14 er ok» under faseslutt, uten å oppgi hva som ble prøvd punkt for punkt. Ikke sett i ord: meldingen som vanlig ansatt, gult bånd som administrator, skru av, de to loggradene, oppgradering 5 → 6 mot ekte fil, `next build`.
- Sjekk: `tsc --noEmit` og `npm run lint` rene etter siste kodeendring (`endringslogg.ts`); etterpå bare `kunnskap/`. Rettet underveis: klassenavn med «å» byttet til ASCII.
- Fase 13 (sortering, ucommittet fra forrige økt) er tatt med i samme commit.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 7 treff. Ingen filer i `data/` ligger i git.
- STATUS: 40 linjer.
- fase-slutt: 12:17–12:19, 2 min (inkl. ventetid på svar om plan og `TODO.md`).

## 2026-10-13 — Fase 13 ✅ Sortering i kolonner

- Levert: `lib/sortering.ts` (ren, uten imports): `?sorter=kolonne` / `?sorter=-kolonne`, `sorterRader` (stabil, `Intl.Collator("nb", numeric)`, tomme verdier nederst), `nesteSortering` (ny kolonne stigende, samme kolonne snur), `ariaSort`. `components/Sortering.tsx`: `useSortering` (leser `useSearchParams`, skriver med `window.history.replaceState`, ingen ny henting og ingen ny historikkrad) og `SorterKnapp` (knapp med ▲/▼/↕). `personSortering.ts` deler kolonner/verdier mellom Ukeplan og Måned (Navn, Rolle). Ansatte-fanen: alle seks overskrifter sorterbare. Admin → Ansatte: sortering på Navn, Team, Rolle, Lokasjon (navn slås opp fra id). Alle visninger deler `?sorter=`; en kolonne en visning ikke har, ignoreres der.
- Utenfor planteksten: valgt fane huskes i adressen (`?fane=`, `Tabs.tsx` + `app/page.tsx`), ellers hoppet en oppdatering tilbake til Ukeplan og sorteringen i Ansatte-fanen var ikke synlig.
- **Beslutning (bruker, layout i Admin → Ansatte):** sorteringsraden «Sorter på» virket ikke praktisk over rader som brytes (skjermbilde). Jeg foreslo nedtrekksliste eller `TODO.md`; brukeren svarte «gjør dette bedre» og sendte nytt skjermbilde. Valget ble ekte kolonner med overskrifter over fra bredde 1280 px (CSS grid på `.admin-ansattinnhold` og skjemaet), og «Sorter på»-raden beholdt for smal skjerm. Begrunnelse: overskrifter kan bare stå over «sine» kolonner når radene har kolonner.
- Funn (observert av bruker, skjermbilde): første kolonnebredder ga rader som stakk ut av den hvite rammen. Årsak er hypotese: breddene ble regnet mot en bredere ramme enn siden har (rammen ser ut til å være ca. 1100–1150 CSS-px). Kolonnene ble smalere (128/70/128/170/120/70 px, knappene 96 og 128 px), første kolonne `minmax(60px, 1fr)`, ytre `minmax(0, 1fr)`. Resultatet er ikke sett etter siste justering.
- Verifisering: brukeren ba om faseslutt uten å oppgi hva som ble prøvd; planens test (klikke «Navn», «Team», oppdatere siden) er ikke bekreftet i ord. Ikke sett: sortering i Ukeplan/Måned, Admin → Ansatte etter siste breddejustering, lange navn i smale kolonner, `aria-sort` på overskriftene med to knapper (Ukeplan/Måned), dato-sortering av «Aktiv fra»/«Aktiv til» (sorteres som tekst; riktig bare om datoene er ISO), `?fane=` sammen med `?person=`, smal-skjerm-visningen.
- Ikke kjørt: `next build`.
- Sjekk: `tsc --noEmit` og `npm run lint` rene etter den siste kodeendringen i `.tsx`/`.ts`; etterpå bare CSS (`globals.css`) og `kunnskap/`.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 6 treff. Ingen filer i `data/` ligger i git.
- STATUS: 38 linjer.

## 2026-10-13 — Fase 12 ✅ Hopp mellom ansatt på forsiden og i Admin, og bort med «Fast lokasjon»

- Levert: for administratorer er navnet i Ukeplan og Måned en lenke til `/admin/ansatte#<brukerId>`; raden i Admin utheves (`rad--uthevet`, gul bakgrunn og ramme). Hver aktive rad i Admin har «Vis i ukeplan» (`/?person=<brukerId>`): `app/page.tsx` leser `searchParams` (en `Promise`, som i `admin/logg/page.tsx`), `UkeplanClient` starter på personens team og ruller raden til midten. Nøkkelen i Ukeplan og Måned er nå `teamId-id` (som i `VaktlisteClient`). Kolonnen «Fast lokasjon» og `.col-home` (også i smal-skjerm-regelen) er fjernet fra Ukeplan; Måned hadde ingen slik kolonne, bare forklaringen «Fast lokasjon» (uendret). `erAdmin` sendes fra `page.tsx` til begge klientene.
- Valg (mitt, ikke spurt om): uthevingen i Admin leser `window.location.hash` med `useSyncExternalStore` i stedet for `:target`/effekt, fordi `:target` oppdateres ikke ved `pushState`-navigering og lint (React 19) advarer mot `setState` i effekt. Ikke prøvd mot alternativene; begrunnelsen er resonnement, ikke observasjon. Ankeret (`id`) settes bare på første rad per bruker, siden en bruker kan ha flere oppsett.
- Utenfor planen er «Fast lokasjon»-kolonnen i Ansatte-fanen (`VaktlisteClient`) beholdt; planen nevner bare Ukeplan og Måned.
- Verifisering: bruker svarte «virker» etter at jeg la fram de fire punktene i planen (lenke som admin, «Vis i ukeplan» tilbake, ren tekst som vanlig ansatt, kolonnen borte). Brukeren oppga ikke hva som ble prøvd punkt for punkt. Ikke testet av meg i nettleser. Ikke sett: lenker i Måned, person med flere oppsett (duplikat-anker), «Vis i ukeplan» for deaktivert person (raden har ingen knapp), person i annet team enn første.
- Ikke kjørt: `next build` (en kjørende `next dev` kan komme i konflikt).
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 32 treff. Ingen filer i `data/` ligger i git.
- Sjekk: `tsc --noEmit` og `npm run lint` rene (kjørt rett etter siste kodeendring; etterpå bare `kunnskap/`-filer).
- STATUS: 38 linjer.
- fase-slutt: 11:49–11:53, 4 min (inkl. ventetid på svar om plan og `TODO.md`).
## 2026-10-13 — Fase 11 ✅ Masseendring av ansatte

- Levert: Admin → Ansatte har avkrysning per aktive rad (deaktiverte har ingen), «Velg alle synlige», teller og en linje øverst med valg for team, rolle og lokasjon («uendret» er standard, rolle og lokasjon har også «Fjern») og knappene «Bruk på valgte» og «Deaktiver valgte». Handlingen `masseendreAnsatte` i `app/admin/handlinger.ts` tar flere `id` (oppsett-id) og går gjennom `utfor` og `endreVaktliste`: én revisjon, alt eller ingenting (all validering før noe endres), endringsloggen skriver én rad per berørt oppsett/bruker. Deaktivering bruker `sjekkAnsattStatus` per person, så å ta med seg selv nekter hele samlingen. `MASSE_INGEN` ligger i `lib/domene.ts`. Rader og knapper: `components/AnsattAdmin.tsx`, `.admin-masse` og `.admin-ansattrad` i `globals.css`.
- **Funn (observert, bruker meldte):** første versjon oppdaterte ikke radene etter lagring. Radenes valg er ukontrollerte (`defaultValue`), så de tar ikke imot nye verdier fra siden, og et nøkkelbytte rett etter at handlingen svarte startet radene på nytt med de gamle verdiene. Rettet: `AnsattAdmin` husker hvilke rader som ble endret og hvilken revisjon de ble sendt på, og bytter nøkkel først når siden har fått ny revisjon. Bruker bekreftet etterpå at lokasjonen bytter.
- **Funn:** en `"use server"`-fil kan bare eksportere funksjoner; konstanten `MASSE_INGEN` måtte derfor ligge i `lib/domene.ts`. Funnet av meg før kjøring (skrev feil først), ikke sett som feilmelding.
- Utover planen: layout. Etter bruker-skjermbilder lå «Lagre» og «Deaktiver» under resten av raden. Rettet to ganger i `globals.css` (rad som flex, tom `.admin-status` skjules, valg maks 200 px); bruker sa «ble bra».
- Verifisering: bruker bekreftet at lokasjonen bytter på de tre valgte. Ikke bekreftet av bruker: de tre linjene i endringsloggen, «Velg alle synlige», «Deaktiver valgte», rolle- og teamvalg, «Fjern»-valgene og feilmeldingene (ingenting valgt, deaktivere seg selv).
- Brudd: jeg kjørte `cd` i Bash i første kodeutforskning (regelen i `app/CLAUDE.md`); fanget av meg samme melding og brukte full sti etterpå.
- Ikke kjørt: `next build` (en kjørende `next dev` kan komme i konflikt).
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 9 treff. Ingen filer i `data/` ligger i git.
- Sjekk: `tsc --noEmit` og `npm run lint` grønne kl. 11:42, etter siste kodeendring (kun `kunnskap/` endret etterpå).
- STATUS: 38 linjer.
- fase-slutt: 11:40–11:42, 2 min.

## 2026-10-13 — Fase 10 ✅ Ansatte: kom inn, deaktivering og adminstatus

- Levert: skjemaversjon 5 (`SKJEMA_VERSJON`, `tilVersjon5` i `lib/domene.ts`): `Bruker` har `opprettet` (`null` = «før loggen»), `aktiv` (alle starter `true`) og `entraId` (`null`, til Fase 16). `getAnsatte` i `lib/vaktlista.ts` utelater deaktiverte, så de forsvinner fra Ukeplan, Måned, «Velg deg selv» og Ansatte-fanen, og mister admintilgang (`finnAnsatt` finner dem ikke). Admin → Ansatte (`components/AnsattAdmin.tsx`, `app/admin/ansatte/page.tsx`) leser tabellene direkte og viser «Kom inn», avkrysning «Administrator» (lagres med «Lagre» via `endreAnsatt`) og egen knapp Deaktiver/Aktiver (`settAnsattAktiv` i `app/admin/handlinger.ts`); deaktiverte ligger nederst, grået (`.admin-deaktivert`). `FELTNAVN` i `lib/endringslogg.ts` har `aktiv`, `opprettet` og `entraId`. Importskriptene skrev versjon 1 og oppgraderes ved lesing, så de er uendret.
- Utover planen: `sjekkAnsattStatus` nekter også at administratoren fjerner sin egen adminavkrysning, så ingen låser seg ute. Brukeren ble spurt i chatten om å si fra hvis det skal bort; ikke besvart.
- **Beslutning (Claude, aktiv-filter):** deaktivering fjernes i `getAnsatte`, ikke i hver visning. Begrunnelse: ett sted gir samme effekt i plan, velger og adgangssjekk, og en deaktivert admin kan ikke slippe gjennom.
- Verifisering: bruker kalte `/faseflyt:fase-slutt` etter å ha fått de tre punktene fra planen; hva som ble prøvd i nettleseren ble ikke oppgitt. Ikke sett av meg: deaktivering og aktivering i nettleser, adminavkrysning og Admin-knapp, beskjeden ved selvdeaktivering, og at siden åpner mot en datafil som ennå står på versjon 4.
- Observert (Node, oppdiktede rader): omgjøringen v4 → v5 ga versjon 5, uendret `revisjon`, `opprettet` `null`, `aktiv` `true`, `entraId` `null`; eksisterende verdier beholdt; v5 gikk gjennom uendret; selvdeaktivering og egen adminfjerning nektet, deaktivering av andre godkjent (10 av 10).
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 18 treff. Ingen filer i `data/` ligger i git.
- STATUS: 38 linjer.
- fase-slutt: 11:21–11:24, 3 min.
- Sjekk: `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring; `next build` ikke kjørt (en kjørende `next dev` kan komme i konflikt).

## 2026-10-13 — Fase 9 ✅ Full endringslogg

- Levert: `lib/endringslogg.ts` (ny) sammenligner listen før og etter hver lagring, tabell for tabell på `id`, og skriver én linje per rad som er lagt til, endret eller fjernet til `data/endringslogg.jsonl` (ikke i git). Linja har tid, hvem, tabell, rad og felt med gammel → ny verdi; navn på team, lokasjon, rolle, status, type og person er slått opp og lagret med linja, så den tåler sletting. `endreVaktliste` i `lib/lager.ts` tar kopi før `endre` og logger etter vellykket lagring; feiler loggskrivingen, er listen likevel lagret og feilen går til serverloggen. Siden `/admin/logg` (ny) med lenke i `app/admin/page.tsx`.
- Utover planen, etter ønske fra bruker under verifiseringen: loggen begrenses til en periode (åpner på «I dag», knapper for «Denne måneden», «I år» og «Hele loggen», og «Fra»/«Til»-felt; dagene regnes i norsk tid; tak på 500 linjer). Tabellvalget er en nedtrekksliste i samme skjema som datoene. Kolonnebreddene i tabellen er låst. Stiler `.logg-filter` og `.logg-tabell` i `app/globals.css`.
- Verifisert av bruker: «virker», etter at to ting var rettet på brukers tilbakemelding i nettleser: kolonnene hoppet når filteret byttet, og datofeltene sto ikke på linje.
- **Beslutning (bruker, begrense loggen):** loggen kan bli lang og skal kunne begrenses per dag, måned, år eller valgt periode. Begrunnelse: en full logg uten avgrensning blir uleselig.
- **Beslutning (bruker, tabellvalg):** nedtrekksliste i stedet for ni knapper. Begrunnelse: ryddigere.
- **Beslutning (Claude, avsender ved synk):** synk mot Entra (Fase 16) skal ha egen avsender i loggen; ført i `TODO.md` sammen med et mulig avsenderfilter. Begrunnelse: `endretAv` er id-en til valgt administrator, og en synk har ingen slik person.
- Utestet: `beregnEndringer` er ikke kjørt mot oppdiktede rader i Node (`lib/endringslogg.ts` importerer `./domene` uten filendelse, som Node ikke løser). Ikke sett i nettleser av meg: logglinjer for lagt til og fjernet rader, at en ødelagt linje i fila hoppes over, taket på 500 linjer, endring rundt midnatt norsk tid, at loggen har linjer for sletting av status/type i bruk.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 8 treff. Ingen filer i `data/` ligger i git.
- Sjekk: `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring; `next build` ikke kjørt denne fasen (en kjørende `next dev` kan komme i konflikt), sist kjørt grønt i Fase 8.
- Regel: `[bash-cd-persisterer]` (3. runde) gjort til regel i `app/CLAUDE.md`, se `laering.md`.
- `TODO.md`: «Full logg over alle endringer» fortettet til pekerlinje; to nye synk-punkter for Fase 16 ført inn.
- STATUS: 37 linjer.
- fase-slutt: ca. 11:11–11:14, 3 min

## 2026-10-13 — Fase 8 ✅ Lagret eller ikke lagret i hele Admin

- Levert: felles krok `useSkjemaStatus` og visningen `Lagringsstatus` i `components/AdminFelles.tsx`, brukt i alle fem `*Admin.tsx`-filene (ansatte, team, lokasjoner, roller, statuser og endringstyper), og stiler i `app/globals.css`. Raden husker egne startverdier; avviker feltene fra det som er lagret, får den rød kant og «Ikke lagret». Etter vellykket lagring grønn kant og «Lagret» i 4 sekunder. `key={revisjon}` er fjernet, og skjult `revisjon` tar siste verdi fra siden, så en lagring i én rad ikke visker ut en annen. `beforeunload`-advarsel mens en rad er endret.
- Verifisert av bruker: «fungerer» etter å ha endret to ansatte uten å lagre, lagret den ene og prøvd å lukke fanen.
- **Beslutning (Claude, skjemaer for «legg til»):** de får samme krok, og tømmes ved at `key` er antall rader, ikke `revisjon`. Begrunnelse: «over alt» i TODO-ønsket, og en lagring i en annen rad skal ikke tømme et halvskrevet skjema.
- Utestet i nettleser: «Lagret» som grønn kant i selve «legg til»-skjemaene, sjekkboksen «Vises i plan» som endring, sletting av rad med ulagrede endringer i en annen, normalisert navn fra serveren (sammenlignes trimmet).
- Kjent begrensning (hypotese, ikke prøvd): `beforeunload` fanger lukking av fane og adresselinje, men ikke menyvalg mellom Admin-sider i Next. Det ville avgjøres ved å bytte side med ulagret rad.
- Bruker ba om en «Lagre alle»-knapp ved mange endringer. Utenfor Fase 8; bruker førte den selv inn i `TODO.md`.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 18 treff.
- Sjekk: `tsc --noEmit` og `npm run lint` grønne etter siste kodeendring; `next build` kjørt grønt ved faseslutt (alle seks Admin-ruter og forsiden bygger), etterpå bare `kunnskap/`-filer.
- STATUS: 36 linjer.
- fase-slutt: 10:54–10:56, 2 min

## 2026-10-13 — Ny plan: Fase 8–19 (Admin-forbedringer, ansatte og Entra)

- Plan laget i planmodus på tyngste modell og godkjent av bruker. Den dekker ønskene i `TODO.md` pluss «Fast lokasjon»-kolonnen og mobilformat. Se `plan.md`, seksjonen «Admin-forbedringer, ansatte og Entra».
- **Beslutning (SR, Entra):** Entra finnes, og de ansatte ligger i en egen gruppe. Planen bygger mot Entra-innlogging og -synk og mot en database på sikt. Under utvikling brukes lokale data. Begrunnelse: appen skal i drift med ekte identitet, men tilgangene er ikke på plass ennå.
- **Beslutning (SR, vedlikeholdsmodus):** andre ser bare en melding, administratorer slipper inn. **Beslutning (SR, endringslogg):** hvem, når, før og etter, bare admin ser den. **Beslutning (SR, eldre punkter):** «Fast lokasjon» og mobilformat tas med.
- **Beslutning (Claude, logg-lager / adminstatus / deaktivering / synk-kilde):** se `plan.md` med begrunnelser.
- Funn (observert under kartleggingen): `key={revisjon}` på Admin-skjemaene nullstiller ulagrede endringer i alle rader når én rad lagres. Suksessmeldingen fra `utfor` vises aldri. Dette er grunnlaget for Fase 8.
- Funn (observert): `cd app` ble igjen stående mellom Bash-kall i fase-start. Rettet med full sti.

## 2026-10-13 — Fase 7 ✅ Ansattes team, rolle og lokasjon kan endres i Admin

- Levert: siden `/admin/ansatte` (`app/admin/ansatte/page.tsx`, `components/AnsattAdmin.tsx`), handlingen `endreAnsatt` i `app/admin/handlinger.ts` og regelen `sjekkOppsett` i `lib/domene.ts`. Én rad per oppsett med tre nedtrekkslister (team, rolle, lokasjon) og «Lagre». Knapp «Ansatte» i `/admin`, «Kommer»-linja fjernet. Ingen ny tabell, `SKJEMA_VERSJON` står på 4.
- Verifisert av bruker: «fungerer» etter å ha byttet team på en ansatt og sett personen flytte seg i Ukeplan. Endring av rolle og lokasjon er ikke bekreftet enkeltvis.
- **Beslutning (Claude, nøkkel):** skjemaene bruker oppsettets id, ikke brukerens, fordi en person kan ha flere oppsett. Begrunnelse: brukerens id ville truffet feil rad.
- **Beslutning (Claude, lokasjon):** lokasjonen er ikke bundet til personens team; listen viser teamet ved siden av navnet. Begrunnelse: planen sier ingenting om en slik kobling.
- **Beslutning (bruker, scope):** «ulagrede endringer» (rød/grønn markering over alt i Admin), full endringslogg, hopp mellom ansatt på forsiden og i Admin, og alt om ansatte og Entra-synk (se når ansatt kom inn, masseendring, deaktivering, synk-tidspunkt og tvunget synk, adminstatus) ble ført i `TODO.md` i stedet for å bygges i fasen. Begrunnelse: utenfor Fase 7.
- Funn (observert): `cd app` i ett Bash-kall ble stående til neste kall, så en `cd app` til ble kjørt i `app/app` og `git log` ga tomt svar som lignet «ingen treff». Rettet ved å kjøre på nytt med full sti.
- Sjekk: `tsc --noEmit` og `npm run lint` kjørt rene etter siste kodeendring (etterpå bare `TODO.md` og `kunnskap/`-filer). `next build` kjørt ved faseslutt: grønt, `/admin/ansatte` med i rutelista. Ikke testet mot ekte data.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 4 treff. `data/` er ikke tracket.
- Plan: Fase 7 kollapset til én linje etter klarsignal.
- STATUS: 35 linjer. fase-slutt: 10:26–10:27, 1 min (uten ventetid på brukerens klarsignal for planendringen).

## 2026-10-13 — Fase 6 ✅ Team er data og kan redigeres i Admin

- Levert: tabellen `team` (`id, name`) og `teamId` på oppsett og lokasjoner (skjemaversjon 4, `tilVersjon4` i `lib/domene.ts`), `endringer.team` fjernet. `lib/vaktlista.ts` har `getTeam()` og gir `Ansatt` både `teamId` og `team` (navnet). `lib/ukeplan.ts`: `TeamFilter` er en team-id eller `ALLE_TEAM = "*"`. Ukeplan, Måned og Ansatte får teamlisten fra `app/page.tsx`. Ansatte har ett kort per team i stedet for to faste. Admin: tre handlinger i `app/admin/handlinger.ts`, `app/admin/team/page.tsx`, `components/TeamAdmin.tsx`; `LokasjonAdmin` får team som prop.
- Verifisert av bruker: sa «ferdig» etter planens fire punkter (samme visning i Ukeplan og Måned, kortene i Ansatte, «Test» i teamvelgeren, Øst kan ikke slettes). Punktene er ikke bekreftet enkeltvis.
- **Beslutning (SR, «Begge»):** valget heter «Alle team». Begrunnelse: «Begge» blir feil med et tredje team; Ansatte-fanen brukte allerede «Alle». Eneste synlige endring for vanlige brukere.
- **Beslutning (Claude, felt og rekkefølge):** `name` som i de andre tabellene, og tabellens rekkefølge er rekkefølgen i velgeren, med Øst og Vest først. Begrunnelse: alfabetisk ville satt Vest før Øst.
- **Beslutning (Claude, `endringer.team`):** fjernes ved omgjøringen. Begrunnelse: ingenting leser det, og `arkitektur.md` sier at team utledes fra personen.
- **Beslutning (Claude, sletting):** et team kan ikke slettes mens en person eller lokasjon bruker det, og det siste teamet kan aldri slettes.
- Funn (observert): første kjøring av omgjøringstesten feilet på én sjekk. Et team skrevet «øst» på første rad ble `«øst»` i tabellen. Rettet: Øst og Vest skrives alltid slik, og testen ble grønn.
- Sjekk: omgjøringen v3 → v4 testet i Node med oppdiktede rader (11 sjekker grønne): Vest først i dataene gir likevel `ost`, `vest`; ukjent team kommer etter; rad uten team stopper omgjøringen med feil; `team` er borte fra oppsett, lokasjoner og endringer. `tsc --noEmit`, `npm run lint` og `next build` kjørt grønt etter siste kodeendring, etterpå bare `kunnskap/`-filer. Ikke testet mot ekte data.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 4 treff. `data/` og `*.xlsx` er ikke tracket.
- Plan: Fase 6 kollapset til én linje (godkjent av bruker). `.claude/settings.json` (brukerens godkjenning av `git push`) er ikke tatt med i commiten.
- STATUS: 35 linjer. fase-slutt: 09:41–09:44, 3 min.

## 2026-10-13 — Fase 5 ✅ Endringstyper og statuser kan redigeres i Admin (forbehold: omdøping av «Godkjent» ikke testet)

- Levert: tabellene `statuser` (`id, name, visesIPlan`) og `endringstyper` (`id, name, kategori`), `statusId`/`typeId` på endringene (skjemaversjon 3, `tilVersjon3` i `lib/domene.ts`), seks handlinger i `app/admin/handlinger.ts`, siden `app/admin/endringstyper/page.tsx` og `components/EndringstypeAdmin.tsx`. `lib/ukeplan.ts` leser `Endring.visesIPlan` og `Endring.kategori` i stedet for navnet «Godkjent» og navnelisten.
- Verifisert av bruker: sa «fase ok». Bruker fikk ikke sett eller testet at omdøping av «Godkjent» lar planen stå uendret; resten av verifiseringen er ikke beskrevet punkt for punkt. Det som gjenstår å se er ført som forbehold i STATUS.
- **Beslutning (Claude, datamodell):** avkrysning `visesIPlan` på status i stedet for `virkning` (`godkjent|venter|avvist`) fra arkitekturnotatet, og ingen `sortering`/`aktiv`. Begrunnelse: ukeplanen trenger bare å vite om raden skal med, og planens verifisering snakker om «vises i plan». Se `arkitektur.md`.
- **Beslutning (Claude, kategori «lokasjon»):** kategorien gir lokasjonsfarge i `classifyCelle` selv uten ny lokasjon på raden, så de tre kategoriene i notatet alle har en virkning. Omgjøringen gir aldri denne kategorien.
- Funn: `python` finnes ikke i denne Git Bash (snarveien peker til Microsoft Store), og en heredoc med flere filer feilet på tolkingen før noe ble skrevet. Filene ble skrevet med Write/Edit i stedet.
- Sjekk: omgjøringen v2 → v3 testet i Node med oppdiktede rader: «Godkjent»/«godkjent» ble én status, bare den fikk `visesIPlan`, «Syk»/«syk» ble én type med kategori fravær, tomme verdier ble `null`, og de gamle feltene `status`/`type` er borte. `tsc --noEmit`, `npm run lint` og `next build` kjørt grønt etter siste kodeendring, etterpå bare `kunnskap/`-filer. Ikke testet mot ekte data.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 7 treff. `data/` og `*.xlsx` er ikke tracket.
- STATUS: 34 linjer. fase-slutt: 09:23–09:25, 2 min.

## 2026-10-13 — Fase 4 ✅ Roller kan redigeres i Admin (forbehold: nytt navn i Ansatte ikke testet)

- Levert: tabellen `roller` og `rolleId` på oppsett (skjemaversjon 2), `oppgraderVaktliste` i `lib/domene.ts`, handlinger for roller i `app/admin/handlinger.ts`, siden `app/admin/roller/page.tsx`, `components/RolleAdmin.tsx` og delte `components/AdminFelles.tsx`. Navnesjekk, id-generering og sletting-nekt er gjort felles for lokasjoner og roller.
- Verifisert av bruker: Admin → Roller virker (vises, legge til, endre, slette). Ikke testet: at nytt rollenavn slår gjennom hos en ansatt i Ansatte; bruker fikk ikke prøvd det på en person ennå.
- **Beslutning (SR, omgjøring av datafila):** ny skjemaversjon gjøres om automatisk ved lesing (`oppgraderVaktliste`), ikke med et eget skript. Begrunnelse: ingen manuelle steg nå, og samme mekanisme brukes i Fase 5–7. Sikkerhetskopien av v1 tas ved første lagring. Se `arkitektur.md`.
- **Beslutning (Claude, skript):** `import` og `migrer` bygger v1-formatet og kaller `oppgraderVaktliste`, så rolletabellen lages bare ett sted (avvik fra planen, som ville skrive v2 direkte i importen).
- Funn: et `node`-skript med absolutt Windows-sti i `import` feiler (`ERR_UNSUPPORTED_ESM_URL_SCHEME`). Bruk `file:///C:/...`.
- Sjekk: omgjøringen er testet med oppdiktede rader: roller med ulik stor/liten bokstav slås sammen, `-`/tomt blir `null`, revisjonen beholdes og versjon 9 gir feil. `tsc --noEmit`, `npm run lint` og `next build` kjørt grønt etter siste kodeendring, etterpå bare `kunnskap/`-filer.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 7 treff. `data/` og `*.xlsx` er ikke tracket.
- STATUS: 33 linjer. fase-slutt: 09:04–09:05, 1 min.

## 2026-10-13 — Fase 3 ✅ Lokasjoner kan redigeres i Admin

- Levert: alle data ligger nå i én fil, `data/vaktliste.json` (`lib/domene.ts` regler og typer uten imports, `lib/lager.ts` atomisk lesing/skriving med revisjon og sikkerhetskopi, `lib/vaktlista.ts` leser via lageret). Admin: `app/admin/handlinger.ts` (legg til, endre, slett; admin sjekkes i hver handling), `app/admin/lokasjoner/page.tsx`, `components/LokasjonAdmin.tsx`. `npm run migrer` (`scripts/migrer-til-en-fil.mjs`) slo de fem gamle filene sammen én gang; `npm run import` skriver nå én fil og nekter å overskrive uten `--overskriv`.
- **Beslutning (bruker, kilde til lokasjonsfelt):** fanen Lokasjoner i Excel er fasit for hvilke felt en lokasjon har (navn og team), men appen leser ikke lenger fra Excel, bare fra egne filer som senere kan importeres i en database.
- **Beslutning (bruker, én fil):** enig i å slå sammen de fem filene til `data/vaktliste.json` nå, slik `arkitektur.md` sa, fordi skrivelaget ellers måtte bygges to ganger.
- **Beslutning (Claude, import-vern):** `npm run import` nekter å skrive over en eksisterende `vaktliste.json`, fordi en ny import ville fjerne Admin-endringer og `erAdministrator`. Ikke spurt om; rettes hvis uønsket.
- **Beslutning (bruker, knapp):** lenken til Lokasjoner skal være en knapp i temaets stil (`uke-btn`), ikke en tekstlenke.
- Funn (observert, bruker i nettleser og curl): «Admin ser lik ut» var ikke en gammel server. Lenken til Lokasjoner fantes i HTML-en (curl ga `href="/admin/lokasjoner"`), men en rå `<a>` har ingen farge eller understreking i dette temaet og så ut som vanlig tekst. Før det var to diagnoser (hurtigbuffer, gammel server) lagt fram uten å sammenligne skjermbildet med koden.
- Funn (observert): uke- og fanebytte virket ikke før dev-serveren ble stoppet og startet på nytt; `next build` kjørt midt i økten kompilerte uten feil. Årsaken er ukjent. Hypotese: dev-serveren hang på blandet gammel og ny kode etter at filer og data ble byttet under den. Ville avgjort av å se konsollfeilen i nettleseren før omstart, som ikke ble gjort.
- Funn (observert, `node` med påfunnet testdata): dublettsjekk uten hensyn til store/små bokstaver, id-lager (`faerder` → `faerder-2`) og nektet sletting med navn fungerer. Node skriver en ufarlig modultype-advarsel når `.ts` importeres.
- Ikke testet: to faner som endrer samtidig (revisjonsfeilen), ny lagring ved låst fil (`EPERM`-forsøk) og opprydding av sikkerhetskopier over 20. Bruker godkjente fasen etter å ha prøvd siden; enkeltpunktene i verifiseringen ble ikke bekreftet hver for seg.
- Fasesnitt: fikk plass i én økt uten `/compact`.
- Sjekk ved faseslutt: `npx tsc --noEmit` og `npm run lint` kjørt etter siste kodeendring, begge rene. `.claude/settings.json` har bare to nye tillatelser (`tsc`, `lint`), ingen brukersti. STATUS: 35 linjer.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 3 treff. Ingen filer i `data/` er sporet av git.
- fase-slutt: 08:48–08:52, 4 min (inkluderer ventetid på svar om plankollaps).

## 2026-09-30 (kveldsøkt) — Admin planlagt, Fase 2 ✅ og Fase 1 ✅ (mobilvisning utsatt)

- Levert: plan for admin-grensesnitt godkjent (Fase 2–7 i `plan.md`, ny datamodell i `arkitektur.md`). Fase 2 kodet: identitetsvelger (`components/IdentitetsVelger.tsx`, kapsel `vaktliste-identitet`, `lib/identitet.ts`), `erAdministrator` på bruker (`lib/vaktlista.ts`), fanene velges på serveren i `app/page.tsx` (Ansatte-fane bare for admin), `/admin` (`app/admin/page.tsx`) som sender andre tilbake til forsiden.
- **Beslutning (bruker, ramme):** appen får en egen datamodell og kopierer ikke Excel. Excel blir en engangsinnlasting. Begrunnelse fra bruker: «vi skal bygge noe nytt, men med samme funksjonalitet». Claude hadde først lagt til grunn at Excel fortsatt var fasit; rettet underveis.
- **Beslutning (bruker, admintilgang):** eget felt på brukeren, atskilt fra jobbrolle. Ståle og Espen er administratorer, alle andre ansatt.
- **Beslutning (bruker, sletting):** nektes når raden er i bruk, med beskjed om hvem som bruker den.
- **Beslutning (bruker, Ansatte i admin):** kan endre rolle og team. Legge til og fjerne kommer fra Entra.
- **Beslutning (bruker, Fast lokasjon):** ikke egen kolonne, det er standard arbeidssted og vises allerede i cellene. Ført i `TODO.md` punkt 2.
- **Beslutning (bruker, e-post i historikken):** jobbadressen skulle ut av commitene, siden GitHub ikke skal brukes i fylket. Seks commits omskrevet lokalt med `git filter-branch`.
- Funn (observert, git): etter omskrivingen spriker lokal historikk og `origin/master` 6/6. `git push --force-with-lease` ble blokkert av Claude Code. GitHub har fortsatt de gamle commitene med jobbadressen.
- Funn (observert, måling): Node 26.8.2 på denne maskinen importerer `.ts` direkte. STATUS påsto det motsatte; rettet. Det lar valideringen deles mellom appen og innlastingsskriptet.
- Funn (observert, curl mot kjørende dev-server): velgeren rendres, og `/admin` svarer 307 uten valgt identitet.
- Funn (observert, måling): «admin fungerer ikke» var ikke kode. `data/brukere.json` var ikke lagret i editoren. Etter lagring ga `node -e` 3 av 47 med `erAdministrator`, og curl mot dev-serveren ga 200 på `/admin` med kapsel `stale` og 307 uten kapsel. Ingen kodeendring.
- **Beslutning (bruker, Fase 2):** godkjent etter gjennomgang i nettleseren («Dette er ok»). Jens står som administrator sammen med Espen og Ståle; spørsmålet om det var tilsiktet ble ikke besvart uttrykkelig, og er ført som stående.
- **Beslutning (bruker, Fase 1):** avsluttes sammen med Fase 2. Mobilvisningen trenger et bedre format; utsatt (forslag til `TODO.md`). Bruker rapporterte ikke verifiseringspunktene 3–6 og 8 ett og ett; avslutningen bygger på beskjeden «avslutt Fase 1 og 2».
- Sjekk: `tsc --noEmit` og `npm run lint` kjørt grønne tidligere i økten, etterpå bare `kunnskap/`-filer; ikke kjørt på nytt. `npm run import` ble ikke kjørt (skriver over admin-flagget).
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 15 treff. `data/` har 0 tracket filer. Ny STATUS: 36 linjer. `plan.md` er 173 linjer (over 150) og kollapses når Fase 1 er godkjent for kollaps.
- fase-slutt: 21:34–21:35, 1 min.

## 2026-09-30 (senere økt) — Fase 1: data normalisert, månedsvisning, layout

- Levert: `data/*.json` er nå fem tabeller (`brukere`, `lokasjoner`, `oppsett`, `endringer`, `dager`) med `id` og fremmednøkler, `null` for tomt og `HH:MM` for klokkeslett. `lib/vaktlista.ts` slår dem sammen til `Ansatt`/`Endring` for UI. Sammenlignet mot gamle filer: 0 avvik (47 ansatte, 303 endringer).
- Levert: fane «Måned» (`components/MaanedClient.tsx`, `beregnMaaned` i `lib/ukeplan.ts`); ukeplanen bruker nå de samme cellefunksjonene. Fast tabellbredde (`table-layout: fixed`), `width: 100%` på `.page-shell`, mobilregler. «Kilde: Excel-arbeidsbok» fjernet, ny overskrift «Digital Støtte - Vaktlista».
- **Beslutning (bruker, team):** team er bare Øst og Vest; importen stopper på alt annet.
- **Beslutning (bruker, lokasjoner):** bare lokasjoner fra arket Lokasjoner gjelder, PUS fjernes (tre endringer får lokasjonId null). Tolkning av «stor forbokstav»: navn får stor forbokstav ved import.
- Funn (belegg: importkjøring): Excel bruker rad-id-er flere ganger (OST-0232 tre ganger, 0234, 0238, 0241). Nye rader får suffiks; bør rettes i Excel.
- Funn (hypotese, ikke sett i nettleser): sidebredden var ulik mellom faner fordi `body` er flex-kolonne og `margin: 0 auto` krymper siden til innholdet. `width: 100%` er lagt til, men brukeren har ikke bekreftet.
- Remote satt opp: https://github.com/Redubal/Vaktliste_digitalstotte.git, `master` pushet (7b08521 = data-normaliseringen).
- Verifisert hos bruker i økten etterpå (se innslaget over), unntatt mobilvisning: den trenger et bedre format.
- Sjekk: `tsc --noEmit`, `npm run lint` og `npm run build` grønne etter månedsvisningen; etterpå bare overskriftstekst, der `tsc` og `lint` ble kjørt grønt. Ikke kjørt på nytt i fase-slutt.
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 2 treff. `data/` og `*.xlsx` er ikke tracket. Ny STATUS: 33 linjer.
- fase-slutt: 15:12–15:14, 2 min.
## 2026-09-30 — Fase 1: Ukeplan per team (skrevet, verifisering delvis hos bruker)

**Etter verifisering (senere økt, samme dag):**
- Bruker åpnet siden og så ukeplanen for Øst i uke 39: celler lå stablet loddrett i første dagskolonne. Årsak: `.celle` (`display: flex`) lå på `<td>`. Rettet ved å legge klassen på en `div` inni cellen (`components/UkeplanClient.tsx`). Bruker bekreftet «ble bra» på nytt skjermbilde.
- Observert: merknaden «Samling 1.år bli kjent» over 23. sep kommer fra arket `Dager` i Excel (via `data/dager.json`). Bruker hadde selv lagt den inn.
- Faseflyt-oppsettet ble fullført i `app/`: `sikkerhet.md`, `arkitektur.md`, `TODO.md`, `.claude/settings.json`, `.claude/skills/README.md`, faseflyt-avsnitt i `CLAUDE.md`.
- **Beslutning (SR, database 2026-09-30):** ingen databasetilgang nå, så JSON i `data/` inntil videre. Blokkerer bare Fase 3.
- **Beslutning (Claude, persondata):** løsningen skal ende med reelle persondata i appen, så den er ikke en ren prototype. Behandlingsgrunnlag er ført som `TODO.md` punkt 1. Persondata-deny-settet (`Read(data/**)` m.fl.) er tilbudt, ikke skrevet.
- Ikke verifisert: uke 32 (Syk), uke 41, team Vest/Begge, Ansatte-fanen, årsskifte 2026→2027. Bruker svarte at de ikke hadde fått beskjed om å sjekke dette (økten startet i mappa over `app/`, så STATUS-listen ble aldri lest). Fasen kollapses derfor ikke i planen ennå.
- Funn: fase-start ble kjørt fra mappa over `app/` og fant ingen STATUS. Repoet og `kunnskap/` ligger i `app/`.
- Sjekk: `tsc --noEmit` og `npm run lint` rene rett etter celle-rettelsen; `npm run build` kjørt i fase-slutt: OK (kompilerte, 3 sider generert).
- Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 2 treff. `data/` og `*.xlsx` er ikke tracket. Ny STATUS: 32 linjer.

**Levert:**
- `npm run import` (`scripts/import-excel.mjs`) leser Excel-fila og skriver `data/ansatte|endringer|dager|lokasjoner.json` (47 / 303 / 20 / 14 rader).
- `lib/uker.ts` (ISO-uke), `lib/ukeplan.ts` (fletter fast lokasjon + godkjente endringer per dag), `lib/vaktlista.ts` utvidet.
- UI: tabs Ukeplan/Ansatte, team-velger Øst/Vest/Begge, uke-navigering, skolekalender-merknader, fargekodede celler.
- Gammel `data/vaktliste.json` fjernet (erstattet av `ansatte.json`).

**Beslutninger:**
- **Beslutning (SR, formål):** katalog + ukeplan-visning; appen skal erstatte Excel, ikke kopiere den.
- **Beslutning (SR, database):** utsatt, SR sjekker om SQLite kan installeres. Fase 1 bruker JSON.
- **Beslutning (SR, omfang/auth):** faseinndelt, Fase 1 uten «Min plan»; «Velg deg selv»-dropdown til Entra SSO kommer (Fase 4).
- **Beslutning (Claude, datamodell):** ukeplanen regnes ut fra Ansatte + Endringer + Dager, ikke importert fra Excels avledede Ukeplan-ark.
- **Beslutning (Claude, persondata):** `/data/` og `*.xlsx` lagt i `.gitignore` fordi filene har navn, e-post og sykefravær. Ny klone må kjøre `npm run import` med Excel-fila i `app/`. Appen viser tom liste uten data. SR bør bekrefte eller si fra om data skal versjoneres på annen måte.

**Funn:**
- Excel-fila ligger i `app/`, ikke ett nivå opp; planen hadde feil sti, skriptet bruker riktig.
- Én endring (VEST-0044) gjelder Ismail (Øst-ansatt) på Vest-arket; personId slås derfor opp på navn (navn er unike, 0 duplikater).
- ISO-uke ga først feil (uke 40 for 5. okt); rettet til `Math.ceil` med torsdagsregelen og testet mot 8 datoer inkl. årsskifte.
- Observert: siden viser Uke 40 (28. sep – 2. okt) med Ismail på Nøtterøy og Lukasz «Fri» (OST-0234). Uke 41-merknad og uke 32-«Syk» er IKKE observert i nettleser; ad hoc-test i Node feilet (importer uten filendelse), så det gjenstår hos bruker.
- Dev-server: port 3000 var alt i bruk av en tidligere server (PID 20388).

**Sjekk:** `npx tsc --noEmit` 0 feil, `npm run lint` rent, `npm run build` OK (kl. ca. 13:25, etterpå bare `.gitignore` og `kunnskap/`).

Rask sikkerhetssjekk: env-filer 0, fødselsnummer-mønster 0, nøkkel-mønster 0, kontrollsøk 3 treff. Ingen data-uttrekk tracket (`data/`, `*.xlsx`); søket dekket staget innhold.

STATUS: 31 linjer. `plan.md`: 158 linjer (over 100–150; Fase 1 kollapses etter verifisering).
fase-slutt: 13:29–13:31, ca. 2 min. Ingen remote, så ingen push.
