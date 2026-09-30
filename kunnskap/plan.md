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

---

## Fase 1 — Ukeplan-visning per team (denne planen)

### Mål

Vise ukeplanen for team Øst, Vest og Begge i en Excel-liknende tabell (personer i rader, dager i kolonner), for en valgt uke, med godkjente endringer flettet inn i cellene og skolekalender-merknader over dagene. Ansatt-katalogen fra i dag beholdes som en egen fane.

### Datamodell (som JSON i `app/data/`)

Fire filer, alle genererte fra Excel-fila én gang av et importskript:

- `ansatte.json` — utvider dagens `vaktliste.json` med `id` (stabil kortnøkkel, f.eks. `ost-ismail`).
- `endringer.json` — alle rader fra `Endringer Øst` + `Endringer Vest` sammenslått, med `status`, `person` (matches til `ansatte.id` ved navn), `fraDato`, `tilDato`, `type`, `nyLokasjon`, `kommentar`, `team`.
- `dager.json` — skolekalender-merknader fra `Dager`-arket: `{fraDato, tilDato, kommentar}[]`.
- `lokasjoner.json` — kanonisk lokasjonsliste fra `Lokasjoner`-arket med team-tilhørighet.

Excel-datoer (serial numbers som `46300`) konverteres til ISO `YYYY-MM-DD` under import.

### Ukeplan-beregning (kjernen)

Ny fil [app/lib/ukeplan.ts](app/lib/ukeplan.ts) med:

```ts
type Ukeplan = {
  isoUke: number;      // 1..53
  aar: number;
  dager: Date[];       // man..fre (5 dager)
  rader: Rad[];
};
type Rad = {
  person: Ansatt;
  celler: Celle[];     // én per dag i uka
};
type Celle = {
  lokasjon: string;    // hjemme-lokasjon, endringens nyLokasjon, eller endringstype-tekst («Ferie», «Syk»)
  endring?: Endring;   // hvis en godkjent endring overskygger hjemme-lokasjonen
};
```

Regelen per celle: hvis det finnes en `Godkjent` endring for personen som overlapper dagen, brukes den (`nyLokasjon` hvis satt, ellers `type`-teksten som «Ferie», «Syk», …). Ellers brukes personens `homeLocation`.

### Filstruktur som legges til / endres

```
app/
  scripts/
    import-excel.mjs          # ny — kjøres med `npm run import`
  data/
    ansatte.json              # erstatter vaktliste.json (samme innhold + id)
    endringer.json            # ny
    dager.json                # ny
    lokasjoner.json           # ny
  lib/
    vaktlista.ts              # utvid: getEmployees, getEndringer, getDager, getLokasjoner
    ukeplan.ts                # ny — beregner ukeplan for gitt team + uke
    uker.ts                   # ny — ISO-ukehjelpere (man-startet uke, ukenr, dato→uke)
  app/
    page.tsx                  # ny landingsside med tabs: «Ukeplan» (default) og «Ansatte»
    ukeplan/
      page.tsx                # server-render Ukeplan-visning
  components/
    UkeplanClient.tsx         # ny — team-velger, uke-navigering
    VaktlisteClient.tsx       # eksisterer — flyttes inn under Ansatte-tab
    Tabs.tsx                  # ny — enkel tab-komponent
  package.json                # nytt script: "import": "node scripts/import-excel.mjs"
```

### Import-skript

`scripts/import-excel.mjs` bruker den allerede installerte `xlsx`-pakken. Det:

1. Leser `../Vaktliste_2026-2027_Team_Ost_og_Vest.xlsx` (relativ til `app/`).
2. Parser arkene `Ansatte`, `Endringer Øst`, `Endringer Vest`, `Dager`, `Lokasjoner`.
3. Normaliserer Excel-datoer via `XLSX.SSF.parse_date_code(serial)` → ISO-streng.
4. Genererer stabile IDer for personer (`{team-slug}-{navn-slug}`).
5. Slår sammen begge endringsark og setter `team`-felt basert på hvilket ark det kom fra.
6. Skriver de fire JSON-filene til `app/data/` med `JSON.stringify(_, null, 2)` for lesbar diff.

Skriptet er idempotent — kjøres på nytt hver gang Excel oppdateres. Excel-fila forblir source of truth i Fase 1.

