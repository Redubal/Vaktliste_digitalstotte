// Delt mellom appen og skriptene i scripts/: ingen imports her, bare typer og rene funksjoner.
// Node importerer .ts direkte, så filen må holde seg til syntaks som kan strippes (ingen enum).

export const SKJEMA_VERSJON = 1;

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

/** Hele databasen i én fil, `data/vaktliste.json`. Tabellene har id-er og fremmednøkler som i SQL. */
export type Vaktliste = {
  skjemaVersjon: number;
  /** Teller opp ved hver lagring; brukes til å oppdage at to faner har endret samtidig. */
  revisjon: number;
  sistEndretAv: string | null;
  lokasjoner: Lokasjon[];
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
    brukere: [],
    oppsett: [],
    endringer: [],
    dager: [],
  };
}

/** Svar fra en handling i Admin: `ok` og en beskjed til skjermen. */
export type Svar = { ok: boolean; melding: string };

export const LOKASJON_MAKSLENGDE = 60;

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

/** Første ledige id: `base`, deretter `base-2`, `base-3` ... */
export function ledigId(base: string, brukte: Set<string>): string {
  const grunn = base || "lokasjon";
  let id = grunn;
  for (let n = 2; brukte.has(id); n++) id = `${grunn}-${n}`;
  return id;
}

function nøkkel(navn: string): string {
  return navn.toLocaleLowerCase("nb");
}

/** Renser og sjekker feltene fra skjemaet. `andre` er lokasjonene som ikke er den som redigeres. */
export function sjekkLokasjon(
  rå: { name: string; team: string },
  andre: Lokasjon[],
): { feil: string } | { name: string; team: Team } {
  const name = rå.name.replace(/\s+/g, " ").trim();
  if (!name) return { feil: "Lokasjonen må ha et navn." };
  if (name.length > LOKASJON_MAKSLENGDE) {
    return { feil: `Navnet kan ha opptil ${LOKASJON_MAKSLENGDE} tegn.` };
  }
  const team = TEAM.find((t) => t === rå.team);
  if (!team) return { feil: "Velg team Øst eller Vest." };
  if (andre.some((l) => nøkkel(l.name) === nøkkel(name))) {
    return { feil: `Det finnes allerede en lokasjon som heter «${name}».` };
  }
  return { name, team };
}

/** Navnene på personene som bruker lokasjonen, i oppsett eller endringer. Sortert, uten dubletter. */
export function lokasjonBrukere(v: Vaktliste, lokasjonId: string): string[] {
  const ider = new Set<string>();
  for (const o of v.oppsett) if (o.lokasjonId === lokasjonId) ider.add(o.brukerId);
  for (const e of v.endringer) if (e.lokasjonId === lokasjonId) ider.add(e.brukerId);
  const navn = new Map(v.brukere.map((b) => [b.id, b.name]));
  return [...ider]
    .map((id) => navn.get(id) ?? id)
    .sort((a, b) => a.localeCompare(b, "nb"));
}

/** Beskjed når lokasjonen ikke kan slettes fordi noen bruker den; `null` når den kan slettes. */
export function nektSletting(v: Vaktliste, lokasjon: Lokasjon): string | null {
  const brukere = lokasjonBrukere(v, lokasjon.id);
  if (brukere.length === 0) return null;
  const synlige = brukere.slice(0, 5).join(", ");
  const rest = brukere.length > 5 ? ` og ${brukere.length - 5} til` : "";
  return `«${lokasjon.name}» kan ikke slettes fordi den brukes av ${synlige}${rest}. Bytt lokasjon hos dem først.`;
}
