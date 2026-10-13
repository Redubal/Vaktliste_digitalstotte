import fs from "node:fs";
import path from "node:path";
import { KATEGORIER, type Vaktliste } from "./domene";

const LOGG_FIL = path.join(path.resolve(process.cwd(), "data"), "endringslogg.jsonl");

type Rad = { id: string } & Record<string, unknown>;

export type Tabellnøkkel =
  | "team"
  | "lokasjoner"
  | "roller"
  | "statuser"
  | "endringstyper"
  | "brukere"
  | "oppsett"
  | "endringer"
  | "dager";

export type LoggFelt = { felt: string; gammel: string | null; ny: string | null };

/** Én linje i `data/endringslogg.jsonl`. Navn er slått opp og lagret, så linjen tåler at raden slettes senere. */
export type LoggLinje = {
  tid: string;
  endretAvId: string;
  endretAv: string;
  handling: "lagt til" | "endret" | "fjernet";
  tabell: Tabellnøkkel;
  radId: string;
  rad: string;
  felt: LoggFelt[];
};

function navnFra(v: Vaktliste, tabell: Tabellnøkkel, id: string): string {
  const rad = (v[tabell] as unknown as Rad[]).find((r) => r.id === id);
  return typeof rad?.name === "string" ? rad.name : id;
}

type Tabellinfo = {
  nøkkel: Tabellnøkkel;
  entall: string;
  overskrift: string;
  /** Hvilken tabell et felt peker til; verdien vises som navnet, ikke id-en. */
  refs: Record<string, Tabellnøkkel>;
  etikett: (v: Vaktliste, rad: Rad) => string;
};

const tekstEllerId = (rad: Rad) => (typeof rad.name === "string" ? rad.name : rad.id);

export const TABELLER: Tabellinfo[] = [
  { nøkkel: "brukere", entall: "ansatt", overskrift: "Ansatte (personer)", refs: {}, etikett: (_v, r) => tekstEllerId(r) },
  {
    nøkkel: "oppsett",
    entall: "ansattoppsett",
    overskrift: "Ansattoppsett",
    refs: { brukerId: "brukere", teamId: "team", rolleId: "roller", lokasjonId: "lokasjoner" },
    etikett: (v, r) => navnFra(v, "brukere", String(r.brukerId)),
  },
  { nøkkel: "team", entall: "team", overskrift: "Team", refs: {}, etikett: (_v, r) => tekstEllerId(r) },
  {
    nøkkel: "lokasjoner",
    entall: "lokasjon",
    overskrift: "Lokasjoner",
    refs: { teamId: "team" },
    etikett: (_v, r) => tekstEllerId(r),
  },
  { nøkkel: "roller", entall: "rolle", overskrift: "Roller", refs: {}, etikett: (_v, r) => tekstEllerId(r) },
  { nøkkel: "statuser", entall: "status", overskrift: "Statuser", refs: {}, etikett: (_v, r) => tekstEllerId(r) },
  {
    nøkkel: "endringstyper",
    entall: "endringstype",
    overskrift: "Endringstyper",
    refs: {},
    etikett: (_v, r) => tekstEllerId(r),
  },
  {
    nøkkel: "endringer",
    entall: "endring i vaktlista",
    overskrift: "Endringer i vaktlista",
    refs: { brukerId: "brukere", lokasjonId: "lokasjoner", statusId: "statuser", typeId: "endringstyper" },
    etikett: (v, r) => `${navnFra(v, "brukere", String(r.brukerId))}, ${r.fromDate ?? "uten dato"}`,
  },
  {
    nøkkel: "dager",
    entall: "dag",
    overskrift: "Dager",
    refs: {},
    etikett: (_v, r) => `${r.fromDate}–${r.toDate}`,
  },
];

const FELTNAVN: Record<string, string> = {
  name: "Navn",
  teamId: "Team",
  rolleId: "Rolle",
  lokasjonId: "Lokasjon",
  statusId: "Status",
  typeId: "Type",
  brukerId: "Person",
  visesIPlan: "Vises i plan",
  kategori: "Kategori",
  upn: "E-post",
  erAdministrator: "Administrator",
  activeFrom: "Aktiv fra",
  activeTo: "Aktiv til",
  sortOrder: "Rekkefølge",
  comment: "Kommentar",
  fromDate: "Fra dato",
  toDate: "Til dato",
  fromTime: "Fra kl.",
  toTime: "Til kl.",
};

