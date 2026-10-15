import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { lesAlt, skrivEndret } from "./database";
import { beregnEndringer, skrivEndringer } from "./endringslogg";
import type { Vaktliste } from "./domene";
import { DATA_DIR, database } from "./tilkobling";

const KOPI_DIR = path.join(DATA_DIR, "sikkerhetskopi");
const BEHOLD_KOPIER = 20;

export function lesVaktliste(): Vaktliste {
  return lesAlt(database());
}

// Kopi av hele databasen etter lagring. VACUUM INTO kan ikke gå inne i en transaksjon.
function takSikkerhetskopi(db: DatabaseSync, revisjon: number) {
  fs.mkdirSync(KOPI_DIR, { recursive: true });
  const tid = new Date().toISOString().replace(/[:.]/g, "-");
  db.prepare("VACUUM INTO ?").run(path.join(KOPI_DIR, `vaktliste-${tid}-r${revisjon}.db`));
  const kopier = fs.readdirSync(KOPI_DIR).filter((n) => n.startsWith("vaktliste-")).sort();
  for (const gammel of kopier.slice(0, Math.max(0, kopier.length - BEHOLD_KOPIER))) {
    fs.rmSync(path.join(KOPI_DIR, gammel), { force: true });
  }
}

/**
 * Leser, lar `endre` endre listen, og lagrer, i én transaksjon. Hele løpet er synkront, så to
 * handlinger i samme prosess kan ikke flettes inn i hverandre. `endre` returnerer en feilbeskjed
 * for å avbryte, eller `null` for å lagre. Svaret er feilbeskjeden, eller `null` når alt ble lagret.
 */
export function endreVaktliste(
  valg: { forventetRevisjon: number; endretAv: string },
  endre: (v: Vaktliste) => string | null,
): string | null {
  const db = database();
  let før: Vaktliste;
  let v: Vaktliste;
  db.exec("BEGIN IMMEDIATE");
  try {
    v = lesAlt(db);
    if (v.revisjon !== valg.forventetRevisjon) {
      db.exec("ROLLBACK");
      return "Listen er endret av noen andre siden du åpnet siden. Last siden på nytt og prøv igjen.";
    }
    før = structuredClone(v);
    const feil = endre(v);
    if (feil) {
      db.exec("ROLLBACK");
      return feil;
    }
    v.revisjon += 1;
    v.sistEndretAv = valg.endretAv;
    skrivEndret(db, før, v);
    db.exec("COMMIT");
  } catch (e) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw e;
  }
  // Listen er lagret; en feil i kopien eller loggen skal ikke få det til å se ut som lagringen feilet.
  try {
    takSikkerhetskopi(db, v.revisjon);
  } catch (e) {
    console.error("Sikkerhetskopien feilet", e);
  }
  try {
    skrivEndringer(beregnEndringer(før, v, valg.endretAv, new Date().toISOString()));
  } catch (e) {
    console.error("Skriving til endringsloggen feilet", e);
  }
  return null;
}
