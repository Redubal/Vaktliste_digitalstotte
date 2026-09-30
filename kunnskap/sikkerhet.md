# Sikkerhetssjekkliste

Oppdateres når nye endepunkter/dataflater legges til. Full gjennomgang: se logg.md.

1. Autentisering/autorisasjon — dekning per endepunkt (hvem vokter hva)
2. Secrets/PII aldri i klientkode, DTO-er eller logger
3. Injection (SQL/OData/shell) — alltid server-utledet input i filterstrenger
4. XSS/RCE — ingen ukontrollert HTML-injeksjon
5. Avhengigheter — `npm audit` (eller ekvivalent) 0 sårbarheter
6. Feilmeldinger til klient — aldri interne detaljer/stack traces
7. Audit-logging av skriveoperasjoner og sensitive oppslag
