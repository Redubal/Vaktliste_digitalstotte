import type { DagRad, Team } from "./domene";
import { lesVaktliste } from "./lager";

export type { Team };

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
  erAdministrator: boolean;
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

export function getDager(): Dag[] {
  return lesVaktliste().dager;
}

/** Bruker + oppsett + lokasjon, slått sammen til én rad per ansatt. */
export function getAnsatte(): Ansatt[] {
  const v = lesVaktliste();
  const brukere = new Map(v.brukere.map((b) => [b.id, b]));
  const lokasjoner = new Map(v.lokasjoner.map((l) => [l.id, l]));
  return v.oppsett
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
          erAdministrator: bruker.erAdministrator === true,
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
  const v = lesVaktliste();
  const brukere = new Map(v.brukere.map((b) => [b.id, b]));
  const lokasjoner = new Map(v.lokasjoner.map((l) => [l.id, l]));
  return v.endringer.map((e) => ({
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
