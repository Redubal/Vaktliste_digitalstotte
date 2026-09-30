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
- **Fase 3 — Lokasjoner kan redigeres.** Skrivelaget bygges her (`lib/domene.ts`, `lib/lager.ts`, `app/admin/handlinger.ts`). Verifisering: legg til, endre og slett en lokasjon i Admin; endringen vises i Ansatte; sletting av en lokasjon i bruk nektes med beskjed om hvem som bruker den.
- **Fase 4 — Roller.** Ny tabell, `rolleId` på oppsett. Verifisering: rollene fra dagens data vises i Admin; nytt navn slår gjennom i Ansatte; rolle i bruk kan ikke slettes.
- **Fase 5 — Endringstyper og statuser.** Rører ukeplanberegningen (`lib/ukeplan.ts:58` og `:129`). Verifisering: ukeplanen ser ut som før; døp om «Godkjent» og planen er uendret; skru av «vises i plan» og radene forsvinner; ny type med kategori «fravær» får fri-farge.
- **Fase 6 — Team.** Tyngst: `Team` fra union til data, «Begge» blir filter. Berører `vaktlista.ts`, `ukeplan.ts`, begge klientfilene og de to team-kortene i `VaktlisteClient.tsx`. Felle: objektnøkkel `acc[person.team]` ved `:28` må bli `team.id`. Verifisering: alt ser ut som før; nytt tredje team i Admin dukker opp i teamvelgeren.
- **Fase 7 — Ansattes rolle, team og lokasjon.** Verifisering: endre team på en ansatt, og personen flytter seg i Ukeplan med en gang.

---

**Fase 1 ✅ 2026-09-30** — ukeplan per team, Måned og normaliserte data; detaljer i logg. Mobilvisning utsatt, se `TODO.md` punkt 3.
