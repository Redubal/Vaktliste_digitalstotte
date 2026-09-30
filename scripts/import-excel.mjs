import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const EXCEL_PATH = resolve(APP_ROOT, "Vaktliste_2026-2027_Team_Ost_og_Vest.xlsx");
const DATA_DIR = resolve(APP_ROOT, "data");

mkdirSync(DATA_DIR, { recursive: true });

const workbook = XLSX.read(readFileSync(EXCEL_PATH), { type: "buffer" });

function serialToIso(serial) {
  if (serial === "" || serial === null || serial === undefined) return "";
  if (typeof serial !== "number") return String(serial).trim();
  const d = XLSX.SSF.parse_date_code(serial);
  if (!d) return "";
  const yyyy = String(d.y).padStart(4, "0");
  const mm = String(d.m).padStart(2, "0");
  const dd = String(d.d).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function personId(team, name) {
  return `${slugify(team || "ukjent")}-${slugify(name)}`;
}

function rows(sheetName) {
  const sh = workbook.Sheets[sheetName];
  if (!sh) throw new Error(`Missing sheet: ${sheetName}`);
  return XLSX.utils.sheet_to_json(sh, { header: 1, defval: "" });
}

function writeJson(name, value) {
  const path = resolve(DATA_DIR, name);
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8");
  console.log(`  wrote ${name} (${Array.isArray(value) ? value.length + " items" : "object"})`);
}

// --- Ansatte ---
const ansatteRows = rows("Ansatte");
const ansatte = ansatteRows
  .slice(1)
  .filter((r) => r[0] && String(r[0]).trim())
  .map((r) => {
    const name = String(r[0]).trim();
    const team = String(r[1] || "Ukjent").trim();
    return {
      id: personId(team, name),
      name,
      team,
      location: String(r[2] || "-").trim() || "-",
      role: String(r[3] || "-").trim() || "-",
      activeFrom: serialToIso(r[4]),
      activeTo: serialToIso(r[5]),
      comment: String(r[6] || "").trim(),
      upn: String(r[7] || "").trim(),
      sortOrder: typeof r[8] === "number" ? r[8] : null,
    };
  });

// --- Endringer ---
// Person-navn er unike på tvers av team, så vi slår opp id ved navn.
// Det håndterer at en Øst-ansatt lånes til Vest og får endringen registrert på Vest-arket.
const idByName = new Map(ansatte.map((p) => [p.name.toLowerCase(), p.id]));
const unmatchedNames = new Set();

function parseEndringer(sheetName, team) {
  const rs = rows(sheetName);
  return rs
    .slice(1)
    .filter((r) => r[1] && String(r[1]).trim())
    .map((r, i) => {
      const name = String(r[1]).trim();
      const resolvedId = idByName.get(name.toLowerCase());
      if (!resolvedId) unmatchedNames.add(`${sheetName}: ${name}`);
      return {
        radId: String(r[10] || `${team.toUpperCase()}-AUTO-${i}`).trim(),
        status: String(r[0] || "").trim(),
        person: name,
        personId: resolvedId ?? personId(team, name),
        team,
        fromDate: serialToIso(r[2]),
        toDate: serialToIso(r[3]),
        fromTime: r[4] === "" ? "" : String(r[4]),
        toTime: r[5] === "" ? "" : String(r[5]),
        type: String(r[6] || "").trim(),
        newLocation: String(r[7] || "").trim(),
        comment: String(r[8] || "").trim(),
      };
    });
}
const endringer = [
  ...parseEndringer("Endringer Øst", "Øst"),
  ...parseEndringer("Endringer Vest", "Vest"),
];

// --- Dager ---
const dagerRows = rows("Dager");
const dager = dagerRows
  .slice(1)
  .filter((r) => r[0] !== "" && r[2])
  .map((r) => ({
    fromDate: serialToIso(r[0]),
    toDate: serialToIso(r[1] || r[0]),
    comment: String(r[2]).trim(),
  }));

// --- Lokasjoner ---
const lokRows = rows("Lokasjoner");
const lokasjoner = lokRows
  .slice(1)
  .filter((r) => r[0] && String(r[0]).trim())
  .map((r) => ({
    name: String(r[0]).trim(),
    team: String(r[1] || "").trim(),
  }));

console.log("Importerer fra:", EXCEL_PATH);
console.log("Skriver til:", DATA_DIR);
writeJson("ansatte.json", ansatte);
writeJson("endringer.json", endringer);
writeJson("dager.json", dager);
writeJson("lokasjoner.json", lokasjoner);
if (unmatchedNames.size > 0) {
  console.warn("Advarsel: endringer uten treff mot ansatte:");
  for (const entry of unmatchedNames) console.warn("  -", entry);
}
console.log("Ferdig.");
