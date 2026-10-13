// Delt mellom appen og skriptene i scripts/: ingen imports her, bare typer og rene funksjoner.
// Node importerer .ts direkte, så filen må holde seg til syntaks som kan strippes (ingen enum).

/** Eldre versjoner gjøres om ved lesing av `oppgraderVaktliste`; øk og legg til et steg der. */
export const SKJEMA_VERSJON = 5;

/** Rekkefølgen i tabellen er rekkefølgen i teamvelgeren. */
export type Team = {
  id: string;
  name: string;
};

export type Bruker = {
  id: string;
  name: string;
  upn: string | null;
  /** Admintilgang, bevisst atskilt fra jobbrollen i `Oppsett.role`. Byttes mot en Entra-gruppe. */
  erAdministrator?: boolean;
  /** ISO-tid for når personen ble lagt inn i appen; `null` for dem som fantes før loggen («før loggen»). */
  opprettet: string | null;
  /** `false` = deaktivert: vises ikke i planen eller i «Velg deg selv» og har ikke admintilgang. */
  aktiv: boolean;
  /** Id-en i Entra; brukes av synkroniseringen i Fase 16. */
  entraId: string | null;
};

export type Lokasjon = {
  id: string;
  name: string;
  teamId: string;
};

export type Rolle = {
  id: string;
  name: string;
};

export type Status = {
  id: string;
  name: string;
  /** Bare endringer med en status som vises i planen, kommer med i ukeplan og månedsoversikt. */
  visesIPlan: boolean;
};

export const KATEGORIER = [
  { id: "fravaer", navn: "Fravær (får fri-farge)" },
  { id: "lokasjon", navn: "Lokasjon" },
  { id: "annet", navn: "Annet" },
] as const;
export type Kategori = (typeof KATEGORIER)[number]["id"];

export type Endringstype = {
  id: string;
  name: string;
  kategori: Kategori;
};

export type Oppsett = {
  id: string;
  brukerId: string;
  teamId: string;
  rolleId: string | null;
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
  statusId: string | null;
  fromDate: string | null;
  toDate: string | null;
  fromTime: string | null;
  toTime: string | null;
  typeId: string | null;
  comment: string | null;
};

export type DagRad = {
  id: string;
  fromDate: string;
  toDate: string;
  comment: string;
};

/** Hele databasen i én fil, `data/vaktliste.json`. Tabellene har id-er og fremmednøkler som i SQL. */
export type Vaktliste = {
  skjemaVersjon: number;
  /** Teller opp ved hver lagring; brukes til å oppdage at to faner har endret samtidig. */
  revisjon: number;
  sistEndretAv: string | null;
  team: Team[];
  lokasjoner: Lokasjon[];
  roller: Rolle[];
  statuser: Status[];
  endringstyper: Endringstype[];
  brukere: Bruker[];
  oppsett: Oppsett[];
  endringer: EndringRad[];
  dager: DagRad[];
};

export function tomVaktliste(): Vaktliste {
  return {
    skjemaVersjon: SKJEMA_VERSJON,
    revisjon: 0,
    sistEndretAv: null,
    team: [],
    lokasjoner: [],
    roller: [],
    statuser: [],
    endringstyper: [],
    brukere: [],
    oppsett: [],
    endringer: [],
    dager: [],
  };
}

/** Svar fra en handling i Admin: `ok` og en beskjed til skjermen. */
export type Svar = { ok: boolean; melding: string };

export const TEAM_MAKSLENGDE = 60;
export const LOKASJON_MAKSLENGDE = 60;
export const ROLLE_MAKSLENGDE = 60;
export const STATUS_MAKSLENGDE = 60;
export const ENDRINGSTYPE_MAKSLENGDE = 60;

// Kodene er uten æøå: norske tegn har blitt ødelagt stille i verktøykjeder her.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Første ledige id: `base`, deretter `base-2`, `base-3` ... `reserve` brukes når `base` er tom. */
export function ledigId(base: string, brukte: Set<string>, reserve: string): string {
  const grunn = base || reserve;
  let id = grunn;
  for (let n = 2; brukte.has(id); n++) id = `${grunn}-${n}`;
  return id;
}

