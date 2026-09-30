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

// Excel lagrer klokkeslett som dagsbrøk (0.4375 = 10:30). Databasen får "HH:MM".
function serialToTime(serial) {
  if (serial === "" || serial === null || serial === undefined) return null;
  const n = Number(serial);
  if (Number.isNaN(n)) return orNull(serial);
  const minutes = Math.round(n * 24 * 60);
  const hh = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
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

function orNull(value) {
  const v = String(value ?? "").trim();
  return v === "" ? null : v;
}

// Team er bare Øst eller Vest; alt annet stopper importen.
const TEAMS = ["Øst", "Vest"];
function teamOf(value, kilde) {
  const v = String(value ?? "").trim().toLowerCase();
  const team = TEAMS.find((t) => t.toLowerCase() === v);
  if (!team) throw new Error(`Ugyldig team «${value}» (${kilde}), må være Øst eller Vest`);
  return team;
}

// Gir unike id-er: første forekomst beholder id-en, resten får -2, -3 ...
function uniqueId(base, used) {
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  used.add(id);
  return id;
}

function rows(sheetName) {
  const sh = workbook.Sheets[sheetName];
  if (!sh) throw new Error(`Missing sheet: ${sheetName}`);
  return XLSX.utils.sheet_to_json(sh, { header: 1, defval: "" });
}

function writeJson(name, value) {
  const path = resolve(DATA_DIR, name);
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8");
  console.log(`  wrote ${name} (${value.length} items)`);
}

// Fem tabeller med surrogatnøkler og fremmednøkler, klare for en senere database:
//   brukere    (id, name, upn)
//   lokasjoner (id, name, team: Øst|Vest)
//   oppsett    (id, brukerId -> brukere, lokasjonId -> lokasjoner, team, role, periode, sortOrder, comment)
//   endringer  (id, brukerId -> brukere, lokasjonId -> lokasjoner, status, periode, tid, type, comment)
//   dager      (id, fromDate, toDate, comment)
// Tomme verdier er null, ikke "". Datoer er ISO (YYYY-MM-DD), klokkeslett er "HH:MM".
const warnings = [];

// --- Lokasjoner ---
const lokasjoner = [];
const lokIdByName = new Map();
const usedLokIds = new Set();
function addLokasjon(rawName, team) {
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1); // stor forbokstav
  const key = name.toLowerCase();
  if (lokIdByName.has(key)) return lokIdByName.get(key);
  const id = uniqueId(slugify(name), usedLokIds);
  lokasjoner.push({ id, name, team });
  lokIdByName.set(key, id);
  return id;
}
for (const r of rows("Lokasjoner").slice(1)) {
  if (r[0] && String(r[0]).trim()) addLokasjon(String(r[0]).trim(), teamOf(r[1], `lokasjon ${r[0]}`));
}
// Bare lokasjoner i arket Lokasjoner gjelder. Ukjent navn (f.eks. manuelt skrevet i en
// endring) gir lokasjonId null og en advarsel; kolonnen tåler ikke fritekst.
function lokasjonId(name, kilde) {
  const n = orNull(name);
  if (!n || n === "-") return null;
  const id = lokIdByName.get(n.toLowerCase());
  if (!id) warnings.push(`Ukjent lokasjon «${n}» (${kilde}) ignorert, lokasjonId er null`);
  return id ?? null;
}

// --- Brukere og oppsett ---
const brukere = [];
const oppsett = [];
const usedBrukerIds = new Set();
const usedOppsettIds = new Set();
const brukerIdByName = new Map();
for (const r of rows("Ansatte").slice(1)) {
  if (!r[0] || !String(r[0]).trim()) continue;
  const name = String(r[0]).trim();
  const brukerId = uniqueId(slugify(name), usedBrukerIds);
  brukerIdByName.set(name.toLowerCase(), brukerId);
  brukere.push({ id: brukerId, name, upn: orNull(r[7]) });

  const activeFrom = serialToIso(r[4]) || null;
  const role = orNull(r[3]);
  oppsett.push({
    id: uniqueId(`${brukerId}-${activeFrom ?? "start"}`, usedOppsettIds),
    brukerId,
    team: teamOf(r[1], `oppsett ${brukerId}`),
    role: role === "-" ? null : role,
    lokasjonId: lokasjonId(r[2], `oppsett ${brukerId}`),
    activeFrom,
    activeTo: serialToIso(r[5]) || null,
    sortOrder: typeof r[8] === "number" ? r[8] : null,
    comment: orNull(r[6]),
  });
}

// --- Endringer ---
// Person-navn er unike på tvers av team, så vi slår opp bruker ved navn.
// Det håndterer at en Øst-ansatt lånes til Vest og får endringen registrert på Vest-arket.
// `team` er arket endringen ble registrert på, ikke brukerens team.
const usedEndringIds = new Set();
function parseEndringer(sheetName, team) {
  return rows(sheetName)
    .slice(1)
    .filter((r) => r[1] && String(r[1]).trim())
    .map((r, i) => {
      const name = String(r[1]).trim();
      const brukerId = brukerIdByName.get(name.toLowerCase());
      if (!brukerId) throw new Error(`${sheetName}: ingen bruker med navn på rad ${i + 2}`);
      const radId = orNull(r[10]) ?? `${slugify(team).toUpperCase()}-AUTO-${i}`;
      const id = uniqueId(radId, usedEndringIds);
      if (id !== radId) warnings.push(`Endring-id ${radId} er brukt flere ganger i Excel, ny rad fikk ${id}`);
      return {
        id,
        brukerId,
        lokasjonId: lokasjonId(r[7], `endring ${id}`),
        status: orNull(r[0]),
        team,
        fromDate: serialToIso(r[2]) || null,
        toDate: serialToIso(r[3]) || null,
        fromTime: serialToTime(r[4]),
        toTime: serialToTime(r[5]),
        type: orNull(r[6]),
        comment: orNull(r[8]),
      };
    });
}
const endringer = [
  ...parseEndringer("Endringer Øst", "Øst"),
  ...parseEndringer("Endringer Vest", "Vest"),
];

// --- Dager ---
const usedDagIds = new Set();
const dager = rows("Dager")
  .slice(1)
  .filter((r) => r[0] !== "" && r[2])
  .map((r) => {
    const fromDate = serialToIso(r[0]);
    const comment = String(r[2]).trim();
    return {
      id: uniqueId(`${fromDate}-${slugify(comment)}`, usedDagIds),
      fromDate,
      toDate: serialToIso(r[1] || r[0]),
      comment,
    };
  });

console.log("Importerer fra:", EXCEL_PATH);
console.log("Skriver til:", DATA_DIR);
writeJson("brukere.json", brukere);
writeJson("lokasjoner.json", lokasjoner);
writeJson("oppsett.json", oppsett);
writeJson("endringer.json", endringer);
writeJson("dager.json", dager);
if (warnings.length > 0) {
  console.warn("Advarsler:");
  for (const w of warnings) console.warn("  -", w);
}
console.log("Ferdig.");
