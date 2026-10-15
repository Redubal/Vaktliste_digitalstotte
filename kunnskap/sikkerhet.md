# Sikkerhetssjekkliste

Oppdateres når nye endepunkter/dataflater legges til. Full gjennomgang: se logg.md.

1. Autentisering/autorisasjon — dekning per endepunkt (hvem vokter hva)
2. Secrets/PII aldri i klientkode, DTO-er eller logger
3. Injection (SQL/OData/shell) — alltid server-utledet input i filterstrenger
4. XSS/RCE — ingen ukontrollert HTML-injeksjon
5. Avhengigheter — `npm audit` (eller ekvivalent) 0 sårbarheter
6. Feilmeldinger til klient — aldri interne detaljer/stack traces
7. Audit-logging av skriveoperasjoner og sensitive oppslag

## Gjennomgang Fase 29 (2026-10-13)

Lest: alle handlinger (`app/handlinger.ts`, `app/admin/handlinger.ts`), `lib/utfor.ts`,
`lib/domene.ts` (rettighetsreglene), `lib/vaktlista.ts`, `lib/lager.ts`, `app/page.tsx`,
`app/layout.tsx`, alle sider under `/admin`, `IdentitetsVelger`, figurens `innerHTML`. `npm audit` kjørt.

### Holder (sjekket, ingen endring)
- **Tilgang per handling (punkt 1):** hver handling går gjennom `utforSom`, som leser «Du er» på
  serveren. Alle Admin-handlinger krever administrator; alle Admin-sider sender ikke-administratorer
  til forsiden. Deaktiverte personer er ikke med i `getAnsatte` og kan ikke handle.
- **Rettighetene fra Fase 23–25:** en ansatt kan bare legge inn for seg selv (`sjekkEndring`), bare
  rette egne som venter (`kanEndreEndring`), aldri slette (`kanSletteEndring`), aldri godkjenne eller
  avvise (Admin-handlinger). Status settes alltid av serveren, aldri fra skjemaet. Retting beholder
  person og status. Vedlikeholdsmodus stopper ansattes handlinger på serveren.
- **Begrunnelse for avvisning** sendes bare til personen selv (`getMineEndringer`).
- **Injection/XSS (punkt 3–4):** ingen database eller skall; filstier er faste. Ingen
  `dangerouslySetInnerHTML`. Figurens `innerHTML` (`pynt.ts`) bruker bare faste farger og stier fra
  koden. Endringstype-farge sjekkes mot `#rrggbb` på serveren før den havner i en style-verdi.
- **Feilmeldinger (punkt 6):** lagringsfeil gir en generell melding; detaljene går bare til
  serverloggen.
- **Skjemaangrep fra andre nettsider (CSRF):** Next sjekker at handlinger kommer fra samme
  opprinnelse, og kapselen er `samesite=lax`.

### Funn
| # | Funn | Alvor | Status |
|---|------|-------|--------|
| F1 | **Ingen innlogging.** Hvem som helst som når siden kan velge en administrator i «Du er» og få full tilgang, også uten å velge seg selv ser de hele planen. | Høy i drift | **Beslutning (Ståle, innlogging):** godtatt til Entra (Fase 31). Appen kjøres bare lokalt eller i lukket nett, og ekte persondata tas ikke inn før Entra og behandlingsgrunnlag (`TODO.md` punkt 1) er på plass. |
| F2 | Avviste endringer (med kommentar) ble sendt til alle nettlesere, selv om planen ikke viser dem. | Middels | **Rettet:** filtreres bort i `app/page.tsx`; egne står i «Mine endringer». |
| F3 | E-post (`upn`) og ansatt-kommentar ble sendt til alle nettlesere uten å brukes. | Lav | **Rettet:** tømmes i `app/page.tsx` før utsending. |
| F4 | Ingen sikkerhetshoder: Admin kunne bygges inn i en annen side (klikk-kapring). | Lav | **Rettet:** `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` i `next.config.ts`. |
| F5 | `next` 16.3.7 har kjente høyalvorlige sårbarheter (bl.a. lekkasje fra utviklingsserveren og SSRF i bildeoptimering); retting i 16.4.0. | Høy | **Rettet** (Ståle valgte «oppgrader nå»): `next` og `eslint-config-next` 16.4.0; `npm audit` viser ikke lenger `next`. |
| F6 | `xlsx` 0.18.5 (prototype pollution, ReDoS); ingen retting på npm. Brukes bare i `npm run import` mot egen Excel-fil. | Lav (lokalt) | **Beslutning (Ståle, xlsx):** godtatt. Importen er en engangsjobb mot en fil teamet selv eier, ikke en fil fra utsiden. |
| F7 | Kommentarer på andres endringer (godkjente og ventende) vises for alle i planen. Kan inneholde helseopplysninger. | Middels | **Rettet** (Ståle valgte «bare egne + admin»): kommentaren tømmes i `app/page.tsx` for andres endringer når den som ser ikke er administrator. Typen vises fortsatt. |
| F8 | `braces` og `source-map-js`: bare i utviklingsverktøy (lint/bygg), ikke i appen som kjører. | Lav | **Delvis rettet** (Ståle sa ja): `npm audit fix` oppdaterte `source-map-js`. **Beslutning (Ståle, utviklingsverktøy):** `braces` (via `eslint-config-next`) godtas, fordi den bare brukes i lint og retting krever nedgradering av `eslint-config-next`. |
| F10 | Dev-serveren lytter på alle nettverkskort (`Network: http://10.192.189.24:3000`), så andre på samme nett kan nå appen og velge en administrator. | Middels | **Beslutning (Ståle, nettverk):** godtatt, fordi appen fortsatt er i test og ikke har personopplysninger som faller inn under GDPR. Må tas opp igjen før ekte persondata tas inn (`-H 127.0.0.1` i `dev`-skriptet, eller Entra). **Tatt opp i Fase 45 — Beslutning (Ståle, nettverk):** fortsatt godtatt; det gjør ikke noe at appen er synlig på nettet den ligger i. Nå kreves innlogging, men over http i dev sendes kapselen ukryptert og startpassordet er kjent (F11), så vurderingen gjelder bare så lenge det ikke er ekte persondata. |
| F9 | Endringsloggen fører skrivinger, ikke oppslag (punkt 7). | Lav | **Beslutning (Ståle, oppslagslogg):** godtatt til Entra, fordi appen er i test uten GDPR-data og «Du er» uansett ikke viser hvem som faktisk ser. |

