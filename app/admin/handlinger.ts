"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  avvisEndring,
  endringstypeBrukere,
  godkjennEndring,
  ledigId,
  lokasjonBrukere,
  MASSE_INGEN,
  nektSletting,
  rolleBrukere,
  sjekkAnsattStatus,
  sjekkDag,
  sjekkEndringstype,
  sjekkLokasjon,
  sjekkOppsett,
  sjekkRolle,
  sjekkStatus,
  sjekkTeam,
  sjekkInnstillinger,
  sjekkSynkInnstillinger,
  slugify,
  statusBrukere,
  teamBrukere,
  type Svar,
  type Vaktliste,
} from "@/lib/domene";
import { IDENTITET_COOKIE, erAdministrator } from "@/lib/identitet";
import { kjørSynk } from "@/lib/synk";
import { tekst, utforSom, valgtAnsatt } from "@/lib/utfor";

/** Fargen fra skjemaet: bare med når «Egen farge» er krysset av, ellers tom (= ingen egen farge). */
function fargeFra(data: FormData): string {
  return data.get("egenFarge") === "on" ? tekst(data, "farge") : "";
}

/** Alle handlingene i Admin krever administrator. */
function utfor(data: FormData, sti: string, endre: (v: Vaktliste) => string | null, okMelding: string): Promise<Svar> {
  return utforSom("administrator", data, sti, endre, okMelding);
}

// --- Vedlikeholdsmodus ---

export async function settVedlikehold(_forrige: Svar | null, data: FormData): Promise<Svar> {
  const vedlikehold = tekst(data, "vedlikehold") === "true";
  return utfor(
    data,
    "/admin",
    (v) => {
      const sjekket = sjekkInnstillinger({ vedlikehold, melding: tekst(data, "melding") });
      if ("feil" in sjekket) return sjekket.feil;
      v.innstillinger = sjekket;
      return null;
    },
    vedlikehold ? "Vedlikehold er slått på." : "Vedlikehold er slått av.",
  );
}

// --- Synk av ansatte ---

export async function settSynk(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin",
    (v) => {
      const sjekket = sjekkSynkInnstillinger({
        klokkeslett: tekst(data, "klokkeslett"),
        intervallTimer: tekst(data, "intervallTimer"),
      });
      if ("feil" in sjekket) return sjekket.feil;
      v.synk = sjekket;
      return null;
    },
    "Innstillingene for synk er lagret.",
  );
}

/** «Synk nå». Går ikke gjennom `utfor`: synken lagrer selv, med egen avsender, og bare når noe er endret. */
export async function synkNaa(): Promise<Svar> {
  const jeg = await valgtAnsatt();
  if (!erAdministrator(jeg)) {
    return { ok: false, melding: jeg ? "Du har ikke tilgang til å endre dette." : "Velg deg selv øverst på siden først." };
  }
  const status = await kjørSynk(`${jeg?.name ?? "ukjent"} («Synk nå»)`);
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  return { ok: status.ok === true, melding: status.melding ?? "" };
}

// --- Ansatte ---

/** Gir en ny person (uten oppsett, typisk fra synken) et team, så vedkommende kommer med i planen. */
export async function giTeam(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/ansatte",
    (v) => {
      const bruker = v.brukere.find((b) => b.id === tekst(data, "brukerId"));
      if (!bruker) return "Personen finnes ikke lenger. Last siden på nytt.";
      if (!bruker.aktiv) return "Personen er deaktivert. Aktiver vedkommende først.";
      if (v.oppsett.some((o) => o.brukerId === bruker.id)) return "Personen har allerede et team. Last siden på nytt.";
      const sjekket = sjekkOppsett({ teamId: tekst(data, "teamId"), rolleId: "", lokasjonId: "" }, v);
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(`${bruker.id}-start`, new Set(v.oppsett.map((o) => o.id)), "oppsett");
      v.oppsett.push({
        id,
        brukerId: bruker.id,
        ...sjekket,
        activeFrom: null,
        activeTo: null,
        sortOrder: null,
        comment: null,
      });
      return null;
    },
    "Personen har fått team.",
  );
}

