// Delt mellom appen og skriptene i scripts/: ingen imports her, bare typer og rene funksjoner.
// Node importerer .ts direkte, så filen må holde seg til syntaks som kan strippes (ingen enum).

/** Eldre versjoner gjøres om ved lesing av `oppgraderVaktliste`; øk og legg til et steg der. */
export const SKJEMA_VERSJON = 13;

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

// Kodene er uten æøå: norske tegn har blitt ødelagt stille i verktøykjeder her.
export const VIRKNINGER = [
  { id: "godkjent", navn: "Godkjent" },
  { id: "venter", navn: "Venter på godkjenning" },
  { id: "avvist", navn: "Avvist" },
] as const;
export type Virkning = (typeof VIRKNINGER)[number]["id"];

export type Status = {
  id: string;
  name: string;
  /**
   * Hva statusen betyr. Godkjent og venter vises i ukeplan og månedsoversikt (venter med merke);
   * avvist vises ikke. Godkjenningslisten i Admin viser dem som venter.
   */
  virkning: Virkning;
};

/** Virkningen til en endring. En endring uten status (eller med en status som er borte) venter. */
export function virkningFor(statusId: string | null, statuser: Status[]): Virkning {
  return statuser.find((s) => s.id === statusId)?.virkning ?? "venter";
}

/** Statusen en endring får når den godkjennes: den første godkjente i navnerekkefølge. */
export function godkjentStatus(statuser: Status[]): Status | null {
  const godkjente = statuser
    .filter((s) => s.virkning === "godkjent")
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));
  return godkjente[0] ?? null;
}

/** Godkjenner endringen i `v`. Gir feilmelding, eller `null` når den er godkjent. */
export function godkjennEndring(v: Vaktliste, endringId: string): string | null {
  const endring = v.endringer.find((e) => e.id === endringId);
  if (!endring) return "Endringen finnes ikke lenger. Last siden på nytt.";
  const virkning = virkningFor(endring.statusId, v.statuser);
  if (virkning === "godkjent") return "Endringen er allerede godkjent.";
  if (virkning === "avvist") return "Endringen er avvist og kan ikke godkjennes herfra.";
  const status = godkjentStatus(v.statuser);
  if (!status) {
    return "Ingen status har virkningen «Godkjent». Legg til en i Admin → Endringstyper og statuser.";
  }
  endring.statusId = status.id;
  return null;
}

/** Statusen en endring får når den avvises: den første avviste i navnerekkefølge. */
export function avvistStatus(statuser: Status[]): Status | null {
  const avviste = statuser
    .filter((s) => s.virkning === "avvist")
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));
  return avviste[0] ?? null;
}

export const AVVIST_GRUNN_MAKSLENGDE = 200;

/**
 * Avviser en endring som venter, med en valgfri begrunnelse. Gir feilmelding, eller `null` når
 * den er avvist. En godkjent endring avvises ikke herfra: den rettes eller slettes i vinduet.
 */
export function avvisEndring(v: Vaktliste, endringId: string, grunn: string): string | null {
  const endring = v.endringer.find((e) => e.id === endringId);
  if (!endring) return "Endringen finnes ikke lenger. Last siden på nytt.";
  const virkning = virkningFor(endring.statusId, v.statuser);
  if (virkning === "avvist") return "Endringen er allerede avvist.";
  if (virkning === "godkjent") return "Endringen er allerede godkjent og kan ikke avvises herfra.";
  const avvistGrunn = rensNavn(grunn);
  if (avvistGrunn.length > AVVIST_GRUNN_MAKSLENGDE) {
    return `Begrunnelsen kan ha opptil ${AVVIST_GRUNN_MAKSLENGDE} tegn.`;
  }
  const status = avvistStatus(v.statuser);
  if (!status) {
    return "Ingen status har virkningen «Avvist». Legg til en i Admin → Endringstyper og statuser.";
  }
  endring.statusId = status.id;
  endring.avvistGrunn = avvistGrunn || null;
  return null;
}

/** Statusen en endring fra en ansatt får: den første som venter, i navnerekkefølge. `null` venter også. */
export function venterStatus(statuser: Status[]): Status | null {
  const ventende = statuser
    .filter((s) => s.virkning === "venter")
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));
  return ventende[0] ?? null;
}

