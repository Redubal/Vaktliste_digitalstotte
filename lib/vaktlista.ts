import fs from "node:fs";
import path from "node:path";

export type Team = "Øst" | "Vest";

// --- Rader slik de ligger i data/*.json (én fil per tabell, samme form som i en database) ---

export type Bruker = {
  id: string;
  name: string;
  upn: string | null;
};

export type Lokasjon = {
  id: string;
  name: string;
  team: Team;
};

export type Oppsett = {
  id: string;
  brukerId: string;
  team: Team;
  role: string | null;
  lokasjonId: string | null;
  activeFrom: string | null;
  activeTo: string | null;
  sortOrder: number | null;
  comment: string | null;
};

export type EndringRad = {
  id: string;
  brukerId: string;
  lokasjonId: string | null;
  status: "Godkjent" | "Forespurt" | "Avslått" | "Utgår" | string | null;
  team: Team;
  fromDate: string | null;
  toDate: string | null;
  fromTime: string | null;
  toTime: string | null;
  type: string | null;
  comment: string | null;
};

export type DagRad = {
  id: string;
  fromDate: string;
  toDate: string;
  comment: string;
};

// --- Visninger som UI og ukeplan bruker: rader slått sammen og tomme verdier som "" ---

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
  id: string;
  status: string;
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

export type Dag = DagRad;

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

export function getBrukere(): Bruker[] {
  return readJson<Bruker[]>("brukere.json", []);
}

export function getLokasjoner(): Lokasjon[] {
  return readJson<Lokasjon[]>("lokasjoner.json", []);
}

export function getOppsett(): Oppsett[] {
  return readJson<Oppsett[]>("oppsett.json", []);
}

export function getDager(): Dag[] {
  return readJson<DagRad[]>("dager.json", []);
}

/** Bruker + oppsett + lokasjon, slått sammen til én rad per ansatt. */
export function getAnsatte(): Ansatt[] {
  const brukere = new Map(getBrukere().map((b) => [b.id, b]));
  const lokasjoner = new Map(getLokasjoner().map((l) => [l.id, l]));
  return getOppsett()
    .flatMap((o) => {
      const bruker = brukere.get(o.brukerId);
      if (!bruker || !bruker.name.trim()) return [];
      return [
        {
          id: bruker.id,
          name: bruker.name,
          team: o.team,
          location: (o.lokasjonId && lokasjoner.get(o.lokasjonId)?.name) || "-",
          role: o.role ?? "-",
          activeFrom: o.activeFrom ?? "",
          activeTo: o.activeTo ?? "",
          comment: o.comment ?? "",
          upn: bruker.upn ?? "",
          sortOrder: o.sortOrder,
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));
}

export function getEmployees(): Employee[] {
  return getAnsatte();
}

/** Endringer med bruker- og lokasjonsnavn slått opp. */
export function getEndringer(): Endring[] {
  const brukere = new Map(getBrukere().map((b) => [b.id, b]));
  const lokasjoner = new Map(getLokasjoner().map((l) => [l.id, l]));
  return readJson<EndringRad[]>("endringer.json", []).map((e) => ({
    id: e.id,
    status: e.status ?? "",
    person: brukere.get(e.brukerId)?.name ?? "",
    personId: e.brukerId,
    team: e.team,
    fromDate: e.fromDate ?? "",
    toDate: e.toDate ?? "",
    fromTime: e.fromTime ?? "",
    toTime: e.toTime ?? "",
    type: e.type ?? "",
    newLocation: (e.lokasjonId && lokasjoner.get(e.lokasjonId)?.name) || "",
    comment: e.comment ?? "",
  }));
}