/** Id-en til den som er valgt i «Velg deg selv». `utfor` har allerede sjekket at personen er admin. */
async function minId(): Promise<string> {
  return (await cookies()).get(IDENTITET_COOKIE)?.value ?? "";
}

export async function endreAnsatt(_forrige: Svar | null, data: FormData): Promise<Svar> {
  const jegId = await minId();
  return utfor(
    data,
    "/admin/ansatte",
    (v) => {
      const oppsett = v.oppsett.find((o) => o.id === tekst(data, "id"));
      if (!oppsett) return "Ansatten finnes ikke lenger. Last siden på nytt.";
      const bruker = v.brukere.find((b) => b.id === oppsett.brukerId);
      if (!bruker) return "Ansatten finnes ikke lenger. Last siden på nytt.";
      const sjekket = sjekkOppsett(
        { teamId: tekst(data, "teamId"), rolleId: tekst(data, "rolleId"), lokasjonId: tekst(data, "lokasjonId") },
        v,
      );
      if ("feil" in sjekket) return sjekket.feil;
      const status = sjekkAnsattStatus(
        { aktiv: bruker.aktiv, erAdministrator: data.get("erAdministrator") === "on" },
        bruker.id,
        jegId,
      );
      if ("feil" in status) return status.feil;
      oppsett.teamId = sjekket.teamId;
      oppsett.rolleId = sjekket.rolleId;
      oppsett.lokasjonId = sjekket.lokasjonId;
      bruker.erAdministrator = status.erAdministrator;
      return null;
    },
    "Endringen er lagret.",
  );
}

/**
 * «Lagre alle»: lagrer team, rolle, lokasjon og adminstatus for flere oppsett i én lagring. `rader`
 * er en JSON-liste med ett objekt per oppsett (`id`, `teamId`, `rolleId`, `lokasjonId`,
 * `erAdministrator`). Alt eller ingenting: finner vi én feil, lagres ingenting.
 */
export async function lagreAlleAnsatte(_forrige: Svar | null, data: FormData): Promise<Svar> {
  const jegId = await minId();
  let rader: unknown;
  try {
    rader = JSON.parse(tekst(data, "rader"));
  } catch {
    rader = null;
  }
  const liste = Array.isArray(rader) ? rader : [];
  const antall = `${liste.length} ${liste.length === 1 ? "ansatt" : "ansatte"}`;
  return utfor(
    data,
    "/admin/ansatte",
    (v) => {
      if (liste.length === 0) return "Ingen endringer å lagre.";
      const adminPerBruker = new Map<string, boolean>();
      const nye: {
        oppsettId: string;
        teamId: string;
        rolleId: string | null;
        lokasjonId: string | null;
      }[] = [];
      for (const rad of liste) {
        const r = typeof rad === "object" && rad !== null ? (rad as Record<string, unknown>) : {};
        const felt = (navn: string) => (typeof r[navn] === "string" ? (r[navn] as string) : "");
        const oppsett = v.oppsett.find((o) => o.id === felt("id"));
        const bruker = oppsett && v.brukere.find((b) => b.id === oppsett.brukerId);
        if (!oppsett || !bruker) return "En av ansatte finnes ikke lenger. Last siden på nytt.";
        const sjekket = sjekkOppsett(
          { teamId: felt("teamId"), rolleId: felt("rolleId"), lokasjonId: felt("lokasjonId") },
          v,
        );
        if ("feil" in sjekket) return sjekket.feil;
        const erAdmin = r.erAdministrator === true;
        const tidligere = adminPerBruker.get(bruker.id);
        if (tidligere !== undefined && tidligere !== erAdmin) {
          return `${bruker.name} står med ulik administratortilgang på flere rader. Gjør dem like.`;
        }
        adminPerBruker.set(bruker.id, erAdmin);
        nye.push({ oppsettId: oppsett.id, ...sjekket });
      }
      for (const [brukerId, erAdmin] of adminPerBruker) {
        const bruker = v.brukere.find((b) => b.id === brukerId);
        if (!bruker) continue;
        const status = sjekkAnsattStatus({ aktiv: bruker.aktiv, erAdministrator: erAdmin }, bruker.id, jegId);
        if ("feil" in status) return status.feil;
      }
      for (const n of nye) {
        const oppsett = v.oppsett.find((o) => o.id === n.oppsettId);
        if (!oppsett) continue;
        oppsett.teamId = n.teamId;
        oppsett.rolleId = n.rolleId;
        oppsett.lokasjonId = n.lokasjonId;
      }
      for (const [brukerId, erAdmin] of adminPerBruker) {
        const bruker = v.brukere.find((b) => b.id === brukerId);
        if (bruker) bruker.erAdministrator = erAdmin;
      }
      return null;
    },
    `Endringene er lagret for ${antall}.`,
  );
}

