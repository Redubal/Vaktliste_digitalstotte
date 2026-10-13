// Engangs: slår de fem gamle filene i data/ sammen til data/vaktliste.json.
// Beholder alt, også `erAdministrator`. De gamle filene lar den stå urørt.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { oppgraderVaktliste } from "../lib/domene.ts";

const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data");
const MAL = resolve(DATA_DIR, "vaktliste.json");

if (existsSync(MAL)) {
  console.error("data/vaktliste.json finnes allerede. Ingenting er endret.");
  process.exit(1);
}

function les(navn) {
  const fil = resolve(DATA_DIR, navn);
  if (!existsSync(fil)) throw new Error(`Mangler data/${navn}`);
  return JSON.parse(readFileSync(fil, "utf8"));
}

const brukere = les("brukere.json");
// De gamle filene har formatet til skjemaversjon 1; resten gjøres av oppgraderVaktliste.
const samlet = oppgraderVaktliste({
  skjemaVersjon: 1,
  revisjon: 0,
  sistEndretAv: null,
  lokasjoner: les("lokasjoner.json"),
  brukere,
  oppsett: les("oppsett.json"),
  endringer: les("endringer.json"),
  dager: les("dager.json"),
});

writeFileSync(MAL, JSON.stringify(samlet, null, 2) + "\n", "utf8");
console.log("Skrev data/vaktliste.json:");
for (const [tabell, rader] of Object.entries(samlet)) {
  if (Array.isArray(rader)) console.log(`  ${tabell}: ${rader.length} rader`);
}
console.log(`  administratorer: ${brukere.filter((b) => b.erAdministrator === true).length}`);
