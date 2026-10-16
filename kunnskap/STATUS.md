# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–21, 22A, 22B, 23–31 og 35–47 ✅. **47** (siden hopper ikke sidelengs ved fanebytte, `scrollbar-gutter: stable` på `html`) verifisert av Ståle 2026-10-15. **46** (Docker) verifisert av Ståle 2026-10-15 på hjemme-pc: bygg, oppstart uten feilmeldinger, innlogging med kopiert database, `up` og `down` fungerer. MySQL i Docker er ikke fasesatt. Fra eldre faser (detaljer i loggen): 42 mobilkalender uten fyll, vedlikehold; 41 måned over årsskiftet; 40 smalt vindu; 37–38 overlapp; 30 automatisk synk; 28 ekte telefon/pad; 26 radtellingen Excel «Dager» mot appen.
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.4.0 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4, Node 26.8.2 med innebygd `node:sqlite`.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- Fase 47 hos Ståle: ingenting flytter seg sidelengs ved fanebytte (bredt pc-vindu). `tsc --noEmit` og lint rene etter Fase 47; `next build` sist ved Fase 45-slutt. Fase 29: funn F1–F10 i `sikkerhet.md`; Fase 45: F11–F14.
- Fase 46 hos Ståle: bygg, oppstart, innlogging, `up`/`down` (rapportert, utskrifter ikke sett). Prøvd i minnet med tom database: teller for gale forsøk, scrypt; Fase 44 logg/synkstatus 9 av 9; overlapp, klokkeslett, synk, farger i tidligere faser.
- Docker på hjemme-pc 2026-10-16 (Ståle): siste kode (Fase 47) ser ut til å være med etter `build --no-cache`; årsaken til at siden først hoppet er ikke avgjort (logg 2026-10-15–16). Cloudflare-lenke nevnt, ikke sett: `TODO.md` punkt 18.
- Ikke prøvd: at en konkret endring overlevde `down`/`up` (ikke sagt med ord), innlogging etter utløpt pause etter andre retting, vedlikehold med innlogging, deaktivert med gyldig økt, `AUTH_MODUS=lokal`, `next start` (Secure-kapsel), `npm run import` mot databasen, masseendring, låst databasefil.

## Neste
Planen har ikke flere fasenummer før Fase 32 (Entra). Åpne ønsker i `TODO.md`: MySQL-fasen (punkt 13 og 15), Fase 32–33. Ståle velger rekkefølge; vesentlig nytt arbeid trenger en plan før koding. Ubesluttet: «Vis i ukeplan» fra Admin åpner Dag; skal den åpne Uke? Lest i koden, ikke sett: Uke ruller til `?person=` igjen ved hver retur til fanen (`components/UkeplanClient.tsx:175-179`); står under punkt 16 i `TODO.md`.

## Arbeidsmåte neste økt
- `[rester-etter-feil]` Retter du en feil som har skrevet tilstand, rydd også det den alt skrev, og prøv fra den tilstanden.
- `[verifisering-krever-data]` Før en fase der verifiseringen er «logg inn» eller «se dataene»: sjekk at miljøet har data, og si hva som må flyttes dit.