/** Deaktiverer eller aktiverer en person (`aktiv` = «true» eller «false» fra knappen). */
export async function settAnsattAktiv(_forrige: Svar | null, data: FormData): Promise<Svar> {
  const jegId = await minId();
  const aktiv = tekst(data, "aktiv") === "true";
  return utfor(
    data,
    "/admin/ansatte",
    (v) => {
      const bruker = v.brukere.find((b) => b.id === tekst(data, "brukerId"));
      if (!bruker) return "Ansatten finnes ikke lenger. Last siden på nytt.";
      const status = sjekkAnsattStatus(
        { aktiv, erAdministrator: bruker.erAdministrator === true },
        bruker.id,
        jegId,
      );
      if ("feil" in status) return status.feil;
      bruker.aktiv = status.aktiv;
      return null;
    },
    aktiv ? "Personen er aktivert." : "Personen er deaktivert.",
  );
}

/**
 * Setter team, rolle og/eller lokasjon, eller deaktiverer, for alle oppsett i `id` (kan stå flere
 * ganger i skjemaet). Alt eller ingenting: finner vi én feil, lagres ingenting.
 */
export async function masseendreAnsatte(_forrige: Svar | null, data: FormData): Promise<Svar> {
  const jegId = await minId();
  const deaktiver = tekst(data, "handling") === "deaktiver";
  const ider = [...new Set(data.getAll("id").filter((x): x is string => typeof x === "string"))];
  const antall = `${ider.length} ${ider.length === 1 ? "ansatt" : "ansatte"}`;
  return utfor(
    data,
    "/admin/ansatte",
    (v) => {
      if (ider.length === 0) return "Kryss av minst én ansatt først.";
      const valgte = [];
      for (const id of ider) {
        const oppsett = v.oppsett.find((o) => o.id === id);
        const bruker = oppsett && v.brukere.find((b) => b.id === oppsett.brukerId);
        if (!oppsett || !bruker) return "En av de valgte finnes ikke lenger. Last siden på nytt.";
        valgte.push({ oppsett, bruker });
      }

      if (deaktiver) {
        for (const { bruker } of valgte) {
          const status = sjekkAnsattStatus(
            { aktiv: false, erAdministrator: bruker.erAdministrator === true },
            bruker.id,
            jegId,
          );
          if ("feil" in status) return status.feil;
        }
        for (const { bruker } of valgte) bruker.aktiv = false;
        return null;
      }

      const teamId = tekst(data, "teamId");
      const rolleId = tekst(data, "rolleId");
      const lokasjonId = tekst(data, "lokasjonId");
      if (!teamId && !rolleId && !lokasjonId) return "Velg hva som skal endres: team, rolle eller lokasjon.";
      const nye: { teamId: string; rolleId: string | null; lokasjonId: string | null }[] = [];
      for (const { oppsett } of valgte) {
        const sjekket = sjekkOppsett(
          {
            teamId: teamId || oppsett.teamId,
            rolleId: rolleId === MASSE_INGEN ? "" : rolleId || (oppsett.rolleId ?? ""),
            lokasjonId: lokasjonId === MASSE_INGEN ? "" : lokasjonId || (oppsett.lokasjonId ?? ""),
          },
          v,
        );
        if ("feil" in sjekket) return sjekket.feil;
        nye.push(sjekket);
      }
      valgte.forEach(({ oppsett }, i) => {
        oppsett.teamId = nye[i].teamId;
        oppsett.rolleId = nye[i].rolleId;
        oppsett.lokasjonId = nye[i].lokasjonId;
      });
      return null;
    },
    deaktiver ? `${antall} er deaktivert.` : `Endringen er lagret for ${antall}.`,
  );
}

