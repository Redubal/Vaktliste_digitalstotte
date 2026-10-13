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
| F10 | Dev-serveren lytter på alle nettverkskort (`Network: http://10.192.189.24:3000`), så andre på samme nett kan nå appen og velge en administrator. | Middels | **Beslutning (Ståle, nettverk):** godtatt, fordi appen fortsatt er i test og ikke har personopplysninger som faller inn under GDPR. Må tas opp igjen før ekte persondata tas inn (`-H 127.0.0.1` i `dev`-skriptet, eller Entra). |
| F9 | Endringsloggen fører skrivinger, ikke oppslag (punkt 7). | Lav | **Beslutning (Ståle, oppslagslogg):** godtatt til Entra, fordi appen er i test uten GDPR-data og «Du er» uansett ikke viser hvem som faktisk ser. |