export const ENDRING_KOMMENTAR_MAKSLENGDE = 200;

/** Den som legger inn, retter eller sletter en endring i vaktlista. */
export type Aktør = { id: string; erAdmin: boolean };

/** Feltene fra vinduet for én endring, som tekst. Tom til-dato = samme dag som fra-datoen. */
export type EndringSkjema = {
  typeId: string;
  lokasjonId: string;
  fromDate: string;
  toDate: string;
  comment: string;
};

function gyldigDato(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

/**
 * Sjekker feltene for en endring for `brukerId`. En ansatt kan bare legge inn for seg selv;
 * en administrator for alle. Lokasjon kreves når typen er en lokasjonstype, og kan ellers stå tom.
 */
function sjekkEndring(
  rå: EndringSkjema,
  brukerId: string,
  v: Vaktliste,
  aktør: Aktør,
): { feil: string } | Pick<EndringRad, "brukerId" | "typeId" | "lokasjonId" | "fromDate" | "toDate" | "comment"> {
  if (!aktør.erAdmin && brukerId !== aktør.id) return { feil: "Du kan bare legge inn endringer for deg selv." };
  if (!v.brukere.some((b) => b.id === brukerId && b.aktiv)) {
    return { feil: "Personen finnes ikke lenger. Last siden på nytt." };
  }
  const type = v.endringstyper.find((t) => t.id === rå.typeId);
  if (!type) return { feil: "Velg hva endringen gjelder." };
  if (rå.lokasjonId && !v.lokasjoner.some((l) => l.id === rå.lokasjonId)) {
    return { feil: "Lokasjonen finnes ikke lenger. Last siden på nytt." };
  }
  if (type.kategori === "lokasjon" && !rå.lokasjonId) return { feil: "Velg ny lokasjon." };
  if (!gyldigDato(rå.fromDate)) return { feil: "Velg en fra-dato." };
  const toDate = rå.toDate || rå.fromDate;
  if (!gyldigDato(toDate)) return { feil: "Til-datoen er ikke en gyldig dato." };
  if (toDate < rå.fromDate) return { feil: "Til-datoen kan ikke være før fra-datoen." };
  const comment = rensNavn(rå.comment);
  if (comment.length > ENDRING_KOMMENTAR_MAKSLENGDE) {
    return { feil: `Kommentaren kan ha opptil ${ENDRING_KOMMENTAR_MAKSLENGDE} tegn.` };
  }
  return { brukerId, typeId: type.id, lokasjonId: rå.lokasjonId || null, fromDate: rå.fromDate, toDate, comment: comment || null };
}

/** Kan `aktør` rette endringen? En ansatt: bare egne som venter. En administrator: alle. */
export function kanEndreEndring(
  endring: { brukerId: string; virkning: Virkning },
  aktør: Aktør,
): boolean {
  return aktør.erAdmin || (endring.brukerId === aktør.id && endring.virkning === "venter");
}

/** Kan `aktør` slette endringer? Bare en administrator; en ansatt retter i stedet. */
export function kanSletteEndring(aktør: Aktør): boolean {
  return aktør.erAdmin;
}

function finnEndringÅEndre(v: Vaktliste, endringId: string, aktør: Aktør): { feil: string } | { endring: EndringRad } {
  const endring = v.endringer.find((e) => e.id === endringId);
  if (!endring) return { feil: "Endringen finnes ikke lenger. Last siden på nytt." };
  const virkning = virkningFor(endring.statusId, v.statuser);
  if (!kanEndreEndring({ brukerId: endring.brukerId, virkning }, aktør)) {
    return {
      feil:
        endring.brukerId !== aktør.id
          ? "Du kan bare endre dine egne endringer."
          : "Endringen er allerede behandlet. Bare en administrator kan endre den nå.",
    };
  }
  return { endring };
}

/**
 * Legger til en endring for `brukerId`. Fra en administrator er den godkjent med en gang;
 * fra en ansatt venter den på godkjenning. Gir feilmelding, eller `null` når den er lagt til.
 */
export function leggTilEndring(v: Vaktliste, brukerId: string, rå: EndringSkjema, aktør: Aktør): string | null {
  const sjekket = sjekkEndring(rå, brukerId, v, aktør);
  if ("feil" in sjekket) return sjekket.feil;
  let statusId: string | null;
  if (aktør.erAdmin) {
    const status = godkjentStatus(v.statuser);
    if (!status) return "Ingen status har virkningen «Godkjent». Legg til en i Admin → Endringstyper og statuser.";
    statusId = status.id;
  } else {
    statusId = venterStatus(v.statuser)?.id ?? null;
  }
  const id = ledigId(`endring-${sjekket.fromDate}`, new Set(v.endringer.map((e) => e.id)), "endring");
  v.endringer.push({ id, ...sjekket, statusId, fromTime: null, toTime: null, avvistGrunn: null });
  return null;
}

/** Retter en endring. Personen, statusen og klokkeslettene står som før. */
export function rettEndring(v: Vaktliste, endringId: string, rå: EndringSkjema, aktør: Aktør): string | null {
  const funnet = finnEndringÅEndre(v, endringId, aktør);
  if ("feil" in funnet) return funnet.feil;
  const sjekket = sjekkEndring(rå, funnet.endring.brukerId, v, aktør);
  if ("feil" in sjekket) return sjekket.feil;
  Object.assign(funnet.endring, sjekket);
  return null;
}

export function slettEndring(v: Vaktliste, endringId: string, aktør: Aktør): string | null {
  if (!kanSletteEndring(aktør)) return "Bare en administrator kan slette endringer. Du kan rette den i stedet.";
  const funnet = finnEndringÅEndre(v, endringId, aktør);
  if ("feil" in funnet) return funnet.feil;
  v.endringer = v.endringer.filter((e) => e !== funnet.endring);
  return null;
}

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
  /** Egen farge i planen, som `#rrggbb`. `null` = standardfargen for kategorien (fra stilarket). */
  farge: string | null;
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
  /** Begrunnelsen administratoren ga ved avvisning; `null` når den ikke er avvist, eller uten begrunnelse. */
  avvistGrunn: string | null;
};

