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

function godkjentePerPerson(endringer: Endring[]): Map<string, Endring[]> {
  const map = new Map<string, Endring[]>();
  for (const e of endringer) {
    if (e.status !== "Godkjent") continue;
    const arr = map.get(e.personId);
    if (arr) arr.push(e);
    else map.set(e.personId, [e]);
  }
  return map;
}

function beregnCelle(person: Ansatt, dagIso: string, personEndringer: Endring[]): UkeplanCelle {
  if (!inActivePeriod(person, dagIso)) {
    return { iso: dagIso, primær: "—", utenforPeriode: true };
  }
  const match = personEndringer.find((e) => overlapsDate(e.fromDate, e.toDate, dagIso));
  if (match) return { iso: dagIso, primær: endringLabel(match), endring: match };
  return { iso: dagIso, primær: person.location || "—" };
}

function sorterAnsatte(ansatte: Ansatt[], team: TeamFilter): Ansatt[] {
  return [...ansatte].sort((a, b) => {
    if (team === "Begge" && a.team !== b.team) return a.team.localeCompare(b.team, "nb");
    const ao = a.sortOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.sortOrder ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name, "nb");
  });
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

  const endringerPerPerson = godkjentePerPerson(opts.endringer);

  const rader: UkeplanRad[] = sorterAnsatte(opts.ansatte, opts.team)
    .filter((p) => opts.team === "Begge" || p.team === opts.team)
    .filter((p) => dagIso.some((d) => inActivePeriod(p, d)))
    .map((person) => {
      const personEndringer = endringerPerPerson.get(person.id) ?? [];
      return { person, celler: dagIso.map((di) => beregnCelle(person, di, personEndringer)) };
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

export type Maaned = {
  aar: number;
  maaned: number; // 1–12
  dager: Date[]; // man–fre
  merknader: string[][];
  rader: UkeplanRad[];
};

/** Forenklet månedsoversikt: samme celleregler som ukeplanen, men bare hverdager og én rad per person. */
export function beregnMaaned(opts: {
  team: TeamFilter;
  aar: number;
  maaned: number;
  ansatte: Ansatt[];
  endringer: Endring[];
  dager: Dag[];
}): Maaned {
  const dager: Date[] = [];
  for (let d = new Date(Date.UTC(opts.aar, opts.maaned - 1, 1)); d.getUTCMonth() === opts.maaned - 1; d = addDays(d, 1)) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) dager.push(d);
  }
  const dagIso = dager.map(iso);

  const merknader: string[][] = dagIso.map((di) =>
    opts.dager.filter((d) => overlapsDate(d.fromDate, d.toDate, di)).map((d) => d.comment),
  );

  const endringerPerPerson = godkjentePerPerson(opts.endringer);
  const rader: UkeplanRad[] = sorterAnsatte(opts.ansatte, opts.team)
    .filter((p) => opts.team === "Begge" || p.team === opts.team)
    .filter((p) => dagIso.some((d) => inActivePeriod(p, d)))
    .map((person) => {
      const personEndringer = endringerPerPerson.get(person.id) ?? [];
      return { person, celler: dagIso.map((di) => beregnCelle(person, di, personEndringer)) };
    });

  return { aar: opts.aar, maaned: opts.maaned, dager, merknader, rader };
}

export function forrigeMaaned(aar: number, maaned: number): { aar: number; maaned: number } {
  return maaned === 1 ? { aar: aar - 1, maaned: 12 } : { aar, maaned: maaned - 1 };
}

export function nesteMaaned(aar: number, maaned: number): { aar: number; maaned: number } {
  return maaned === 12 ? { aar: aar + 1, maaned: 1 } : { aar, maaned: maaned + 1 };
}
