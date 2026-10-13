# Vaktliste digitale tjenester — Faseplan

## Kontekst

Excel-fila `Vaktliste_2026-2027_Team_Ost_og_Vest.xlsx` skal på sikt erstattes av
en web-løsning som fungerer bedre enn Excel: mobilvennlig for de ansatte,
riktig plan til enhver tid (ferie/syk/kurs flettes inn automatisk),
administratorer kan vedlikeholde metadata, og på sikt SSO-innlogging via
Vestfold fylkes Entra ID.

Prosjektet ligger allerede som en Next.js 16 / React 19 / Tailwind v4-app
under [app/](app/), med en ren ansatt-katalog som første steg (leser
[app/data/vaktliste.json](app/data/vaktliste.json)). Denne planen beskriver
Fase 1 av totalt fem, og skisserer de senere fasene så vi kan validere at
Fase 1 ikke maler oss inn i et hjørne.

## Avklarte beslutninger (fra grilling)

- **Beslutning (SR, formål):** Kombinasjon: ansatt-katalog + ukeplan-visning — appen skal på sikt erstatte Excel, ikke bare visualisere den.
- **Beslutning (SR, database):** Utsettes — bruker sjekker om SQLite/Node-pakker kan installeres på Vestfold-maskinen. Fase 1 bruker JSON-filer, database introduseres i Fase 3.
- **Beslutning (SR, database 2026-09-30):** Ingen tilgang til database nå, så data lagres i JSON-filer inntil videre. Fase 3 (SQLite/Prisma) kan ikke startes før tilgang er avklart; Fase 2 er upåvirket.
- **Beslutning (SR, omfang):** Bygges i faser (Fase 1 MVP først), ikke alt på én gang.
- **Beslutning (SR, Fase 1-scope):** Bare ukeplan-visning per team i Fase 1. «Min plan», admin-CRUD, endringsflyt og SSO kommer i senere faser.
- **Beslutning (SR, auth Fase 1+2):** «Velg deg selv»-dropdown til Entra SSO er på plass. Enklest å teste med flere identiteter under utvikling.
- **Beslutning (Claude, datamodell):** Ukeplanen regnes ut i appen fra `Ansatte` + `Endringer` + `Dager` — vi importerer ikke de avledede Ukeplan-cellene fra Excel, kun kildedataene. Excel-arket gjør det samme via formler.

## Total faseoversikt (så vi ikke maler oss i et hjørne)

| Fase | Innhold | Datalag |
|---|---|---|
| **1 (denne planen)** | Ukeplan per team, uke-velger, flettede endringer, skolekalender-merknader. Beholder ansatt-katalog. | JSON i `data/` |
| 2 | «Min plan»-visning + «Velg deg selv»-dropdown. Uke- og månedsvisning per person. | JSON |
| 3 | SQLite + Prisma. Admin-CRUD (personer, lokasjoner, roller). Endringsflyt (bruker registrerer, admin godkjenner). | SQLite |
| 4 | Entra ID SSO (NextAuth med Azure AD-provider). Bytter dropdown mot ekte identitet. Admin-gruppe styres i Entra. | SQLite |
| 5 | Deploy (Azure App Service eller lignende Vestfold-godkjent hosting). Backup-strategi for SQLite-fila, eller migrering til PostgreSQL. | SQLite → evt. Postgres |

### Admin-fasene (godkjent 2026-09-30, erstatter rekkefølgen i tabellen over)

**Beslutning (bruker, ramme):** appen får egen datamodell (se `arkitektur.md`), Excel er en engangsinnlasting. Gamle Fase 2 («Min plan») skyves bak disse, og Fase 3–5 i tabellen (SQLite, Entra, deploy) kommer etterpå.
Ansatt ser bare Ukeplan og Måned. Administrator (Ståle, Espen) ser i tillegg Ansatte og Admin. Legge til endringer tas senere.

- **Fase 2 ✅ 2026-09-30** — Hvem er du (identitetsvelger, serverstyrte faner, `/admin`); detaljer i logg.
- **Fase 3 ✅ 2026-10-13** — Lokasjoner kan redigeres i Admin; detaljer i logg.
- **Fase 4 ✅ 2026-10-13** — Roller i Admin; detaljer i logg. Forbehold: nytt rollenavn i Ansatte ikke testet.
- **Fase 5 ✅ 2026-10-13** — Endringstyper og statuser kan redigeres i Admin; detaljer i logg. Forbehold: omdøping av «Godkjent» ikke sett.
- **Fase 6 ✅ 2026-10-13** — Team er data og kan redigeres i Admin; detaljer i logg.
- **Fase 7 ✅ 2026-10-13** — Ansattes team, rolle og lokasjon kan endres i Admin; detaljer i logg.

