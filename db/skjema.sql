-- Skjemaet for data/vaktliste.db (SQLite). Lages av lib/lager.ts når databasen mangler, og av
-- `npm run til-sqlite`. Kolonnene heter som feltene i lib/domene.ts; lib/database.ts gjør om.
-- `rekkefolge` holder rekkefølgen i lista (team-rekkefølgen er rekkefølgen i teamvelgeren).
-- Sannhetsverdier er 0/1. Ingen fremmednøkler: en endring kan peke på en status, type eller
-- lokasjon som er slettet, og appen tåler det (se `virkningFor` i lib/domene.ts).
-- Skrevet for SQLite; MySQL trenger egen variant (VARCHAR med lengde på nøkler).

CREATE TABLE IF NOT EXISTS meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  skjemaVersjon INTEGER NOT NULL,
  revisjon INTEGER NOT NULL,
  sistEndretAv TEXT
);

CREATE TABLE IF NOT EXISTS innstillinger (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  vedlikehold INTEGER NOT NULL,
  melding TEXT NOT NULL,
  idagFarge TEXT,
  idagFyll TEXT,
  synkKlokkeslett TEXT NOT NULL,
  synkIntervallTimer INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS team (
  rekkefolge INTEGER NOT NULL,
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lokasjoner (
  rekkefolge INTEGER NOT NULL,
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teamId TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roller (
  rekkefolge INTEGER NOT NULL,
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS statuser (
  rekkefolge INTEGER NOT NULL,
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  virkning TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS endringstyper (
  rekkefolge INTEGER NOT NULL,
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kategori TEXT NOT NULL,
  farge TEXT
);

CREATE TABLE IF NOT EXISTS brukere (
  rekkefolge INTEGER NOT NULL,
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  upn TEXT,
  erAdministrator INTEGER,
  opprettet TEXT,
  aktiv INTEGER NOT NULL,
  entraId TEXT
);

CREATE TABLE IF NOT EXISTS oppsett (
  rekkefolge INTEGER NOT NULL,
  id TEXT PRIMARY KEY,
  brukerId TEXT NOT NULL,
  teamId TEXT NOT NULL,
  rolleId TEXT,
  lokasjonId TEXT,
  activeFrom TEXT,
  activeTo TEXT,
  sortOrder REAL,
  comment TEXT
);

CREATE TABLE IF NOT EXISTS endringer (
  rekkefolge INTEGER NOT NULL,
  id TEXT PRIMARY KEY,
  brukerId TEXT NOT NULL,
  lokasjonId TEXT,
  statusId TEXT,
  fromDate TEXT,
  toDate TEXT,
  fromTime TEXT,
  toTime TEXT,
  typeId TEXT,
  comment TEXT,
  avvistGrunn TEXT
);

CREATE TABLE IF NOT EXISTS dager (
  rekkefolge INTEGER NOT NULL,
  id TEXT PRIMARY KEY,
  fromDate TEXT NOT NULL,
  toDate TEXT NOT NULL,
  comment TEXT NOT NULL,
  fri INTEGER NOT NULL
);

-- Fra Fase 44. Endringsloggen er bare tillegg og vokser uten tak, og er ikke en del av `Vaktliste`
-- (ingen revisjon, ingen sikkerhetskopi per linje). `felt` er en JSON-liste av {felt, gammel, ny}.
-- Nyeste først sorteres på `tid`, deretter `id` (linjene fra én lagring har samme `tid`).
CREATE TABLE IF NOT EXISTS endringslogg (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tid TEXT NOT NULL,
  endretAvId TEXT NOT NULL,
  endretAv TEXT NOT NULL,
  handling TEXT NOT NULL,
  tabell TEXT NOT NULL,
  radId TEXT NOT NULL,
  rad TEXT NOT NULL,
  felt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS endringslogg_tid ON endringslogg (tid);

-- Når synken sist kjørte. Én rad. Egen tabell, ikke i `innstillinger`: en synk uten endringer
-- skal ikke gi ny revisjon («Listen er endret av noen andre») eller sikkerhetskopi.
CREATE TABLE IF NOT EXISTS synkstatus (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  sistForsok TEXT,
  sistOk TEXT,
  ok INTEGER,
  melding TEXT
);