// --- Lokasjoner ---

export async function leggTilLokasjon(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/lokasjoner",
    (v) => {
      const sjekket = sjekkLokasjon(
        { name: tekst(data, "name"), teamId: tekst(data, "teamId") },
        v.lokasjoner,
        v.team,
      );
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(slugify(sjekket.name), new Set(v.lokasjoner.map((l) => l.id)), "lokasjon");
      v.lokasjoner.push({ id, name: sjekket.name, teamId: sjekket.teamId });
      return null;
    },
    "Lokasjonen er lagt til.",
  );
}

export async function endreLokasjon(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/lokasjoner",
    (v) => {
      const lokasjon = v.lokasjoner.find((l) => l.id === tekst(data, "id"));
      if (!lokasjon) return "Lokasjonen finnes ikke lenger. Last siden på nytt.";
      const sjekket = sjekkLokasjon(
        { name: tekst(data, "name"), teamId: tekst(data, "teamId") },
        v.lokasjoner.filter((l) => l.id !== lokasjon.id),
        v.team,
      );
      if ("feil" in sjekket) return sjekket.feil;
      lokasjon.name = sjekket.name;
      lokasjon.teamId = sjekket.teamId;
      return null;
    },
    "Endringen er lagret.",
  );
}

export async function slettLokasjon(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/lokasjoner",
    (v) => {
      const lokasjon = v.lokasjoner.find((l) => l.id === tekst(data, "id"));
      if (!lokasjon) return "Lokasjonen finnes ikke lenger. Last siden på nytt.";
      const nektet = nektSletting(
        lokasjon,
        lokasjonBrukere(v, lokasjon.id),
        "Bytt lokasjon hos dem først.",
      );
      if (nektet) return nektet;
      v.lokasjoner = v.lokasjoner.filter((l) => l.id !== lokasjon.id);
      return null;
    },
    "Lokasjonen er slettet.",
  );
}

// --- Dager og merknader ---

const DAGER_STI = "/admin/dager";

function dagFra(data: FormData) {
  return sjekkDag({
    fromDate: tekst(data, "fromDate"),
    toDate: tekst(data, "toDate"),
    comment: tekst(data, "comment"),
    fri: data.get("fri") === "on",
  });
}

export async function leggTilDag(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    DAGER_STI,
    (v) => {
      const sjekket = dagFra(data);
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(slugify(`${sjekket.fromDate}-${sjekket.comment}`).slice(0, 60), new Set(v.dager.map((d) => d.id)), "dag");
      v.dager.push({ id, ...sjekket });
      return null;
    },
    "Dagen er lagt til.",
  );
}

export async function endreDag(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    DAGER_STI,
    (v) => {
      const dag = v.dager.find((d) => d.id === tekst(data, "id"));
      if (!dag) return "Dagen finnes ikke lenger. Last siden på nytt.";
      const sjekket = dagFra(data);
      if ("feil" in sjekket) return sjekket.feil;
      dag.fromDate = sjekket.fromDate;
      dag.toDate = sjekket.toDate;
      dag.comment = sjekket.comment;
      dag.fri = sjekket.fri;
      return null;
    },
    "Endringen er lagret.",
  );
}