function nøkkel(navn: string): string {
  return navn.toLocaleLowerCase("nb");
}

function rensNavn(navn: string): string {
  return navn.replace(/\s+/g, " ").trim();
}

/** Felles for navnefeltene i Admin. `andre` er radene som ikke er den som redigeres. */
function sjekkNavn(
  rå: string,
  andre: { name: string }[],
  makslengde: number,
  hva: { bestemt: string; ubestemt: string },
): { feil: string } | { name: string } {
  const name = rensNavn(rå);
  if (!name) return { feil: `${hva.bestemt} må ha et navn.` };
  if (name.length > makslengde) return { feil: `Navnet kan ha opptil ${makslengde} tegn.` };
  if (andre.some((a) => nøkkel(a.name) === nøkkel(name))) {
    return { feil: `Det finnes allerede ${hva.ubestemt} som heter «${name}».` };
  }
  return { name };
}

/** Renser og sjekker feltene fra skjemaet. `andre` er lokasjonene som ikke er den som redigeres. */
export function sjekkLokasjon(
  rå: { name: string; teamId: string },
  andre: Lokasjon[],
  team: Team[],
): { feil: string } | { name: string; teamId: string } {
  const sjekket = sjekkNavn(rå.name, andre, LOKASJON_MAKSLENGDE, {
    bestemt: "Lokasjonen",
    ubestemt: "en lokasjon",
  });
  if ("feil" in sjekket) return sjekket;
  if (!team.some((t) => t.id === rå.teamId)) return { feil: "Velg et team." };
  return { name: sjekket.name, teamId: rå.teamId };
}

/** Verdien i rolle-/lokasjonsvelgeren for masseendring som betyr «fjern». Tom verdi betyr «la stå». */
export const MASSE_INGEN = "__ingen";

/** Sjekker at valgene for en ansatt finnes. Team er påkrevd; rolle og lokasjon kan stå tomme (`null`). */
export function sjekkOppsett(
  rå: { teamId: string; rolleId: string; lokasjonId: string },
  v: Pick<Vaktliste, "team" | "roller" | "lokasjoner">,
): { feil: string } | { teamId: string; rolleId: string | null; lokasjonId: string | null } {
  if (!v.team.some((t) => t.id === rå.teamId)) return { feil: "Velg et team." };
  if (rå.rolleId && !v.roller.some((r) => r.id === rå.rolleId)) return { feil: "Rollen finnes ikke lenger." };
  if (rå.lokasjonId && !v.lokasjoner.some((l) => l.id === rå.lokasjonId)) {
    return { feil: "Lokasjonen finnes ikke lenger." };
  }
  return { teamId: rå.teamId, rolleId: rå.rolleId || null, lokasjonId: rå.lokasjonId || null };
}

/** Renser og sjekker navnet fra skjemaet. `andre` er teamene som ikke er det som redigeres. */
export function sjekkTeam(rå: { name: string }, andre: Team[]): { feil: string } | { name: string } {
  return sjekkNavn(rå.name, andre, TEAM_MAKSLENGDE, { bestemt: "Teamet", ubestemt: "et team" });
}

/** Renser og sjekker navnet fra skjemaet. `andre` er rollene som ikke er den som redigeres. */
export function sjekkRolle(rå: { name: string }, andre: Rolle[]): { feil: string } | { name: string } {
  return sjekkNavn(rå.name, andre, ROLLE_MAKSLENGDE, { bestemt: "Rollen", ubestemt: "en rolle" });
}

/** Renser og sjekker feltene fra skjemaet. `andre` er statusene som ikke er den som redigeres. */
export function sjekkStatus(
  rå: { name: string; visesIPlan: boolean },
  andre: Status[],
): { feil: string } | { name: string; visesIPlan: boolean } {
  const sjekket = sjekkNavn(rå.name, andre, STATUS_MAKSLENGDE, { bestemt: "Statusen", ubestemt: "en status" });
  if ("feil" in sjekket) return sjekket;
  return { name: sjekket.name, visesIPlan: rå.visesIPlan };
}