export type DagRad = {
  id: string;
  fromDate: string;
  toDate: string;
  comment: string;
  /** Dagen er fri for alle: rutene viser «Fri», med mindre personen har en egen endring. */
  fri: boolean;
};

/** Settes i Admin. Ved vedlikehold ser alle som ikke er administrator bare `melding`. */
export type Innstillinger = {
  vedlikehold: boolean;
  melding: string;
};

export const VEDLIKEHOLD_MELDING_MAKSLENGDE = 300;
export const STANDARD_VEDLIKEHOLDSMELDING = "Vaktlista er stengt for vedlikehold. Prøv igjen senere.";

/**
 * Når synken av ansatte kjører av seg selv: fra `klokkeslett` («06:00»), hver `intervallTimer` time.
 * 0 = av; da kjører den bare når en administrator trykker «Synk nå».
 */
export type SynkInnstillinger = { klokkeslett: string; intervallTimer: number };

export const SYNK_INTERVALLER = [
  { timer: 0, navn: "Av (bare «Synk nå»)" },
  { timer: 1, navn: "Hver time" },
  { timer: 6, navn: "Hver 6. time" },
  { timer: 12, navn: "Hver 12. time" },
  { timer: 24, navn: "Daglig" },
] as const;

export const STANDARD_SYNK: SynkInnstillinger = { klokkeslett: "06:00", intervallTimer: 0 };