### Admin-forbedringer, ansatte og Entra (godkjent 2026-10-13)

Ønskene i `TODO.md` etter Fase 7, pluss to eldre punkter («Fast lokasjon»-kolonnen og mobilformat).

Funn fra kartleggingen (2026-10-13) som styrer snittet:
- Admin-skjemaene pakkes i `<div key={revisjon}>`, så **enhver lagring nullstiller ulagrede endringer i
  alle andre rader**. Suksessmeldingen fra `utfor` returneres, men vises aldri.
- All skriving går gjennom `endreVaktliste` i `lib/lager.ts`: én plass å fange endringsloggen.
- `Bruker` har `id, name, upn, erAdministrator?` — ingen `opprettet`, `aktiv` eller Entra-id.
  Nye felt = `SKJEMA_VERSJON` 5 + `tilVersjon5` i `lib/domene.ts` (og tom-struktur i importskriptene).
- Ingen auth-pakker, ingen `proxy.ts`. «Velg deg selv» (`lib/identitet.ts`) er ikke sikkerhet.

**Avklarte beslutninger:**
- **Beslutning (SR, Entra 2026-10-13):** Entra finnes, og de ansatte ligger i en egen gruppe. Planen
  bygger mot Entra (innlogging og synk), og data skal på sikt over i en database. Under utvikling
  brukes lokale data.
- **Beslutning (SR, vedlikeholdsmodus):** andre ser bare en melding; administratorer bruker siden som
  vanlig og kan skru modusen av.
- **Beslutning (SR, endringslogg):** hvem, når, gammel og ny verdi per lagring; bare admin ser den.
- **Beslutning (SR, eldre punkter):** «Fast lokasjon»-kolonnen og mobilformatet tas med.
- **Beslutning (Claude, logg-lager):** loggen ligger i egen fil `data/endringslogg.jsonl` (én linje per
  endring, bare tillegg), ikke i `vaktliste.json`. Begrunnelse: den vokser uten tak og skal ikke
  blåse opp hver sikkerhetskopi. Blir en tabell når databasen kommer.
- **Beslutning (Claude, adminstatus):** settes i appen (`erAdministrator`) inntil videre. Kan flyttes
  til en Entra-gruppe i innloggingsfasen hvis brukeren vil. Begrunnelse: TODO ber om å kunne sette
  den i Admin.
- **Beslutning (Claude, deaktivering):** ansatte slettes aldri, de får `aktiv: false` (som
  `arkitektur.md` alt sier). Deaktiverte vises ikke i Ukeplan, Måned, Ansatte-fanen eller velgeren.
  Man kan ikke deaktivere seg selv eller fjerne siste aktive administrator.
- **Beslutning (Claude, synk-kilde):** synken skrives mot et grensesnitt med to kilder: en lokal
  testfil med oppdiktede personer (dev) og Microsoft Graph (ekte). Slik kan alt unntatt selve
  Graph-kallet bygges og ses før tilgangen er på plass.
- **Sperre (fra før):** reelle persondata ut til andre enn utvikler krever behandlingsgrunnlag
  (`TODO.md` punkt 1). Gjelder innloggings-, Graph- og databasefasene.

Fase 8–15 er mekaniske (Sonnet). Fase 16–19 er arkitektur/sikkerhet (tyngste modell).
Sjekk per fase: `tsc --noEmit`, `npm run lint` og `next build` grønne ved faseslutt; skjemaomgjøringer
testes med oppdiktede rader i Node, aldri mot `data/`.

Fase 8 ✅ 2026-10-13 — detaljer i logg

Fase 9 ✅ 2026-10-13 — detaljer i logg

Fase 10 ✅ 2026-10-13 — detaljer i logg

Fase 11 ✅ 2026-10-13 — detaljer i logg

Fase 12 ✅ 2026-10-13 — detaljer i logg

**Fase 13 — Sortering i kolonner.**
Klikkbare kolonneoverskrifter (stigende/synkende, pil og `aria-sort`) i Ansatte-fanen
(`components/VaktlisteClient.tsx`) og i Admin → Ansatte; Ukeplan og Måned kan sorteres på navn og rolle.
Valget huskes i adressen (`?sorter=`), så det tåler oppdatering. Felles hjelpefunksjon i `lib/`.
**Verifisering:** du klikker «Navn» i Ansatte-fanen og ser listen snu, klikker «Team» og ser den
gruppert; du oppdaterer siden og sorteringen står.