/** Renser og sjekker feltene fra skjemaet. `andre` er typene som ikke er den som redigeres. */
export function sjekkEndringstype(
  rå: { name: string; kategori: string },
  andre: Endringstype[],
): { feil: string } | { name: string; kategori: Kategori } {
  const sjekket = sjekkNavn(rå.name, andre, ENDRINGSTYPE_MAKSLENGDE, {
    bestemt: "Endringstypen",
    ubestemt: "en endringstype",
  });
  if ("feil" in sjekket) return sjekket;
  const kategori = KATEGORIER.find((k) => k.id === rå.kategori);
  if (!kategori) return { feil: "Velg en kategori." };
  return { name: sjekket.name, kategori: kategori.id };
}

function navnPå(v: Vaktliste, brukerIder: Set<string>): string[] {
  const navn = new Map(v.brukere.map((b) => [b.id, b.name]));
  return [...brukerIder]
    .map((id) => navn.get(id) ?? id)
    .sort((a, b) => a.localeCompare(b, "nb"));
}

/** Navnene på personene som bruker lokasjonen, i oppsett eller endringer. Sortert, uten dubletter. */
export function lokasjonBrukere(v: Vaktliste, lokasjonId: string): string[] {
  const ider = new Set<string>();
  for (const o of v.oppsett) if (o.lokasjonId === lokasjonId) ider.add(o.brukerId);
  for (const e of v.endringer) if (e.lokasjonId === lokasjonId) ider.add(e.brukerId);
  return navnPå(v, ider);
}

/** Navnene på personene som har teamet i et oppsett. Sortert, uten dubletter. */
export function teamPersoner(v: Vaktliste, teamId: string): string[] {
  return navnPå(v, new Set(v.oppsett.filter((o) => o.teamId === teamId).map((o) => o.brukerId)));
}

/** Alt som hindrer sletting: personene i teamet, fulgt av lokasjonene som hører til det. */
export function teamBrukere(v: Vaktliste, teamId: string): string[] {
  const personer = teamPersoner(v, teamId);
  const lokasjoner = v.lokasjoner
    .filter((l) => l.teamId === teamId)
    .map((l) => `lokasjonen ${l.name}`)
    .sort((a, b) => a.localeCompare(b, "nb"));
  return [...personer, ...lokasjoner];
}

/** Navnene på personene som har rollen i et oppsett. Sortert, uten dubletter. */
export function rolleBrukere(v: Vaktliste, rolleId: string): string[] {
  return navnPå(v, new Set(v.oppsett.filter((o) => o.rolleId === rolleId).map((o) => o.brukerId)));
}

/** Navnene på personene som har en endring med statusen. Sortert, uten dubletter. */
export function statusBrukere(v: Vaktliste, statusId: string): string[] {
  return navnPå(v, new Set(v.endringer.filter((e) => e.statusId === statusId).map((e) => e.brukerId)));
}

/** Navnene på personene som har en endring av typen. Sortert, uten dubletter. */
export function endringstypeBrukere(v: Vaktliste, typeId: string): string[] {
  return navnPå(v, new Set(v.endringer.filter((e) => e.typeId === typeId).map((e) => e.brukerId)));
}

/** Beskjed når raden ikke kan slettes fordi noen bruker den; `null` når den kan slettes. */
export function nektSletting(rad: { name: string }, brukere: string[], råd: string): string | null {
  if (brukere.length === 0) return null;
  const synlige = brukere.slice(0, 5).join(", ");
  const rest = brukere.length > 5 ? ` og ${brukere.length - 5} til` : "";
  return `«${rad.name}» kan ikke slettes fordi den brukes av ${synlige}${rest}. ${råd}`;
}

// --- Omgjøring av eldre skjemaversjoner ---

type RåVaktliste = { skjemaVersjon: number; [tabell: string]: unknown };