## Det en ny økt må vite
- **Data ligger i `data/vaktliste.db` (SQLite, ikke i git).** Skjema i `db/skjema.sql`; `lib/database.ts` gjør om mellom tabeller og `Vaktliste` og har logg- og synkstatusfunksjonene (deles med skriptene, bare `import type`). `lib/tilkobling.ts` eier `database()`. Begrunnelser i `arkitektur.md` («Datalag: SQLite»).
- Skriving av vaktlista går alltid gjennom `endreVaktliste` i `lib/lager.ts` (én transaksjon, revisjonssjekk, `VACUUM INTO`-kopi, 20 siste). Den rører bare tabellene i `TABELLER`. **Ny tabell:** `CREATE TABLE IF NOT EXISTS` i `db/skjema.sql`. **Ny kolonne i en eksisterende tabell:** øk `SKJEMA_VERSJON`, `ALTER TABLE`-migrering i `lib/tilkobling.ts`, kolonnen i `db/skjema.sql` og i `TABELLER`.
- **Docker (Fase 46):** `Dockerfile`, `docker-compose.yml`, `docker-start.sh`, `DOCKER.md` (mangler stegene for testfil, `.env` og flytting til annen maskin: `TODO.md` punkt 17). Standalone-bygg bare med `BYGG_STANDALONE=1` (satt i bildet). Ny database har ingen brukere, så `data/vaktliste.db` kopieres inn for hånd (**Beslutning (Ståle):** alle dataene med, kun for dev). Passordene følger databasen: startpassordet virker bare for de som ikke har byttet.
- **Innlogging (Fase 45):** `innlogget()` i `lib/utfor.ts` er eneste kilde til hvem brukeren er (layout, sider, handlinger); `null` når passord må byttes, eller personen er deaktivert/uten team. Logikk i `lib/innlogging.ts` (scrypt, tabellene `innlogging` og `okt`, kapselen `vaktliste-okt`); `proxy.ts` sjekker bare at kapselen finnes. Sider: `/logg-inn`, `/bytt-passord`; `components/Konto.tsx`. Handlinger i `app/innlogging/handlinger.ts`.
- **Miljø (`app/.env.local`, ikke i git, Claude leser den ikke):** `STARTPASSORD` (startpassordet for første innlogging); `AUTH_MODUS=lokal` gir «Du er»-velgeren i stedet for innlogging, bare utenfor produksjon. Fila må ligge ved siden av `package.json`, ikke i `app/app/`. E-post for innlogging er `upn` i `brukere` (vises ikke i appen); glemt passord: raden i `innlogging` slettes for hånd (F12).
- **Organisasjonens kredensial-hook** (`C:\ProgramData\ClaudeCode\hooks\pretool-credential-scan.ps1`) stopper Write/Edit med `password|token|secret` fulgt av `=` eller `:`. Ikke skriv passord i kode; navngi variabler norsk (`oktId`).
- `app/layout.tsx`: `innlogget()` leser kapselen før `lesVaktliste()`, så `next build` ikke leser databasen. Hold det slik. Under vedlikehold får uinnloggede sidene (så admin kan logge inn), innloggede ikke-admin meldingen.
- **Alle handlinger går gjennom `utforSom` i `lib/utfor.ts`**: Admin (`app/admin/handlinger.ts`) og planen (`app/handlinger.ts`). Hva en ansatt får gjøre sjekkes i `lib/domene.ts`.
- **Endringsloggen** (`lib/endringslogg.ts`): nye Vaktliste-tabeller eller felt må inn i `TABELLER` og `FELTNAVN`.
- **Synk:** `lib/synk.ts` (`testkilde`: `data/entra-test.json`), `kjørSynk`, `synkHvisForfalt` via `after()` i layouten. Fase 32 bytter `aktivKilde()` til Graph.
- **`npm run import`** (Excel) skriver mot databasen; `--overskriv` bytter bare vaktlista (kopi først, revisjon +1), loggen og innloggingen beholdes.
- **Innstillinger (skjemaversjon 15):** `vedlikehold`, `melding`, `idagFarge`, `idagFyll`, `synk` i tabellen `innstillinger`.
- `lib/domene.ts` deles med skriptene og har ingen imports. I `node`-skript på Windows: absolutte stier som `file:///C:/...`.
- **Godkjenning:** `Status.virkning` `godkjent|venter|avvist`; `EndringVindu.tsx`, `Godkjenning.tsx`, `GodkjenningListe.tsx`; `finnOverlapp` i domene.
- **Visninger:** Dag (`DagClient.tsx`), Uke (fane-id `ukeplan`), Måned (`MaanedClient.tsx`). Tabell/kort bytter ved 768 px; ny kolonne må inn begge steder. Etter CSS-endringer: Ctrl+F5.
- Admin-sider trenger `export const dynamic = "force-dynamic"`. Admin-skjemaer er ukontrollerte (`useSkjemaStatus`). En `"use server"`-fil kan bare eksportere async-funksjoner (og typer).
- **Sikkerhet:** F1–F14 i `kunnskap/sikkerhet.md`. F10 (dev-server på nettet) godtatt av Ståle også etter innlogging; F11 (felles startpassord) må løses før ekte data.
- `python` finnes ikke i Git Bash her; skriv filer med Write/Edit. CSS-klassenavn uten æøå. Aldri lim ekte rader inn i logg, STATUS eller plan. Nøkler i lister: `teamId-id`.
- Eldre detaljer (git-historikk, «Registrer», ukenummer, sortering, figur, «Mine endringer») står i `git show 43ab5e2:kunnskap/STATUS.md`.
- Persondata-deny-settet er tilbudt i `.claude/settings.json`, ikke besluttet. Fila og `TODO.md` har ucommittede endringer fra brukeren (i `TODO.md` ligger også Claudes merknad under punkt 16 og punkt 17–18); de tas ikke med i faseslutt-commit.