export async function slettDag(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    DAGER_STI,
    (v) => {
      const dag = v.dager.find((d) => d.id === tekst(data, "id"));
      if (!dag) return "Dagen finnes ikke lenger. Last siden på nytt.";
      v.dager = v.dager.filter((d) => d.id !== dag.id);
      return null;
    },
    "Dagen er slettet.",
  );
}

// --- Team ---

export async function leggTilTeam(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/team",
    (v) => {
      const sjekket = sjekkTeam({ name: tekst(data, "name") }, v.team);
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(slugify(sjekket.name), new Set(v.team.map((t) => t.id)), "team");
      v.team.push({ id, name: sjekket.name });
      return null;
    },
    "Teamet er lagt til.",
  );
}

export async function endreTeam(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/team",
    (v) => {
      const team = v.team.find((t) => t.id === tekst(data, "id"));
      if (!team) return "Teamet finnes ikke lenger. Last siden på nytt.";
      const sjekket = sjekkTeam(
        { name: tekst(data, "name") },
        v.team.filter((t) => t.id !== team.id),
      );
      if ("feil" in sjekket) return sjekket.feil;
      team.name = sjekket.name;
      return null;
    },
    "Endringen er lagret.",
  );
}

export async function slettTeam(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/team",
    (v) => {
      const team = v.team.find((t) => t.id === tekst(data, "id"));
      if (!team) return "Teamet finnes ikke lenger. Last siden på nytt.";
      if (v.team.length === 1) return `«${team.name}» er det eneste teamet og kan ikke slettes.`;
      const nektet = nektSletting(
        team,
        teamBrukere(v, team.id),
        "Gi det heller et nytt navn, eller flytt dem til et annet team først.",
      );
      if (nektet) return nektet;
      v.team = v.team.filter((t) => t.id !== team.id);
      return null;
    },
    "Teamet er slettet.",
  );
}

// --- Roller ---

export async function leggTilRolle(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/roller",
    (v) => {
      const sjekket = sjekkRolle({ name: tekst(data, "name") }, v.roller);
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(slugify(sjekket.name), new Set(v.roller.map((r) => r.id)), "rolle");
      v.roller.push({ id, name: sjekket.name });
      return null;
    },
    "Rollen er lagt til.",
  );
}

export async function endreRolle(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/roller",
    (v) => {
      const rolle = v.roller.find((r) => r.id === tekst(data, "id"));
      if (!rolle) return "Rollen finnes ikke lenger. Last siden på nytt.";
      const sjekket = sjekkRolle(
        { name: tekst(data, "name") },
        v.roller.filter((r) => r.id !== rolle.id),
      );
      if ("feil" in sjekket) return sjekket.feil;
      rolle.name = sjekket.name;
      return null;
    },
    "Endringen er lagret.",
  );
}

export async function slettRolle(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/roller",
    (v) => {
      const rolle = v.roller.find((r) => r.id === tekst(data, "id"));
      if (!rolle) return "Rollen finnes ikke lenger. Last siden på nytt.";
      const nektet = nektSletting(
        rolle,
        rolleBrukere(v, rolle.id),
        "Gi den heller et nytt navn, eller bytt rolle hos dem først.",
      );
      if (nektet) return nektet;
      v.roller = v.roller.filter((r) => r.id !== rolle.id);
      return null;
    },
    "Rollen er slettet.",
  );
}

// --- Godkjenning (fra Admin → Godkjenning, Ukeplan og Måned) ---

export async function godkjenn(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(data, "/admin/godkjenning", (v) => godkjennEndring(v, tekst(data, "id")), "Endringen er godkjent.");
}

