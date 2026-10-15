// Flytter data/endringslogg.jsonl og data/synkstatus.json over i data/vaktliste.db (Fase 44).
// Filene røres ikke. Skriver bare antall, aldri innholdet i linjene. Stopp appen først.
// Stopper hvis tabellen endringslogg allerede har linjer (da ville de gamle blitt dobbelt);
// `--overskriv` tømmer tabellen og laster på nytt fra fila, så linjer skrevet av appen siden sist går tapt.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { hentSynkstatus, lagreSynkstatus, leggTilLogglinjer, opprettSkjema } from "../lib/database.ts";

const ROT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = resolve(ROT, "data");
const DB = resolve(DATA_DIR, "vaktliste.db");
const LOGG = resolve(DATA_DIR, "endringslogg.jsonl");
const STATUS = resolve(DATA_DIR, "synkstatus.json");
const SKJEMA = resolve(ROT, "db", "skjema.sql");
const overskriv = process.argv.includes("--overskriv");

function stopp(melding) {
  console.error(melding);
  process.exit(1);
}

if (!existsSync(DB)) stopp("data/vaktliste.db finnes ikke. Kjør `npm run til-sqlite` først. Ingenting er endret.");

const db = new DatabaseSync(DB);
db.exec("PRAGMA busy_timeout = 5000");
opprettSkjema(db, SKJEMA);

const FELT = ["tid", "endretAvId", "endretAv", "handling", "tabell", "radId", "rad"];
const gyldig = (l) => l && FELT.every((f) => typeof l[f] === "string") && Array.isArray(l.felt);

const linjer = [];
let ødelagte = 0;
if (existsSync(LOGG)) {
  for (const rå of readFileSync(LOGG, "utf8").split("\n")) {
    if (!rå.trim()) continue;
    try {
      const l = JSON.parse(rå);
      if (gyldig(l)) linjer.push(l);
      else ødelagte++;
    } catch {
      ødelagte++;
    }
  }
}

const fantFraFør = db.prepare("SELECT COUNT(*) AS n FROM endringslogg").get().n;
if (fantFraFør > 0 && !overskriv) {
  db.close();
  stopp(`Tabellen endringslogg har allerede ${fantFraFør} linjer. Ingenting er endret. Bruk --overskriv for å laste på nytt fra fila.`);
}

// Kopi av databasen først, så et feil valg kan angres.
const kopiDir = resolve(DATA_DIR, "sikkerhetskopi");
mkdirSync(kopiDir, { recursive: true });
const tid = new Date().toISOString().replace(/[:.]/g, "-");
db.prepare("VACUUM INTO ?").run(resolve(kopiDir, `vaktliste-${tid}-for-logg-til-sqlite.db`));

try {
  if (fantFraFør > 0) db.exec("DELETE FROM endringslogg");
  leggTilLogglinjer(db, linjer); // fila er eldst først, så id-ene vokser i samme rekkefølge

  const antall = db.prepare("SELECT COUNT(*) AS n FROM endringslogg").get().n;
  if (antall !== linjer.length) throw new Error(`Kontrollen fant avvik: ${linjer.length} linjer inn, ${antall} ut`);

  let status = "ingen fil";
  if (existsSync(STATUS)) {
    const harStatus = db.prepare("SELECT COUNT(*) AS n FROM synkstatus").get().n > 0;
    if (harStatus && !overskriv) {
      status = "databasen har allerede en status, ikke endret";
    } else {
      const s = JSON.parse(readFileSync(STATUS, "utf8"));
      lagreSynkstatus(db, {
        sistForsøk: s.sistForsøk ?? null,
        sistOk: s.sistOk ?? null,
        ok: typeof s.ok === "boolean" ? s.ok : null,
        melding: s.melding ?? null,
      });
      const tilbake = hentSynkstatus(db);
      if (tilbake.sistForsøk !== (s.sistForsøk ?? null)) throw new Error("Kontrollen fant avvik i synkstatus");
      status = "flyttet";
    }
  }

  console.log("Flyttet til data/vaktliste.db, og kontrollen fant ingen avvik:");
  console.log(`  endringslogg: ${linjer.length} linjer${ødelagte ? ` (${ødelagte} ødelagte hoppet over)` : ""}`);
  console.log(`  synkstatus: ${status}`);
} catch (e) {
  stopp(`Stoppet: ${e.message}. Kopien i data/sikkerhetskopi/ er fra før flyttingen.`);
} finally {
  db.close();
}
