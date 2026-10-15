// Flytter data/vaktliste.json over i data/vaktliste.db (Fase 43). JSON-fila røres ikke.
// Skriver bare tabellnavn, feltnavn og antall, aldri innholdet i radene.
// `--overskriv` erstatter en eksisterende database (stopp appen først; den gamle legges i sikkerhetskopi/).
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { SKJEMA_VERSJON, oppgraderVaktliste } from "../lib/domene.ts";
import { TABELLER, lesAlt, opprettSkjema, skrivAlt } from "../lib/database.ts";

const ROT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = resolve(ROT, "data");
const KILDE = resolve(DATA_DIR, "vaktliste.json");
const MAL = resolve(DATA_DIR, "vaktliste.db");
const TMP = `${MAL}.tmp`;
const SKJEMA = resolve(ROT, "db", "skjema.sql");
const overskriv = process.argv.includes("--overskriv");

function stopp(melding) {
  console.error(melding);
  process.exit(1);
}

if (!existsSync(KILDE)) stopp("data/vaktliste.json finnes ikke. Ingenting er endret.");
if (existsSync(MAL) && !overskriv) {
  stopp("data/vaktliste.db finnes allerede. Ingenting er endret. Bruk --overskriv for å erstatte den.");
}

const rå = JSON.parse(readFileSync(KILDE, "utf8"));
const v = rå.skjemaVersjon === SKJEMA_VERSJON ? rå : oppgraderVaktliste(rå);

// Felt som ikke har en kolonne, ville gått tapt. Stopp heller enn å miste noe stille.
const ukjente = [];
for (const t of TABELLER) {
  const felt = new Set(v[t.navn].flatMap((r) => Object.keys(r)));
  for (const f of felt) if (!t.kolonner.includes(f)) ukjente.push(`${t.navn}.${f}`);
}
if (ukjente.length) stopp(`Felt uten kolonne i databasen: ${ukjente.join(", ")}. Ingenting er endret.`);

rmSync(TMP, { force: true });
const db = new DatabaseSync(TMP);
try {
  opprettSkjema(db, SKJEMA);
  db.exec("BEGIN IMMEDIATE");
  skrivAlt(db, v);
  db.exec("COMMIT");

  // Kontroll: les tilbake og sammenlign felt for felt med JSON-fila.
  const tilbake = lesAlt(db);
  const lik = (a, b) => (a ?? null) === (b ?? null);
  const avvik = [];
  for (const nøkkel of ["skjemaVersjon", "revisjon", "sistEndretAv"]) {
    if (!lik(v[nøkkel], tilbake[nøkkel])) avvik.push(nøkkel);
  }
  for (const [del, felt] of [["innstillinger", ["vedlikehold", "melding", "idagFarge", "idagFyll"]], ["synk", ["klokkeslett", "intervallTimer"]]]) {
    for (const f of felt) if (!lik(v[del][f], tilbake[del][f])) avvik.push(`${del}.${f}`);
  }
  for (const t of TABELLER) {
    if (v[t.navn].length !== tilbake[t.navn].length) {
      avvik.push(`${t.navn}: ${v[t.navn].length} rader inn, ${tilbake[t.navn].length} ut`);
      continue;
    }
    v[t.navn].forEach((rad, i) => {
      for (const k of t.kolonner) {
        if (!lik(rad[k], tilbake[t.navn][i][k])) avvik.push(`${t.navn} rad ${i + 1}, felt ${k}`);
      }
    });
  }
  if (avvik.length) throw new Error(`Kontrollen fant avvik: ${avvik.slice(0, 10).join("; ")}`);
} catch (e) {
  db.close();
  rmSync(TMP, { force: true });
  stopp(`Stoppet, ingenting er endret: ${e.message}`);
}
db.close();

if (existsSync(MAL)) {
  const kopiDir = resolve(DATA_DIR, "sikkerhetskopi");
  mkdirSync(kopiDir, { recursive: true });
  const tid = new Date().toISOString().replace(/[:.]/g, "-");
  try {
    renameSync(MAL, resolve(kopiDir, `vaktliste-${tid}-for-til-sqlite.db`));
  } catch (e) {
    rmSync(TMP, { force: true });
    stopp(`Fikk ikke flyttet den gamle databasen (${e.code}). Stopp appen og prøv igjen. Ingenting er endret.`);
  }
}
renameSync(TMP, MAL);

console.log("Skrev data/vaktliste.db, og kontrollen fant ingen avvik:");
for (const t of TABELLER) console.log(`  ${t.navn}: ${v[t.navn].length} rader`);
console.log(`  revisjon: ${v.revisjon}`);