export async function avvis(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    "/admin/godkjenning",
    (v) => avvisEndring(v, tekst(data, "id"), tekst(data, "avvistGrunn")),
    "Endringen er avvist.",
  );
}

// --- Statuser og endringstyper (samme side) ---

const ENDRINGSTYPER_STI = "/admin/endringstyper";

export async function leggTilStatus(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    ENDRINGSTYPER_STI,
    (v) => {
      const sjekket = sjekkStatus({ name: tekst(data, "name"), virkning: tekst(data, "virkning") }, v.statuser);
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(slugify(sjekket.name), new Set(v.statuser.map((s) => s.id)), "status");
      v.statuser.push({ id, name: sjekket.name, virkning: sjekket.virkning });
      return null;
    },
    "Statusen er lagt til.",
  );
}

export async function endreStatus(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    ENDRINGSTYPER_STI,
    (v) => {
      const status = v.statuser.find((s) => s.id === tekst(data, "id"));
      if (!status) return "Statusen finnes ikke lenger. Last siden på nytt.";
      const sjekket = sjekkStatus(
        { name: tekst(data, "name"), virkning: tekst(data, "virkning") },
        v.statuser.filter((s) => s.id !== status.id),
      );
      if ("feil" in sjekket) return sjekket.feil;
      status.name = sjekket.name;
      status.virkning = sjekket.virkning;
      return null;
    },
    "Endringen er lagret.",
  );
}

export async function slettStatus(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    ENDRINGSTYPER_STI,
    (v) => {
      const status = v.statuser.find((s) => s.id === tekst(data, "id"));
      if (!status) return "Statusen finnes ikke lenger. Last siden på nytt.";
      const nektet = nektSletting(
        status,
        statusBrukere(v, status.id),
        "Gi den heller et nytt navn, eller bytt status på endringene deres først.",
      );
      if (nektet) return nektet;
      v.statuser = v.statuser.filter((s) => s.id !== status.id);
      return null;
    },
    "Statusen er slettet.",
  );
}

export async function leggTilEndringstype(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    ENDRINGSTYPER_STI,
    (v) => {
      const sjekket = sjekkEndringstype(
        { name: tekst(data, "name"), kategori: tekst(data, "kategori"), farge: fargeFra(data) },
        v.endringstyper,
      );
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(slugify(sjekket.name), new Set(v.endringstyper.map((t) => t.id)), "type");
      v.endringstyper.push({ id, name: sjekket.name, kategori: sjekket.kategori, farge: sjekket.farge });
      return null;
    },
    "Endringstypen er lagt til.",
  );
}

export async function endreEndringstype(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    ENDRINGSTYPER_STI,
    (v) => {
      const type = v.endringstyper.find((t) => t.id === tekst(data, "id"));
      if (!type) return "Endringstypen finnes ikke lenger. Last siden på nytt.";
      const sjekket = sjekkEndringstype(
        { name: tekst(data, "name"), kategori: tekst(data, "kategori"), farge: fargeFra(data) },
        v.endringstyper.filter((t) => t.id !== type.id),
      );
      if ("feil" in sjekket) return sjekket.feil;
      type.name = sjekket.name;
      type.kategori = sjekket.kategori;
      type.farge = sjekket.farge;
      return null;
    },
    "Endringen er lagret.",
  );
}

export async function slettEndringstype(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    ENDRINGSTYPER_STI,
    (v) => {
      const type = v.endringstyper.find((t) => t.id === tekst(data, "id"));
      if (!type) return "Endringstypen finnes ikke lenger. Last siden på nytt.";
      const nektet = nektSletting(
        type,
        endringstypeBrukere(v, type.id),
        "Gi den heller et nytt navn, eller bytt type på endringene deres først.",
      );
      if (nektet) return nektet;
      v.endringstyper = v.endringstyper.filter((t) => t.id !== type.id);
      return null;
    },
    "Endringstypen er slettet.",
  );
}
