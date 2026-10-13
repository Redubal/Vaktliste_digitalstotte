// Delt mellom appen og skriptene i scripts/: ingen imports her, bare typer og rene funksjoner.
// Node importerer .ts direkte, så filen må holde seg til syntaks som kan strippes (ingen enum).

/** Eldre versjoner gjøres om ved lesing av `oppgraderVaktliste`; øk og legg til et steg der. */
export const SKJEMA_VERSJON = 3;

export const TEAM = ["Øst", "Vest"] as const;
export type Team = (typeof TEAM)[number];

export type Bruker = {
  id: string;
  name: string;
  upn: string | null;
  /** Admintilgang, bevisst atskilt fra jobbrollen i `Oppsett.role`. Byttes mot en Entra-gruppe. */
  erAdministrator?: boolean;
};

export type Lokasjon = {
  id: string;
  name: string;
  team: Team;
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
  team: Team;
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
  team: Team;
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
  rå: { name: string; team: string },
  andre: Lokasjon[],
): { feil: string } | { name: string; team: Team } {
  const sjekket = sjekkNavn(rå.name, andre, LOKASJON_MAKSLENGDE, {
    bestemt: "Lokasjonen",
    ubestemt: "en lokasjon",
  });
  if ("feil" in sjekket) return sjekket;
  const team = TEAM.find((t) => t === rå.team);
  if (!team) return { feil: "Velg team Øst eller Vest." };
  return { name: sjekket.name, team };
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

/**
 * Gjør om innholdet i en eldre skjemaversjon til gjeldende, ett steg om gangen. Endrer ikke
 * `revisjon`. Lagres først når noen lagrer; sikkerhetskopien tas da av den gamle fila.
 */
export function oppgraderVaktliste(rå: RåVaktliste): Vaktliste {
  const fra = rå.skjemaVersjon;
  let v = rå;
  if (v.skjemaVersjon === 1) v = tilVersjon2(v);
  if (v.skjemaVersjon === 2) v = tilVersjon3(v);
  if (v.skjemaVersjon !== SKJEMA_VERSJON) {
    throw new Error(`data/vaktliste.json har skjemaversjon ${fra}, appen forventer ${SKJEMA_VERSJON}.`);
  }
  return v as Vaktliste;
}