/** Står i `endretAv` og `sistEndretAv` når synken lagrer; endringsloggen viser det som «Synk av ansatte». */
export const SYNK_AVSENDER = "synk";
/** Hele databasen i én fil, `data/vaktliste.json`. Tabellene har id-er og fremmednøkler som i SQL. */
export type Vaktliste = {
  skjemaVersjon: number;
  /** Teller opp ved hver lagring; brukes til å oppdage at to faner har endret samtidig. */
  revisjon: number;
  sistEndretAv: string | null;
  innstillinger: Innstillinger;
  synk: SynkInnstillinger;
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
    innstillinger: { vedlikehold: false, melding: STANDARD_VEDLIKEHOLDSMELDING },
    synk: { ...STANDARD_SYNK },
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

export const DAG_MAKSLENGDE = 120;

/** `true` bare for en ekte dato på formen ÅÅÅÅ-MM-DD (ikke 2026-02-30). */
function erIsoDato(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [å, m, d] = s.split("-").map(Number);
  const dato = new Date(Date.UTC(å, m - 1, d));
  return dato.getUTCFullYear() === å && dato.getUTCMonth() === m - 1 && dato.getUTCDate() === d;
}

/** Renser og sjekker en dag/merknad fra skjemaet. Til-dato tom betyr samme dag som fra-dato. */
export function sjekkDag(rå: {
  fromDate: string;
  toDate: string;
  comment: string;
  fri: boolean;
}): { feil: string } | { fromDate: string; toDate: string; comment: string; fri: boolean } {
  const fromDate = rå.fromDate.trim();
  const toDate = rå.toDate.trim() || fromDate;
  const comment = rensNavn(rå.comment);
  if (!erIsoDato(fromDate)) return { feil: "Fra-datoen må være en gyldig dato." };
  if (!erIsoDato(toDate)) return { feil: "Til-datoen må være en gyldig dato." };
  if (toDate < fromDate) return { feil: "Til-datoen kan ikke være før fra-datoen." };
  if (!comment) return { feil: "Merknaden må ha en tekst." };
  if (comment.length > DAG_MAKSLENGDE) return { feil: `Teksten kan ha opptil ${DAG_MAKSLENGDE} tegn.` };
  return { fromDate, toDate, comment, fri: rå.fri };
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
  rå: { name: string; virkning: string },
  andre: Status[],
): { feil: string } | { name: string; virkning: Virkning } {
  const sjekket = sjekkNavn(rå.name, andre, STATUS_MAKSLENGDE, { bestemt: "Statusen", ubestemt: "en status" });
  if ("feil" in sjekket) return sjekket;
  const virkning = VIRKNINGER.find((k) => k.id === rå.virkning);
  if (!virkning) return { feil: "Velg hva statusen betyr." };
  return { name: sjekket.name, virkning: virkning.id };
}

/** Renser og sjekker feltene fra skjemaet. `andre` er typene som ikke er den som redigeres. */
export function sjekkEndringstype(
  rå: { name: string; kategori: string; farge: string },
  andre: Endringstype[],
): { feil: string } | { name: string; kategori: Kategori; farge: string | null } {
  const sjekket = sjekkNavn(rå.name, andre, ENDRINGSTYPE_MAKSLENGDE, {
    bestemt: "Endringstypen",
    ubestemt: "en endringstype",
  });
  if ("feil" in sjekket) return sjekket;
  const kategori = KATEGORIER.find((k) => k.id === rå.kategori);
  if (!kategori) return { feil: "Velg en kategori." };
  // Tom farge = ingen egen farge. Alt annet enn `#rrggbb` avvises, siden fargen havner i en style-verdi.
  if (rå.farge && !/^#[0-9a-fA-F]{6}$/.test(rå.farge)) return { feil: "Fargen må være på formen #rrggbb." };
  return { name: sjekket.name, kategori: kategori.id, farge: rå.farge ? rå.farge.toLowerCase() : null };
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

/** Statusen slik den var i versjon 3–9, før `virkning` (se `tilVersjon10`). */
type StatusV3 = { id: string; name: string; visesIPlan: boolean };

// 2 → 3: status og type var fritekst på endringen og blir egne tabeller. Navn som bare skiller seg
// i store og små bokstaver blir én rad; første skrivemåte vinner. Bare «Godkjent» vises i planen,
// som før. En tom status eller type blir null.
function tilVersjon3(v: RåVaktliste): RåVaktliste {
  const statuser: StatusV3[] = [];
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
          farge: null,
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

// 5 → 6: `innstillinger` med vedlikeholdsmodus, avskrudd. En innstilling som allerede står der, beholdes.
function tilVersjon6(v: RåVaktliste): RåVaktliste {
  return {
    ...v,
    skjemaVersjon: 6,
    innstillinger: v.innstillinger ?? { vedlikehold: false, melding: STANDARD_VEDLIKEHOLDSMELDING },
  };
}

// 6 → 7: endringstypene får `farge` (null = fargen kategorien gir). En farge som allerede står der, beholdes.
function tilVersjon7(v: RåVaktliste): RåVaktliste {
  const endringstyper = (v.endringstyper as (Omit<Endringstype, "farge"> & { farge?: string | null })[]).map(
    (t) => ({ ...t, farge: t.farge ?? null }),
  );
  return { ...v, skjemaVersjon: 7, endringstyper };
}

// Standardfargene fra stilarket (prikkfargene i ukeplan og måned), per kategori.
export const STANDARDFARGER: Record<Kategori, string> = { fravaer: "#9ab548", lokasjon: "#5b9bd5", annet: "#f2c94c" };

// 7 → 8 og 8 → 9: en farge som er lik standardfargen for kategorien er ikke «egen», og settes tilbake
// til null. Et første forsøk i versjon 8 fylte standardfargene inn som egne; to steg rydder begge filene.
const medNullstiltStandardfarge = (versjon: number) =>
  function (v: RåVaktliste): RåVaktliste {
    const endringstyper = (v.endringstyper as Endringstype[]).map((t) => ({
      ...t,
      farge: t.farge === STANDARDFARGER[t.kategori] ? null : t.farge,
    }));
    return { ...v, skjemaVersjon: versjon, endringstyper };
  };
const tilVersjon8 = medNullstiltStandardfarge(8);
const tilVersjon9 = medNullstiltStandardfarge(9);

// 9 → 10: statusene får `virkning` i stedet for `visesIPlan`. Vises i plan = godkjent, resten venter;
// avvist settes i Admin. En virkning som allerede står der, beholdes.
function tilVersjon10(v: RåVaktliste): RåVaktliste {
  const statuser = (v.statuser as (StatusV3 & { virkning?: Virkning })[]).map(
    ({ visesIPlan, virkning, ...s }): Status => ({ ...s, virkning: virkning ?? (visesIPlan ? "godkjent" : "venter") }),
  );
  return { ...v, skjemaVersjon: 10, statuser };
}

// 10 → 11: endringene får `avvistGrunn` (null). En begrunnelse som allerede står der, beholdes.
function tilVersjon11(v: RåVaktliste): RåVaktliste {
  const endringer = (v.endringer as (Omit<EndringRad, "avvistGrunn"> & { avvistGrunn?: string | null })[]).map(
    (e) => ({ ...e, avvistGrunn: e.avvistGrunn ?? null }),
  );
  return { ...v, skjemaVersjon: 11, endringer };
}

// 11 → 12: dagene får `fri` (false). En verdi som allerede står der, beholdes.
function tilVersjon12(v: RåVaktliste): RåVaktliste {
  const dager = (v.dager as (Omit<DagRad, "fri"> & { fri?: boolean })[]).map((d) => ({ ...d, fri: d.fri ?? false }));
  return { ...v, skjemaVersjon: 12, dager };
}

// 12 → 13: `synk` med automatisk synk avskrudd. En innstilling som allerede står der, beholdes.
function tilVersjon13(v: RåVaktliste): RåVaktliste {
  return { ...v, skjemaVersjon: 13, synk: v.synk ?? { ...STANDARD_SYNK } };
}

/** Renser meldingen fra skjemaet. Tom melding blir standardmeldingen. */
export function sjekkInnstillinger(rå: {
  vedlikehold: boolean;
  melding: string;
}): { feil: string } | Innstillinger {
  const melding = rå.melding.replace(/\s+/g, " ").trim() || STANDARD_VEDLIKEHOLDSMELDING;
  if (melding.length > VEDLIKEHOLD_MELDING_MAKSLENGDE) {
    return { feil: `Meldingen kan ha opptil ${VEDLIKEHOLD_MELDING_MAKSLENGDE} tegn.` };
  }
  return { vedlikehold: rå.vedlikehold, melding };
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
  if (v.skjemaVersjon === 5) v = tilVersjon6(v);
  if (v.skjemaVersjon === 6) v = tilVersjon7(v);
  if (v.skjemaVersjon === 7) v = tilVersjon8(v);
  if (v.skjemaVersjon === 8) v = tilVersjon9(v);
  if (v.skjemaVersjon === 9) v = tilVersjon10(v);
  if (v.skjemaVersjon === 10) v = tilVersjon11(v);
  if (v.skjemaVersjon === 11) v = tilVersjon12(v);
  if (v.skjemaVersjon === 12) v = tilVersjon13(v);
  if (v.skjemaVersjon !== SKJEMA_VERSJON) {
    throw new Error(`data/vaktliste.json har skjemaversjon ${fra}, appen forventer ${SKJEMA_VERSJON}.`);
  }
  return v as Vaktliste;
}

// --- Synk av ansatte (Fase 30) ---

/** Sjekker tidspunkt og hyppighet fra skjemaet. */
export function sjekkSynkInnstillinger(rå: {
  klokkeslett: string;
  intervallTimer: string;
}): { feil: string } | SynkInnstillinger {
  const klokkeslett = rå.klokkeslett.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(klokkeslett)) return { feil: "Klokkeslettet må være på formen TT:MM." };
  const intervall = SYNK_INTERVALLER.find((i) => String(i.timer) === rå.intervallTimer);
  if (!intervall) return { feil: "Velg hvor ofte synken skal kjøre." };
  return { klokkeslett, intervallTimer: intervall.timer };
}

/**
 * Det siste planlagte tidspunktet til og med `nå`: `klokkeslett` i dag, pluss eller minus hele
 * intervaller. `null` når automatisk synk er av. Regnes i serverens lokaltid.
 */
export function sisteSynkTidspunkt(s: SynkInnstillinger, nå: Date): Date | null {
  if (s.intervallTimer <= 0) return null;
  const [timer, minutter] = s.klokkeslett.split(":").map(Number);
  const anker = new Date(nå);
  anker.setHours(timer, minutter, 0, 0);
  const steg = s.intervallTimer * 3_600_000;
  return new Date(anker.getTime() + Math.floor((nå.getTime() - anker.getTime()) / steg) * steg);
}

/** Skal synken kjøre nå? Ja når et planlagt tidspunkt er passert etter forrige forsøk. */
export function synkErForfalt(s: SynkInnstillinger, sistForsøk: string | null, nå: Date): boolean {
  const siste = sisteSynkTidspunkt(s, nå);
  if (!siste) return false;
  return !sistForsøk || new Date(sistForsøk).getTime() < siste.getTime();
}

/** Én person fra kilden: testfila nå, Entra-gruppen senere. `name` er fornavn og etternavn satt sammen. */
export type KildePerson = { entraId: string; fornavn: string; etternavn: string; name: string; upn: string | null };

/**
 * Sjekker innholdet fra kilden: en liste med brukere i formen Microsoft Graph gir dem: `id`,
 * `givenName` (fornavn), `surname` (etternavn), `userPrincipalName` (e-post) og `displayName`, som
 * bare brukes når fornavn og etternavn mangler. En tom liste avvises, så en feil i kilden ikke
 * deaktiverer alle.
 */
export function sjekkKildePersoner(rå: unknown): { feil: string } | KildePerson[] {
  if (!Array.isArray(rå)) return { feil: "Kilden må være en liste med personer." };
  if (rå.length === 0) return { feil: "Kilden ga ingen personer. Synken stoppet, så ingen blir deaktivert ved en feil." };
  const personer: KildePerson[] = [];
  const sett = new Set<string>();
  const tekstFelt = (p: Record<string, unknown>, felt: string) => (typeof p[felt] === "string" ? rensNavn(p[felt]) : "");
  for (const [i, r] of rå.entries()) {
    const p = typeof r === "object" && r !== null ? (r as Record<string, unknown>) : {};
    const entraId = tekstFelt(p, "id");
    const fornavn = tekstFelt(p, "givenName");
    const etternavn = tekstFelt(p, "surname");
    const name = [fornavn, etternavn].filter(Boolean).join(" ") || tekstFelt(p, "displayName");
    const upn = tekstFelt(p, "userPrincipalName") || null;
    if (!entraId) return { feil: `Person nr. ${i + 1} i kilden mangler id.` };
    if (!name) return { feil: `Person nr. ${i + 1} i kilden mangler givenName og surname.` };
    if (sett.has(entraId)) return { feil: `id «${entraId}» står flere ganger i kilden.` };
    sett.add(entraId);
    personer.push({ entraId, fornavn, etternavn, name, upn });
  }
  return personer;
}

export type SynkResultat = {
  nye: string[];
  deaktivert: string[];
  /** Navn eller e-post endret i kilden. */
  oppdatert: string[];
  /** Fantes fra før uten Entra-id, og ble koblet på e-post. */
  koblet: string[];
  /** Burde vært deaktivert, men er siste aktive administrator. */
  holdtIgjen: string[];
  /** Aktive personer uten Entra-id; synken rører dem ikke. */
  ukoblet: number;
};

export function synkHarEndringer(r: SynkResultat): boolean {
  return r.nye.length + r.deaktivert.length + r.oppdatert.length + r.koblet.length > 0;
}

/**
 * Bruker kilden på `v`. Match på `entraId`, deretter e-post (`upn`) blant dem som ikke er koblet;
 * en treff på e-post får Entra-id-en. Ingen treff = ny person, uten team, `opprettet` = `nå`.
 * Bare personer med Entra-id som er borte fra kilden, deaktiveres; de som aldri er koblet, røres
 * ikke. Ingen slettes, ingen aktiveres igjen, og siste aktive administrator deaktiveres ikke.
 */
export function anvendSynk(v: Vaktliste, personer: KildePerson[], nå: string): SynkResultat {
  const r: SynkResultat = { nye: [], deaktivert: [], oppdatert: [], koblet: [], holdtIgjen: [], ukoblet: 0 };
  for (const p of personer) {
    let bruker = v.brukere.find((b) => b.entraId === p.entraId);
    if (!bruker && p.upn) {
      const epost = nøkkel(p.upn);
      bruker = v.brukere.find((b) => !b.entraId && b.upn && nøkkel(b.upn) === epost);
      if (bruker) {
        bruker.entraId = p.entraId;
        r.koblet.push(p.name);
      }
    }
    if (!bruker) {
      const id = ledigId(slugify(p.name), new Set(v.brukere.map((b) => b.id)), "person");
      v.brukere.push({ id, name: p.name, upn: p.upn, opprettet: nå, aktiv: true, entraId: p.entraId });
      r.nye.push(p.name);
      continue;
    }
    const nyUpn = p.upn ?? bruker.upn;
    if (bruker.name !== p.name || bruker.upn !== nyUpn) {
      bruker.name = p.name;
      bruker.upn = nyUpn;
      r.oppdatert.push(p.name);
    }
  }
  const iKilden = new Set(personer.map((p) => p.entraId));
  for (const bruker of v.brukere) {
    if (!bruker.aktiv || !bruker.entraId || iKilden.has(bruker.entraId)) continue;
    const andreAdmin = v.brukere.some((b) => b !== bruker && b.aktiv && b.erAdministrator === true);
    if (bruker.erAdministrator === true && !andreAdmin) {
      r.holdtIgjen.push(bruker.name);
      continue;
    }
    bruker.aktiv = false;
    r.deaktivert.push(bruker.name);
  }
  r.ukoblet = v.brukere.filter((b) => b.aktiv && !b.entraId).length;
  return r;
}

/** Utfallet som én linje til Admin. */
export function beskrivSynk(r: SynkResultat, antallIKilden: number): string {
  const deler = [`${antallIKilden} i kilden`];
  const liste = (navn: string[]) => (navn.length <= 3 ? `: ${navn.join(", ")}` : "");
  if (r.nye.length) deler.push(`${r.nye.length} ny${r.nye.length === 1 ? "" : "e"}${liste(r.nye)}`);
  if (r.deaktivert.length) deler.push(`${r.deaktivert.length} deaktivert${liste(r.deaktivert)}`);
  if (r.oppdatert.length) deler.push(`${r.oppdatert.length} oppdatert`);
  if (r.koblet.length) deler.push(`${r.koblet.length} koblet på e-post`);
  if (r.holdtIgjen.length) deler.push(`ikke deaktivert fordi siste administrator: ${r.holdtIgjen.join(", ")}`);
  if (!synkHarEndringer(r)) deler.push("ingen endringer");
  if (r.ukoblet) deler.push(`${r.ukoblet} uten kobling til Entra (røres ikke)`);
  return deler.join(" · ");
}