// 1 → 2: rollen var fritekst på oppsettet og blir en egen tabell. Navn som bare skiller seg
// i store og små bokstaver blir én rolle; første skrivemåte vinner.
function tilVersjon2(v: RåVaktliste): RåVaktliste {
  const roller: Rolle[] = [];
  const idPerNavn = new Map<string, string>();
  const brukte = new Set<string>();
  const oppsett = (v.oppsett as (Omit<Oppsett, "rolleId"> & { role?: string | null })[]).map(
    ({ role, ...o }) => {
      const name = rensNavn(role ?? "");
      if (!name || name === "-") return { ...o, rolleId: null };
      let id = idPerNavn.get(nøkkel(name));
      if (!id) {
        id = ledigId(slugify(name), brukte, "rolle");
        brukte.add(id);
        idPerNavn.set(nøkkel(name), id);
        roller.push({ id, name });
      }
      return { ...o, rolleId: id };
    },
  );
  return { ...v, skjemaVersjon: 2, roller, oppsett };
}

// Typene som før fikk fri-farge i ukeplanen på navn alene (`classifyCelle`); de blir kategori fravær.
const FRAVAER_NAVN = ["ferie", "fri", "avspasering", "fridag / helligdag", "syk"];

// 2 → 3: status og type var fritekst på endringen og blir egne tabeller. Navn som bare skiller seg
// i store og små bokstaver blir én rad; første skrivemåte vinner. Bare «Godkjent» vises i planen,
// som før. En tom status eller type blir null.
function tilVersjon3(v: RåVaktliste): RåVaktliste {
  const statuser: Status[] = [];
  const endringstyper: Endringstype[] = [];
  const statusPerNavn = new Map<string, string>();
  const typePerNavn = new Map<string, string>();
  const statusIder = new Set<string>();
  const typeIder = new Set<string>();
  const endringer = (
    v.endringer as (Omit<EndringRad, "statusId" | "typeId"> & {
      status?: string | null;
      type?: string | null;
    })[]
  ).map(({ status, type, ...e }) => {
    const statusNavn = rensNavn(status ?? "");
    const typeNavn = rensNavn(type ?? "");
    let statusId: string | null = null;
    let typeId: string | null = null;
    if (statusNavn) {
      statusId = statusPerNavn.get(nøkkel(statusNavn)) ?? null;
      if (!statusId) {
        statusId = ledigId(slugify(statusNavn), statusIder, "status");
        statusIder.add(statusId);
        statusPerNavn.set(nøkkel(statusNavn), statusId);
        statuser.push({ id: statusId, name: statusNavn, visesIPlan: statusNavn === "Godkjent" });
      }
    }
    if (typeNavn) {
      typeId = typePerNavn.get(nøkkel(typeNavn)) ?? null;
      if (!typeId) {
        typeId = ledigId(slugify(typeNavn), typeIder, "type");
        typeIder.add(typeId);
        typePerNavn.set(nøkkel(typeNavn), typeId);
        endringstyper.push({
          id: typeId,
          name: typeNavn,
          kategori: FRAVAER_NAVN.includes(nøkkel(typeNavn)) ? "fravaer" : "annet",
        });
      }
    }
    return { ...e, statusId, typeId };
  });
  return { ...v, skjemaVersjon: 3, statuser, endringstyper, endringer };
}

// Teamene fra Excel; de beholder denne rekkefølgen i teamvelgeren (alfabetisk ville gitt Vest først).
const FASTE_TEAM = ["Øst", "Vest"];

