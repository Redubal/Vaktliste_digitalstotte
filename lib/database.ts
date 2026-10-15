// Gjør om mellom `Vaktliste` og tabellene i db/skjema.sql. Delt mellom lib/lager.ts og
// scripts/json-til-sqlite.mjs: bare `import type` fra domene (Node stripper den), ingen stier her.
import fs from "node:fs";
import type { DatabaseSync, SQLInputValue, SQLOutputValue } from "node:sqlite";
import type { Vaktliste } from "./domene";
import type { LoggLinje } from "./endringslogg";
import type { SynkStatus } from "./synk";

type Liste = "team" | "lokasjoner" | "roller" | "statuser" | "endringstyper" | "brukere" | "oppsett" | "endringer" | "dager";

/** Kolonnene i samme rekkefølge som feltene i typen. `sannhet` lagres som 0/1. */
export const TABELLER: { navn: Liste; kolonner: string[]; sannhet?: string[] }[] = [
  { navn: "team", kolonner: ["id", "name"] },
  { navn: "lokasjoner", kolonner: ["id", "name", "teamId"] },
  { navn: "roller", kolonner: ["id", "name"] },
  { navn: "statuser", kolonner: ["id", "name", "virkning"] },
  { navn: "endringstyper", kolonner: ["id", "name", "kategori", "farge"] },
  {
    navn: "brukere",
    kolonner: ["id", "name", "upn", "erAdministrator", "opprettet", "aktiv", "entraId"],
    sannhet: ["erAdministrator", "aktiv"],
  },
  {
    navn: "oppsett",
    kolonner: ["id", "brukerId", "teamId", "rolleId", "lokasjonId", "activeFrom", "activeTo", "sortOrder", "comment"],
  },
  {
    navn: "endringer",
    kolonner: [
      "id", "brukerId", "lokasjonId", "statusId", "fromDate", "toDate",
      "fromTime", "toTime", "typeId", "comment", "avvistGrunn",
    ],
  },
  { navn: "dager", kolonner: ["id", "fromDate", "toDate", "comment", "fri"], sannhet: ["fri"] },
];

/** Feltet er valgfritt i typen: `null` i tabellen gir feltet utelatt, slik JSON-fila hadde det. */
const VALGFRI = new Set(["erAdministrator"]);

export function opprettSkjema(db: DatabaseSync, skjemaFil: string) {
  db.exec(fs.readFileSync(skjemaFil, "utf8"));
}

function tilRad(verdi: unknown): SQLInputValue {
  if (verdi === undefined || verdi === null) return null;
  if (typeof verdi === "boolean") return verdi ? 1 : 0;
  return verdi as SQLInputValue;
}

function fraRad(rad: Record<string, SQLOutputValue>, t: (typeof TABELLER)[number]) {
  const ut: Record<string, unknown> = {};
  for (const k of t.kolonner) {
    const verdi = rad[k];
    if (verdi === null && VALGFRI.has(k)) continue;
    ut[k] = t.sannhet?.includes(k) && verdi !== null ? verdi === 1 : verdi;
  }
  return ut;
}

export function lesAlt(db: DatabaseSync): Vaktliste {
  const meta = db.prepare("SELECT skjemaVersjon, revisjon, sistEndretAv FROM meta WHERE id = 1").get();
  const inn = db.prepare("SELECT * FROM innstillinger WHERE id = 1").get();
  if (!meta || !inn) throw new Error("Databasen mangler meta eller innstillinger. Er den laget av `npm run til-sqlite`?");
  const v = {
    skjemaVersjon: meta.skjemaVersjon as number,
    revisjon: meta.revisjon as number,
    sistEndretAv: meta.sistEndretAv as string | null,
    innstillinger: {
      vedlikehold: inn.vedlikehold === 1,
      melding: inn.melding as string,
      idagFarge: inn.idagFarge as string | null,
      idagFyll: inn.idagFyll as string | null,
    },
    synk: { klokkeslett: inn.synkKlokkeslett as string, intervallTimer: inn.synkIntervallTimer as number },
  } as Vaktliste;
  for (const t of TABELLER) {
    const rader = db.prepare(`SELECT * FROM "${t.navn}" ORDER BY rekkefolge`).all();
    (v as Record<Liste, unknown>)[t.navn] = rader.map((r) => fraRad(r, t));
  }
  return v;
}