**Fase 14 — Vedlikeholdsmodus.**
`innstillinger` i `vaktliste.json` (`vedlikehold: boolean`, `melding`). `app/layout.tsx` viser bare
meldingen for alle som ikke er administrator; `utfor` nekter skriving for andre. Bryter i `/admin`.
Forbehold til Entra er på plass: hvem som helst kan velge en administrator i «Velg deg selv».
**Verifisering:** du skrur på vedlikehold, velger deg selv som vanlig ansatt og ser bare meldingen;
som administrator ser du siden som vanlig med et gult bånd øverst; du skrur av og alt er tilbake.

**Fase 15 — Bedre format på mobil.**
Under en viss bredde blir Ukeplan og Måned en liste per person (kort med dagene under hverandre) i
stedet for en tabell som scroller sidelengs. Formatet velges sammen med deg ved faseoppstart, med to
skisser å velge mellom.
**Verifisering:** du gjør nettleservinduet smalt (eller åpner på mobil) og ser Ukeplan og Måned uten
sidelengs scrolling, med alle dagene lesbare.

**Fase 16 — Synk av ansatte, med lokal testkilde (tyngste modell).**
`lib/synk.ts` med kilde-grensesnitt; testkilden leser `data/entra-test.json` (oppdiktede personer).
Regler: match på `entraId`, deretter `upn`; ny person → `opprettet` = nå, havner under «Nye, mangler
team» i Admin; borte fra gruppen → `aktiv: false`, aldri slettet. Innstillinger: tidspunkt og
hyppighet (f.eks. daglig kl. 06), sist kjørt og utfall; «Synk nå»-knapp. Kjøres når en side lastes og
siste synk er eldre enn intervallet (ingen egen tidsplanlegger på serveren).
**Verifisering:** du legger en oppdiktet person til i testfila, trykker «Synk nå» og ser personen under
«Nye» med dagens dato; du fjerner en person fra fila, synker og ser vedkommende deaktivert; «Sist
synket» viser klokkeslettet.

**Fase 17 — Innlogging med Entra (tyngste modell, krever app-registrering).**
Erstatter «Velg deg selv» i drift; `AUTH_MODUS=lokal` beholder velgeren under utvikling. Bibliotek
(Auth.js med Entra-leverandør eller `@azure/msal-node`) velges ved faseoppstart etter å ha lest
dokumentasjonen for Next 16. Innlogget person kobles til `Bruker` på `entraId`/`upn`. Hemmeligheter
legges i `.env` av deg — Claude leser den aldri. Sikkerhetsgjennomgang mot `kunnskap/sikkerhet.md`.
**Forutsetning:** app-registrering med omdirigering til `http://localhost:3000`, klient-id, tenant-id
og hemmelighet.
**Verifisering:** du åpner appen, sendes til Microsoft-innlogging, kommer tilbake og ser navnet ditt
øverst uten velger; en kollega uten adminstatus ser ikke Admin.

**Fase 18 — Synk mot ekte Entra-gruppe (tyngste modell, krever Graph-tilgang).**
Graph-kilden: `GET /groups/{id}/members` med `id, displayName, userPrincipalName, mail`; app-tillatelse
`GroupMember.Read.All` med admin-samtykke. Gruppe-id i `.env`. Filterstrenger bygges bare av serververdier.
**Forutsetning:** tillatelsen er gitt; behandlingsgrunnlag avklart (`TODO.md` punkt 1).
**Verifisering:** du trykker «Synk nå» og ser antallet ansatte stemme med gruppen i Entra, og at en
person du vet er ny, står under «Nye».

**Fase 19 — Data over i database (tyngste modell, sperret til tilgang er gitt).**
`lib/lager.ts` er eneste vei inn og ut, så byttet holdes der: tabellene i `vaktliste.json` og
endringsloggen blir tabeller. Databasetype (SQLite, Azure SQL, PostgreSQL) bestemmes når tilgangen
er kjent; JSON-fila brukes fortsatt under utvikling hvis ønsket.
**Verifisering:** du ser samme Ukeplan og samme endringslogg som før flyttingen, og en endring i Admin
står der etter at appen er startet på nytt.

Ikke med: drift/hosting (gamle Fase 5) og «Min plan»; de planlegges når Fase 17 er levert.

---

**Fase 1 ✅ 2026-09-30** — ukeplan per team, Måned og normaliserte data; detaljer i logg. Mobilvisning utsatt, se `TODO.md` punkt 3.
