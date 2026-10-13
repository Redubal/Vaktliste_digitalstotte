import fs from "node:fs";
import path from "node:path";
import { SKJEMA_VERSJON, tomVaktliste, type Vaktliste } from "./domene";

const DATA_DIR = path.resolve(process.cwd(), "data");
const FIL = path.join(DATA_DIR, "vaktliste.json");
const KOPI_DIR = path.join(DATA_DIR, "sikkerhetskopi");
const BEHOLD_KOPIER = 20;
const LÅSTE_FEIL = ["EPERM", "EACCES", "EBUSY"];

export function lesVaktliste(): Vaktliste {
  if (!fs.existsSync(FIL)) {
    if (fs.existsSync(path.join(DATA_DIR, "brukere.json"))) {
      throw new Error("data/vaktliste.json mangler, men de gamle filene finnes. Kjør `npm run migrer`.");
    }
    return tomVaktliste();
  }
  const v = JSON.parse(fs.readFileSync(FIL, "utf8")) as Vaktliste;
  if (v.skjemaVersjon !== SKJEMA_VERSJON) {
    throw new Error(`data/vaktliste.json har skjemaversjon ${v.skjemaVersjon}, appen forventer ${SKJEMA_VERSJON}.`);
  }
  return v;
}

function ventSynkront(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Temp-fil i samme mappe (rename mellom disker er ikke atomisk). Filen lukkes før rename, og
// rename prøves på nytt fordi Windows nekter den når virusskanner eller redigerer holder fila.
function skrivAtomisk(innhold: string) {
  const tmp = `${FIL}.${process.pid}.tmp`;
  try {
    const fd = fs.openSync(tmp, "w");
    try {
      fs.writeSync(fd, innhold);
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    for (let forsøk = 1; ; forsøk++) {
      try {
        fs.renameSync(tmp, FIL);
        return;
      } catch (e) {
        const kode = (e as NodeJS.ErrnoException).code ?? "";
        if (forsøk >= 5 || !LÅSTE_FEIL.includes(kode)) throw e;
        ventSynkront(50 * forsøk);
      }
    }
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw e;
  }
}

function takSikkerhetskopi(revisjon: number) {
  if (!fs.existsSync(FIL)) return;
  fs.mkdirSync(KOPI_DIR, { recursive: true });
  const tid = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(FIL, path.join(KOPI_DIR, `vaktliste-${tid}-r${revisjon}.json`));
  const kopier = fs.readdirSync(KOPI_DIR).filter((n) => n.startsWith("vaktliste-")).sort();
  for (const gammel of kopier.slice(0, Math.max(0, kopier.length - BEHOLD_KOPIER))) {
    fs.rmSync(path.join(KOPI_DIR, gammel), { force: true });
  }
}

/**
 * Leser, lar `endre` endre listen, og lagrer. Hele løpet er synkront, så to handlinger i samme
 * prosess kan ikke flettes inn i hverandre. `endre` returnerer en feilbeskjed for å avbryte,
 * eller `null` for å lagre. Svaret er feilbeskjeden, eller `null` når alt ble lagret.
 */
export function endreVaktliste(
  valg: { forventetRevisjon: number; endretAv: string },
  endre: (v: Vaktliste) => string | null,
): string | null {
  const v = lesVaktliste();
  if (v.revisjon !== valg.forventetRevisjon) {
    return "Listen er endret av noen andre siden du åpnet siden. Last siden på nytt og prøv igjen.";
  }
  const feil = endre(v);
  if (feil) return feil;
  takSikkerhetskopi(v.revisjon);
  v.revisjon += 1;
  v.sistEndretAv = valg.endretAv;
  skrivAtomisk(JSON.stringify(v, null, 2) + "\n");
  return null;
}
