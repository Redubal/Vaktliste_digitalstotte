import fs from "node:fs";
import path from "node:path";

export type Team = "Øst" | "Vest";

export type Ansatt = {
  id: string;
  name: string;
  team: Team;
  location: string;
  role: string;
  activeFrom: string;
  activeTo: string;
  comment: string;
  upn: string;
  sortOrder: number | null;
};

export type Endring = {
  radId: string;
  status: "Godkjent" | "Forespurt" | "Avslått" | "Utgår" | string;
  person: string;
  personId: string;
  team: Team;
  fromDate: string;
  toDate: string;
  fromTime: string;
  toTime: string;
  type: string;
  newLocation: string;
  comment: string;
};

export type Dag = {
  fromDate: string;
  toDate: string;
  comment: string;
};

export type Lokasjon = {
  name: string;
  team: string;
};

/**
 * Legacy alias for early consumers of the ansatt-katalogen.
 * Fjernes når VaktlisteClient migreres til å bruke Ansatt direkte.
 */
export type Employee = Ansatt;

function readJson<T>(fileName: string, fallback: T): T {
  const filePath = path.resolve(process.cwd(), "data", fileName);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getAnsatte(): Ansatt[] {
  const raw = readJson<Ansatt[]>("ansatte.json", []);
  return raw
    .filter((p) => p.name && p.name.trim())
    .map((p) => ({
      ...p,
      team: (p.team || "Øst") as Team,
      location: p.location || "-",
      role: p.role || "-",
      comment: p.comment || "",
      upn: p.upn || "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));
}

export function getEmployees(): Employee[] {
  return getAnsatte();
}

export function getEndringer(): Endring[] {
  return readJson<Endring[]>("endringer.json", []);
}

export function getDager(): Dag[] {
  return readJson<Dag[]>("dager.json", []);
}

export function getLokasjoner(): Lokasjon[] {
  return readJson<Lokasjon[]>("lokasjoner.json", []);
}