function skrivMeta(db: DatabaseSync, v: Vaktliste) {
  db.prepare(
    "INSERT OR REPLACE INTO meta (id, skjemaVersjon, revisjon, sistEndretAv) VALUES (1, ?, ?, ?)",
  ).run(v.skjemaVersjon, v.revisjon, v.sistEndretAv);
}

function skrivInnstillinger(db: DatabaseSync, v: Vaktliste) {
  const i = v.innstillinger;
  db.prepare(
    `INSERT OR REPLACE INTO innstillinger
       (id, vedlikehold, melding, idagFarge, idagFyll, synkKlokkeslett, synkIntervallTimer)
     VALUES (1, ?, ?, ?, ?, ?, ?)`,
  ).run(tilRad(i.vedlikehold), i.melding, i.idagFarge, i.idagFyll, v.synk.klokkeslett, v.synk.intervallTimer);
}

function skrivTabell(db: DatabaseSync, t: (typeof TABELLER)[number], rader: unknown[]) {
  db.exec(`DELETE FROM "${t.navn}"`);
  const felt = ["rekkefolge", ...t.kolonner].map((k) => `"${k}"`).join(", ");
  const spm = ["?", ...t.kolonner.map(() => "?")].join(", ");
  const sett = db.prepare(`INSERT INTO "${t.navn}" (${felt}) VALUES (${spm})`);
  rader.forEach((rad, i) => {
    const r = rad as Record<string, unknown>;
    sett.run(i, ...t.kolonner.map((k) => tilRad(r[k])));
  });
}

/** Skriver hele lista. Kalles inne i en transaksjon. */
export function skrivAlt(db: DatabaseSync, v: Vaktliste) {
  skrivMeta(db, v);
  skrivInnstillinger(db, v);
  for (const t of TABELLER) skrivTabell(db, t, v[t.navn]);
}

/** Legger linjer til i endringsloggen. Kalles av appen etter lagring, og av skriptet som flytter gamle linjer. */
export function leggTilLogglinjer(db: DatabaseSync, linjer: LoggLinje[]) {
  if (linjer.length === 0) return;
  const sett = db.prepare(
    `INSERT INTO endringslogg (tid, endretAvId, endretAv, handling, tabell, radId, rad, felt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const l of linjer) {
      sett.run(l.tid, l.endretAvId, l.endretAv, l.handling, l.tabell, l.radId, l.rad, JSON.stringify(l.felt));
    }
    db.exec("COMMIT");
  } catch (e) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw e;
  }
}

/** Nyeste først. */
export function lesLogglinjer(db: DatabaseSync): LoggLinje[] {
  const rader = db.prepare("SELECT * FROM endringslogg ORDER BY tid DESC, id DESC").all();
  return rader.map((r) => ({
    tid: r.tid as string,
    endretAvId: r.endretAvId as string,
    endretAv: r.endretAv as string,
    handling: r.handling as LoggLinje["handling"],
    tabell: r.tabell as LoggLinje["tabell"],
    radId: r.radId as string,
    rad: r.rad as string,
    felt: JSON.parse(r.felt as string) as LoggLinje["felt"],
  }));
}

/** Tom status når synken aldri har kjørt. */
export function hentSynkstatus(db: DatabaseSync): SynkStatus {
  const r = db.prepare("SELECT sistForsok, sistOk, ok, melding FROM synkstatus WHERE id = 1").get();
  return {
    sistForsøk: (r?.sistForsok as string | null) ?? null,
    sistOk: (r?.sistOk as string | null) ?? null,
    ok: r?.ok === undefined || r.ok === null ? null : r.ok === 1,
    melding: (r?.melding as string | null) ?? null,
  };
}

export function lagreSynkstatus(db: DatabaseSync, s: SynkStatus) {
  db.prepare(
    "INSERT OR REPLACE INTO synkstatus (id, sistForsok, sistOk, ok, melding) VALUES (1, ?, ?, ?, ?)",
  ).run(s.sistForsøk, s.sistOk, tilRad(s.ok), s.melding);
}

/** Skriver meta og bare de tabellene som er endret fra `før`. Kalles inne i en transaksjon. */
export function skrivEndret(db: DatabaseSync, før: Vaktliste, etter: Vaktliste) {
  skrivMeta(db, etter);
  if (JSON.stringify([før.innstillinger, før.synk]) !== JSON.stringify([etter.innstillinger, etter.synk])) {
    skrivInnstillinger(db, etter);
  }
  for (const t of TABELLER) {
    if (JSON.stringify(før[t.navn]) !== JSON.stringify(etter[t.navn])) skrivTabell(db, t, etter[t.navn]);
  }
}
