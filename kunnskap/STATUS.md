# STATUS

**Plan:** kunnskap/plan.md
**Gjenstående:** `TODO.md` i rotkatalogen

## Tilstand
Fase 1–21, 22A, 22B, 23–31 og 35–45 ✅. **45** (pålogging med e-post og passord) verifisert av Ståle 2026-10-15: innlogging, passordbytte, utlogging, kollega uten Admin, `/admin` uinnlogget, pause etter fem gale. Neste: **Fase 46** (Docker). MySQL i Docker er ikke fasesatt. Fra eldre faser (detaljer i loggen): 42 mobilkalender uten fyll, vedlikehold; 41 måned over årsskiftet; 40 smalt vindu; 37–38 overlapp; 30 automatisk synk; 28 ekte telefon/pad; 26 radtellingen Excel «Dager» mot appen.
Administratorer: Espen, Ståle og Jens.
Stack: Next.js 16.4.0 (nytt API, les `node_modules/next/dist/docs/` før kode), React 19, Tailwind v4, Node 26.8.2 med innebygd `node:sqlite`.
Git-repoet ligger i `app/`, remote: github.com/Redubal/Vaktliste_digitalstotte (privat), gren `master`.

## Verifisert
- `tsc --noEmit`, lint og `next build` ved Fase 45-slutt (se loggen). Fase 29: funn F1–F10 i `sikkerhet.md`; Fase 45: F11–F14.
- Prøvd i minnet med tom database: teller for gale forsøk (pause, rest etter utløpt pause), scrypt; Fase 44 logg/synkstatus 9 av 9; overlapp, klokkeslett, synk, farger i tidligere faser.
- Ikke prøvd: innlogging etter utløpt pause etter andre retting, vedlikehold med innlogging, deaktivert med gyldig økt, `AUTH_MODUS=lokal`, `next start` (Secure-kapsel), `npm run import` mot databasen, masseendring, låst databasefil.

## Neste
**Fase 46** (Sonnet): Docker for appen og SQL-oppstartsskript, se planen. Krever Docker Desktop (brukeren installerer). `STARTPASSORD` må inn i containerens miljø (ikke i bildet). Ubesluttet: «Vis i ukeplan» fra Admin åpner Dag; skal den åpne Uke?

## Arbeidsmåte neste økt
- `[rester-etter-feil]` Retter du en feil som har skrevet tilstand, rydd også det den alt skrev, og prøv fra den tilstanden.

## Det en ny økt må vite
- **Data ligger i `data/vaktliste.db` (SQLite, ikke i git).** Skjema i `db/skjema.sql`; `lib/database.ts` gjør om mellom tabeller og `Vaktliste` og har logg- og synkstatusfunksjonene (deles med skriptene, bare `import type`). `lib/tilkobling.ts` eier `database()`. Begrunnelser i `arkitektur.md` («Datalag: SQLite»).
- Skriving av vaktlista går alltid gjennom `endreVaktliste` i `lib/lager.ts` (én transaksjon, revisjonssjekk, `VACUUM INTO`-kopi, 20 siste). Den rører bare tabellene i `TABELLER`. **Ny tabell:** `CREATE TABLE IF NOT EXISTS` i `db/skjema.sql`. **Ny kolonne i en eksisterende tabell:** øk `SKJEMA_VERSJON`, `ALTER TABLE`-migrering i `lib/tilkobling.ts`, kolonnen i `db/skjema.sql` og i `TABELLER`.
- **Innlogging (Fase 45):** `innlogget()` i `lib/utfor.ts` er eneste kilde til hvem brukeren er (layout, sider, handlinger); `null` når passord må byttes, eller personen er deaktivert/uten team. Logikk i `lib/innlogging.ts` (scrypt, tabellene `innlogging` og `okt`, kapselen `vaktliste-okt`); `proxy.ts` sjekker bare at kapselen finnes. Sider: `/logg-inn`, `/bytt-passord`; `components/Konto.tsx`. Handlinger i `app/innlogging/handlinger.ts`.
- **Miljø (`app/.env.local`, ikke i git, Claude leser den ikke):** `STARTPASSORD` (startpassordet for første innlogging); `AUTH_MODUS=lokal` gir «Du er»-velgeren i stedet for innlogging, bare utenfor produksjon. Fila må ligge ved siden av `package.json`, ikke i `app/app/`.
- E-post for innlogging er `upn` i `brukere`; den vises ikke i appen. Glemt passord: raden i `innlogging` slettes for hånd (F12).
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
- Persondata-deny-settet er tilbudt i `.claude/settings.json`, ikke besluttet. Fila og `TODO.md` har ucommittede endringer fra brukeren; de tas ikke med i faseslutt-commit.