## Fase 45: pålogging med e-post og passord (2026-10-15)

F1 er erstattet av ekte innlogging; «Du er»-velgeren finnes bare med `AUTH_MODUS=lokal`, og bare
utenfor produksjon. Kode: `lib/innlogging.ts`, `innlogget()` i `lib/utfor.ts`, `proxy.ts`.

### Slik er det bygget
- **Passord:** `crypto.scrypt` (N = 2^15, r = 8, p = 1, 16 byte salt, 64 byte nøkkel), sammenlignet med
  `timingSafeEqual`. Lagret som `scrypt$N$salt$hash` i tabellen `innlogging`. Målt: ca. 60 ms per sjekk.
- **Startpassord** fra miljøvariabelen `STARTPASSORD` i `.env.local`, ikke i koden: raden lages ved
  første innlogging med `maaBytte` = 1, og appen slipper ingen videre før passordet er byttet.
  Nytt passord: minst 10 tegn, ikke startpassordet og ikke det gamle.
- **Økter:** 32 tilfeldige byte i kapselen `vaktliste-okt` (HttpOnly, SameSite=Lax, Secure i
  produksjon, 7 dager); tabellen `okt` har bare SHA-256 av verdien. Utlogging sletter raden.
  Passordbytte logger ut alle andre økter for personen.
- **Gale forsøk:** telles per konto FØR passordet sjekkes (atomisk `UPDATE … RETURNING`), så
  samtidige forsøk ikke slipper forbi. Fem gale gir 5 minutters pause. Adresser som ikke finnes, får
  samme svar, samme regnetid og samme pause (teller i minnet), så skjemaet ikke avslører hvem som
  har konto.
- **Tilgang sjekkes der dataene er:** hver side og handling kaller `innlogget()`. `proxy.ts` sender
  bare den uten kapsel til `/logg-inn` og ser ikke i databasen. Deaktiverte og personer uten team
  får `null` fra `innlogget()` og kommer ikke inn, selv med gyldig økt.
- **CSRF:** serverhandlinger i Next sjekker `Origin` mot `Host`; i tillegg SameSite=Lax.

### Kjente svakheter
| # | Svakhet | Alvor | Status |
|---|---------|-------|--------|
| F11 | Startpassordet (avtalt i planen) er svakt og kjent av alle. Den som kjenner en kollegas e-post, kan logge inn som vedkommende før vedkommende selv har gjort det første gang. | Høy før ekte data | Må byttes ut før ekte persondata (`TODO.md` punkt 1): enten et tilfeldig startpassord per person, eller Entra. |
| F12 | Ingen «glemt passord» og ingen måte for admin å nullstille. Glemt passord = rad slettes i `innlogging` for hånd. | Lav i test | Bevisst utenfor fasen (planen: «Ikke med»). |
| F13 | Pausen etter gale forsøk er per konto, ikke per maskin. Andre kan låse en kollega ute i 5 minutter med vilje. | Lav | Godtatt i prototypen; Entra løser det. |
| F14 | Sikkerhetskopiene i `data/kopier/` inneholder passordhashene og øktene (som hash). | Lav | Samme vern som databasen; hashene er saltet scrypt, øktene er SHA-256 av 32 tilfeldige byte. |