// 3 → 4: team var tekst på oppsett, lokasjoner og endringer og blir en egen tabell. Oppsett og
// lokasjoner får `teamId`. På endringer fjernes feltet: team utledes fra personen. Navn som bare
// skiller seg i store og små bokstaver blir ett team; første skrivemåte vinner, men Øst og Vest
// skrives alltid slik. En rad uten team
// stopper omgjøringen, så ingen mister teamet sitt i stillhet.
function tilVersjon4(v: RåVaktliste): RåVaktliste {
  type MedTeam = { id: string; team?: string | null };
  const gamleOppsett = v.oppsett as (Omit<Oppsett, "teamId"> & MedTeam)[];
  const gamleLokasjoner = v.lokasjoner as (Omit<Lokasjon, "teamId"> & MedTeam)[];
  const navnFra = (rad: MedTeam, hva: string): string => {
    const name = rensNavn(rad.team ?? "");
    if (!name) throw new Error(`Kan ikke gjøre om data: ${hva} ${rad.id} mangler team.`);
    return name;
  };
  const navnene = [
    ...gamleOppsett.map((o) => navnFra(o, "oppsettet")),
    ...gamleLokasjoner.map((l) => navnFra(l, "lokasjonen")),
  ];
  const fastePlass = (navn: string) => {
    const i = FASTE_TEAM.findIndex((f) => nøkkel(f) === nøkkel(navn));
    return i === -1 ? FASTE_TEAM.length : i;
  };
  const iRekkefølge = navnene
    .map((navn, i) => ({ navn, i }))
    .sort((a, b) => fastePlass(a.navn) - fastePlass(b.navn) || a.i - b.i);

  const team: Team[] = [];
  const idPerNavn = new Map<string, string>();
  const brukte = new Set<string>();
  for (const { navn } of iRekkefølge) {
    if (idPerNavn.has(nøkkel(navn))) continue;
    const name = FASTE_TEAM.find((f) => nøkkel(f) === nøkkel(navn)) ?? navn;
    const id = ledigId(slugify(name), brukte, "team");
    brukte.add(id);
    idPerNavn.set(nøkkel(navn), id);
    team.push({ id, name });
  }
  const medTeamId = <R extends MedTeam>(rad: R, hva: string) => {
    const teamId = idPerNavn.get(nøkkel(navnFra(rad, hva)))!;
    const kopi: Omit<R, "team"> & { team?: unknown } = { ...rad };
    delete kopi.team;
    return { ...kopi, teamId };
  };
  const oppsett = gamleOppsett.map((o) => medTeamId(o, "oppsettet"));
  const lokasjoner = gamleLokasjoner.map((l) => medTeamId(l, "lokasjonen"));
  const endringer = (v.endringer as (EndringRad & { team?: unknown })[]).map((e) => {
    const kopi = { ...e };
    delete kopi.team;
    return kopi;
  });
  return { ...v, skjemaVersjon: 4, team, oppsett, lokasjoner, endringer };
}

// 4 → 5: personene får `opprettet` (null = fantes før loggen), `aktiv` (alle er aktive) og
// `entraId` (null). Verdier som allerede står der, beholdes.
function tilVersjon5(v: RåVaktliste): RåVaktliste {
  const brukere = (v.brukere as (Partial<Bruker> & { id: string })[]).map((b) => ({
    ...b,
    opprettet: b.opprettet ?? null,
    aktiv: b.aktiv ?? true,
    entraId: b.entraId ?? null,
  }));
  return { ...v, skjemaVersjon: 5, brukere };
}

/** Sjekker en endring av adminstatus og aktiv for en person. Nekter at man tar fra seg selv tilgangen. */
export function sjekkAnsattStatus(
  rå: { aktiv: boolean; erAdministrator: boolean },
  personId: string,
  jegId: string,
): { feil: string } | { aktiv: boolean; erAdministrator: boolean } {
  if (personId === jegId && !rå.aktiv) return { feil: "Du kan ikke deaktivere deg selv." };
  if (personId === jegId && !rå.erAdministrator) {
    return { feil: "Du kan ikke ta bort din egen administratortilgang." };
  }
  return { aktiv: rå.aktiv, erAdministrator: rå.erAdministrator };
}

/**
 * Gjør om innholdet i en eldre skjemaversjon til gjeldende, ett steg om gangen. Endrer ikke
 * `revisjon`. Lagres først når noen lagrer; sikkerhetskopien tas da av den gamle fila.
 */
export function oppgraderVaktliste(rå: RåVaktliste): Vaktliste {
  const fra = rå.skjemaVersjon;
  let v = rå;
  if (v.skjemaVersjon === 1) v = tilVersjon2(v);
  if (v.skjemaVersjon === 2) v = tilVersjon3(v);
  if (v.skjemaVersjon === 3) v = tilVersjon4(v);
  if (v.skjemaVersjon === 4) v = tilVersjon5(v);
  if (v.skjemaVersjon !== SKJEMA_VERSJON) {
    throw new Error(`data/vaktliste.json har skjemaversjon ${fra}, appen forventer ${SKJEMA_VERSJON}.`);
  }
  return v as Vaktliste;
}
