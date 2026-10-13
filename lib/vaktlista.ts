import { virkningFor, type DagRad, type Kategori, type Team, type Virkning } from "./domene";
import { lesVaktliste } from "./lager";

export type { Team };

// --- Visninger som UI og ukeplan bruker: rader slått sammen og tomme verdier som "" ---

export type Ansatt = {
  id: string;
  name: string;
  teamId: string;
  /** Navnet på teamet, til visning. Filtrering og telling går på `teamId`. */
  team: string;
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
  /** Fra statusen: godkjent og venter vises i ukeplanen (venter med merke), avvist vises ikke. */
  virkning: Virkning;
  person: string;
  personId: string;
  fromDate: string;
  toDate: string;
  fromTime: string;
  toTime: string;
  type: string;
  /** Fra endringstypen; `null` når endringen ikke har en type. */
  kategori: Kategori | null;
  /** Fra endringstypen: egen farge (`#rrggbb`), eller `null` for fargen kategorien gir. */
  farge: string | null;
  newLocation: string;
  comment: string;
  /** Id-ene bak `type` og `newLocation`, til vinduet som retter endringen. Tom = ingen. */
  typeId: string;
  lokasjonId: string;
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

/** Teamene i tabellens rekkefølge, som er rekkefølgen i teamvelgeren. */
export function getTeam(): Team[] {
  return lesVaktliste().team;
}

/**
 * Bruker + oppsett + lokasjon, slått sammen til én rad per ansatt. Deaktiverte er ikke med: de
 * forsvinner dermed fra planen, fra «Velg deg selv» og mister admintilgang. Admin → Ansatte
 * leser tabellene direkte for å vise dem.
 */
export function getAnsatte(): Ansatt[] {
  const v = lesVaktliste();
  const brukere = new Map(v.brukere.map((b) => [b.id, b]));
  const lokasjoner = new Map(v.lokasjoner.map((l) => [l.id, l]));
  const roller = new Map(v.roller.map((r) => [r.id, r]));
  const team = new Map(v.team.map((t) => [t.id, t]));
  return v.oppsett
    .flatMap((o) => {
      const bruker = brukere.get(o.brukerId);
      if (!bruker || !bruker.name.trim() || !bruker.aktiv) return [];
      return [
        {
          id: bruker.id,
          name: bruker.name,
          teamId: o.teamId,
          team: team.get(o.teamId)?.name ?? o.teamId,
          location: (o.lokasjonId && lokasjoner.get(o.lokasjonId)?.name) || "-",
          role: (o.rolleId && roller.get(o.rolleId)?.name) || "-",
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
  const statuser = new Map(v.statuser.map((s) => [s.id, s]));
  const typer = new Map(v.endringstyper.map((t) => [t.id, t]));
  return v.endringer.map((e) => ({
    id: e.id,
    status: (e.statusId && statuser.get(e.statusId)?.name) || "",
    virkning: virkningFor(e.statusId, v.statuser),
    person: brukere.get(e.brukerId)?.name ?? "",
    personId: e.brukerId,
    fromDate: e.fromDate ?? "",
    toDate: e.toDate ?? "",
    fromTime: e.fromTime ?? "",
    toTime: e.toTime ?? "",
    type: (e.typeId && typer.get(e.typeId)?.name) || "",
    kategori: (e.typeId && typer.get(e.typeId)?.kategori) || null,
    farge: (e.typeId && typer.get(e.typeId)?.farge) || null,
    newLocation: (e.lokasjonId && lokasjoner.get(e.lokasjonId)?.name) || "",
    comment: e.comment ?? "",
    typeId: e.typeId ?? "",
    lokasjonId: e.lokasjonId ?? "",
  }));
}

/** En egen endring, med begrunnelsen fra «Avvis» (tom når den ikke er avvist eller mangler grunn). */
export type MinEndring = Endring & { avvistGrunn: string };

/**
 * Endringene til én person, nyeste først. Begrunnelsen for avvisning er bare med her, ikke i
 * `getEndringer`, som sendes til alle: den kan handle om personen og skal bare vises til dem.
 */
export function getMineEndringer(brukerId: string): MinEndring[] {
  const grunner = new Map(lesVaktliste().endringer.map((e) => [e.id, e.avvistGrunn ?? ""]));
  return getEndringer()
    .filter((e) => e.personId === brukerId)
    .map((e) => ({ ...e, avvistGrunn: e.virkning === "avvist" ? (grunner.get(e.id) ?? "") : "" }))
    .sort((a, b) => b.fromDate.localeCompare(a.fromDate) || b.fromTime.localeCompare(a.fromTime));
}
