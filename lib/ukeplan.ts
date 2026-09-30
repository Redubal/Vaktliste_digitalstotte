import type { Ansatt, Dag, Endring, Team } from "./vaktlista";
import {
  addDays,
  formatIsoDate,
  isoWeek,
  isoWeekToMonday,
  weekdaysMonToFri,
} from "./uker";

export type TeamFilter = Team | "Begge";

export type UkeplanCelle = {
  iso: string;
  primær: string;
  endring?: Endring;
  utenforPeriode?: boolean;
};

export type UkeplanRad = {
  person: Ansatt;
  celler: UkeplanCelle[];
};

export type Ukeplan = {
  aar: number;
  uke: number;
  mandag: Date;
  dager: Date[];
  merknader: string[][];
  rader: UkeplanRad[];
};

function iso(date: Date): string {
  return formatIsoDate(date);
}

function overlapsDate(fra: string, til: string, dagIso: string): boolean {
  if (!fra) return false;
  const til2 = til || fra;
  return dagIso >= fra && dagIso <= til2;
}

function endringLabel(endring: Endring): string {
  if (endring.newLocation) return endring.newLocation;
  return endring.type || "Endring";
}

function inActivePeriod(person: Ansatt, dagIso: string): boolean {
  if (!person.activeFrom) return true;
  if (dagIso < person.activeFrom) return false;
  if (person.activeTo && dagIso > person.activeTo) return false;
  return true;
}

export function beregnUkeplan(opts: {
  team: TeamFilter;
  aar: number;
  uke: number;
  ansatte: Ansatt[];
  endringer: Endring[];
  dager: Dag[];
}): Ukeplan {
  const mandag = isoWeekToMonday(opts.aar, opts.uke);
  const dager = weekdaysMonToFri(mandag);
  const dagIso = dager.map(iso);

  const merknader: string[][] = dager.map(() => []);
  for (const d of opts.dager) {
    for (let i = 0; i < dagIso.length; i++) {
      if (overlapsDate(d.fromDate, d.toDate, dagIso[i])) {
        merknader[i].push(d.comment);
      }
    }
  }

  const godkjentePerPerson = new Map<string, Endring[]>();
  for (const e of opts.endringer) {
    if (e.status !== "Godkjent") continue;
    const arr = godkjentePerPerson.get(e.personId);
    if (arr) arr.push(e);
    else godkjentePerPerson.set(e.personId, [e]);
  }

  const rader: UkeplanRad[] = opts.ansatte
    .filter((p) => opts.team === "Begge" || p.team === opts.team)
    .filter((p) => {
      const week = dagIso.some((d) => inActivePeriod(p, d));
      return week;
    })
    .sort((a, b) => {
      if (opts.team === "Begge" && a.team !== b.team) {
        return a.team.localeCompare(b.team, "nb");
      }
      const ao = a.sortOrder ?? Number.POSITIVE_INFINITY;
      const bo = b.sortOrder ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, "nb");
    })
    .map((person) => {
      const personEndringer = godkjentePerPerson.get(person.id) ?? [];
      const celler: UkeplanCelle[] = dagIso.map((di) => {
        if (!inActivePeriod(person, di)) {
          return { iso: di, primær: "—", utenforPeriode: true };
        }
        const match = personEndringer.find((e) => overlapsDate(e.fromDate, e.toDate, di));
        if (match) {
          return { iso: di, primær: endringLabel(match), endring: match };
        }
        return { iso: di, primær: person.location || "—" };
      });
      return { person, celler };
    });

  return {
    aar: opts.aar,
    uke: opts.uke,
    mandag,
    dager,
    merknader,
    rader,
  };
}

/** Klassifiser hvordan en celle skal styles i UI. */
export type CelleType = "lokasjon" | "endring-lokasjon" | "endring-status" | "fri" | "utenfor";

export function classifyCelle(celle: UkeplanCelle): CelleType {
  if (celle.utenforPeriode) return "utenfor";
  if (!celle.endring) return "lokasjon";
  if (celle.endring.newLocation) return "endring-lokasjon";
  const type = (celle.endring.type || "").toLowerCase();
  if (["ferie", "fri", "avspasering", "fridag / helligdag", "syk"].includes(type)) return "fri";
  return "endring-status";
}

export const TEAMS: TeamFilter[] = ["Øst", "Vest", "Begge"];

export function forrigeUke(aar: number, uke: number): { aar: number; uke: number } {
  const prev = addDays(isoWeekToMonday(aar, uke), -7);
  const { year, week } = isoWeek(prev);
  return { aar: year, uke: week };
}

export function nesteUke(aar: number, uke: number): { aar: number; uke: number } {
  const next = addDays(isoWeekToMonday(aar, uke), 7);
  const { year, week } = isoWeek(next);
  return { aar: year, uke: week };
}
