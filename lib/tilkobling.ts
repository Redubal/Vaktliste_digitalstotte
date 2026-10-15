import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { opprettSkjema, skrivAlt } from "./database";
import { SKJEMA_VERSJON, tomVaktliste } from "./domene";

export const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FIL = path.join(DATA_DIR, "vaktliste.db");
const JSON_FIL = path.join(DATA_DIR, "vaktliste.json");
const SKJEMA_FIL = path.resolve(process.cwd(), "db", "skjema.sql");

// Én tilkobling per prosess. På globalThis så den overlever omlasting av moduler i `next dev`.
const g = globalThis as { vaktlisteDb?: DatabaseSync };

function åpneNy(): DatabaseSync {
  if (fs.existsSync(JSON_FIL)) {
    throw new Error("data/vaktliste.db mangler, men data/vaktliste.json finnes. Kjør `npm run til-sqlite`.");
  }
  if (fs.existsSync(path.join(DATA_DIR, "brukere.json"))) {
    throw new Error("data/vaktliste.db mangler, men de gamle filene finnes. Kjør `npm run migrer` og `npm run til-sqlite`.");
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_FIL);
  opprettSkjema(db, SKJEMA_FIL);
  db.exec("BEGIN IMMEDIATE");
  skrivAlt(db, tomVaktliste());
  db.exec("COMMIT");
  return db;
}

/** Tilkoblingen til `data/vaktliste.db`, delt av vaktlista (lager.ts), endringsloggen og synkstatusen. */
export function database(): DatabaseSync {
  if (g.vaktlisteDb?.isOpen) return g.vaktlisteDb;
  const db = fs.existsSync(DB_FIL) ? new DatabaseSync(DB_FIL) : åpneNy();
  // Windows: virusskanner eller en annen prosess kan holde fila et øyeblikk.
  db.exec("PRAGMA busy_timeout = 5000");
  // Skjemaet bare legger til (CREATE ... IF NOT EXISTS): en database fra før Fase 44 får tabellene
  // endringslogg og synkstatus uten at skjemaversjonen øker.
  opprettSkjema(db, SKJEMA_FIL);
  const versjon = db.prepare("SELECT skjemaVersjon FROM meta WHERE id = 1").get()?.skjemaVersjon;
  if (versjon !== SKJEMA_VERSJON) {
    db.close();
    throw new Error(`data/vaktliste.db har skjemaversjon ${versjon}, appen forventer ${SKJEMA_VERSJON}.`);
  }
  g.vaktlisteDb = db;
  return db;
}