### UI-detaljer

- **Landingsside:** Tabs øverst — «Ukeplan» (default), «Ansatte». Ingen egen ruter-endring; tabs = klient-state.
- **Ukeplan-visning:**
  - Team-velger (Øst / Vest / Begge) — dropdown.
  - Uke-navigering: `← forrige uke | Uke 41 · 5.–9. oktober 2026 | neste uke →`. «I dag»-knapp hopper til inneværende uke.
  - Skolekalender-merknader vises som badge i dag-header (f.eks. «Høstferie skole» over de aktuelle kolonnene).
  - Tabellen: rader = personer sortert på navn innen team, kolonner = mandag–fredag. Celle viser lokasjon; endring gir egen badge-styling med endringstype som tooltip.
  - «Fridag / helligdag» og typiske endringstyper får farge-kodet badge (bruker eksisterende `--accent`-palett).
- **Ansatte-tab:** Uendret [VaktlisteClient.tsx](app/components/VaktlisteClient.tsx) — flyttes bare bak en tab.
- **Metadata:** Oppdater [layout.tsx](app/app/layout.tsx) `title` fra «Create Next App» til «Vaktliste — Digitale tjenester».

### Ting Fase 1 IKKE gjør

- Ingen «Min plan»-visning (Fase 2).
- Ingen dropdown for «Velg deg selv» ennå (kommer med Fase 2 der den faktisk brukes).
- Ingen database (Fase 3).
- Ingen registrering/godkjenning av endringer i UI (Fase 3).
- Ingen redigering av personer/lokasjoner (Fase 3).
- Ingen innlogging (Fase 4).

### Gjenbruk fra dagens kode

- [app/lib/vaktlista.ts:getEmployees](app/lib/vaktlista.ts) — utvides, ikke skrives om. Legger til `id` og laster de nye JSON-filene med samme mønster (`fs.readFileSync` + `JSON.parse`).
- [app/components/VaktlisteClient.tsx](app/components/VaktlisteClient.tsx) — brukes uendret som Ansatte-tab.
- [app/app/globals.css](app/app/globals.css) — hele palettet (`--primary`, `--accent`, `--panel`, `.stat-card`, `.panel`, `.status-tag`) gjenbrukes. Vi legger bare til nye klasser for ukeplan-tabellen (kompakt celle-visning, sticky navn-kolonne).

### Verifisering

1. **Import:** Kjør `npm run import` i `app/`. Kontroller at de fire JSON-filene genereres og at `endringer.json` inneholder rader fra begge team med gjenkjennelige `person`-referanser (navn matcher en `ansatte.id`).
2. **Dev-server:** `npm run dev`, åpne http://localhost:3000.
3. **Ukeplan-tab (default):** Uke 41 2026 (03.-09. oktober) skal vise «Høstferie skole»-badge over hele uka og alle Øst-ansatte på sine faste lokasjoner. Bytt team til Vest, deretter Begge, og bekreft at radene endres.
4. **Endring flettes inn:** Naviger til en uke der en godkjent endring finnes (f.eks. Lukasz syk 03.-19. aug 2026, `OST-0001`). Cellene for Lukasz i den perioden skal vise «Syk» med badge-styling, ikke «Fylkeshuset».
5. **Ansatte-tab:** Klikk «Ansatte». Dagens visning (søk, team-filter, statistikk-kort, tabell) skal fungere uendret.
6. **Uke-navigering:** «Forrige/neste uke» beveger seg riktig én uke om gangen. «I dag»-knappen hopper til inneværende ISO-uke. Prøv å navigere over årsskiftet 2026→2027 for å sjekke ISO-uke-håndtering.
7. **Type-check:** `npx tsc --noEmit` og `npm run lint` uten feil.

### Åpent, følges opp i Fase 2+

- Database-avgjørelse (bruker sjekker installasjonsmulighet).
- Om «Endringer» med status `Forespurt` skal vises i Fase 1 (foreløpig nei — bare `Godkjent` teller). Kan tas som en enkel UI-toggle senere.
- Ny lokasjon i Excel-arket `Lokasjoner` inkluderer varianter som «Fylkeshuset (bakvakt)». Vi importerer dem som separate lokasjoner uten spesialbehandling i Fase 1.