/** `erAdministrator` mangler på de fleste personer; manglende og «nei» er det samme. */
function normaliser(felt: string, verdi: unknown): unknown {
  if (felt === "erAdministrator") return verdi === true;
  return verdi === undefined || verdi === "" ? null : verdi;
}

function vis(v: Vaktliste, info: Tabellinfo, felt: string, verdi: unknown): string | null {
  if (verdi === null) return null;
  if (typeof verdi === "boolean") return verdi ? "ja" : "nei";
  const ref = info.refs[felt];
  if (ref) return navnFra(v, ref, String(verdi));
  if (felt === "kategori") return KATEGORIER.find((k) => k.id === verdi)?.navn ?? String(verdi);
  return String(verdi);
}

function feltene(a: Rad | undefined, b: Rad | undefined): string[] {
  const alle = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  alle.delete("id");
  return [...alle];
}

/** Hvem som endret: id-en er oppsettets id (en person kan ha flere), så navnet slås opp via oppsettet. */
function hvem(v: Vaktliste, id: string): string {
  const oppsett = v.oppsett.find((o) => o.id === id);
  const bruker = v.brukere.find((b) => b.id === (oppsett?.brukerId ?? id));
  return bruker?.name ?? id;
}

/** Sammenligner tabell for tabell på `id`; én linje per rad som er lagt til, endret eller fjernet. */
export function beregnEndringer(før: Vaktliste, etter: Vaktliste, endretAvId: string, tid: string): LoggLinje[] {
  const linjer: LoggLinje[] = [];
  const endretAv = hvem(før, endretAvId);
  for (const info of TABELLER) {
    const gamle = new Map((før[info.nøkkel] as unknown as Rad[]).map((r) => [r.id, r]));
    const nye = new Map((etter[info.nøkkel] as unknown as Rad[]).map((r) => [r.id, r]));
    const ider = new Set([...gamle.keys(), ...nye.keys()]);
    for (const id of ider) {
      const g = gamle.get(id);
      const n = nye.get(id);
      const felt: LoggFelt[] = [];
      for (const f of feltene(g, n)) {
        const gv = normaliser(f, g?.[f]);
        const nv = normaliser(f, n?.[f]);
        if (JSON.stringify(gv) === JSON.stringify(nv)) continue;
        const gammel = g ? vis(før, info, f, gv) : null;
        const ny = n ? vis(etter, info, f, nv) : null;
        if (gammel === null && ny === null) continue;
        felt.push({ felt: FELTNAVN[f] ?? f, gammel, ny });
      }
      const handling = !g ? "lagt til" : !n ? "fjernet" : "endret";
      if (handling === "endret" && felt.length === 0) continue;
      linjer.push({
        tid,
        endretAvId,
        endretAv,
        handling,
        tabell: info.nøkkel,
        radId: id,
        rad: info.etikett(g ? før : etter, (g ?? n)!),
        felt,
      });
    }
  }
  return linjer;
}

export function skrivEndringer(linjer: LoggLinje[]) {
  if (linjer.length === 0) return;
  fs.mkdirSync(path.dirname(LOGG_FIL), { recursive: true });
  fs.appendFileSync(LOGG_FIL, linjer.map((l) => JSON.stringify(l)).join("\n") + "\n", "utf8");
}

/** Nyeste først. Linjer som ikke lar seg lese hoppes over; én ødelagt linje skal ikke skjule resten. */
export function lesEndringslogg(): LoggLinje[] {
  if (!fs.existsSync(LOGG_FIL)) return [];
  const linjer: LoggLinje[] = [];
  for (const rå of fs.readFileSync(LOGG_FIL, "utf8").split("\n")) {
    if (!rå.trim()) continue;
    try {
      linjer.push(JSON.parse(rå) as LoggLinje);
    } catch {
      // hoppes over
    }
  }
  return linjer.reverse();
}
