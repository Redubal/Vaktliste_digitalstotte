"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  endringstypeBrukere,
  ledigId,
  lokasjonBrukere,
  nektSletting,
  rolleBrukere,
  sjekkAnsattStatus,
  sjekkEndringstype,
  sjekkLokasjon,
  sjekkOppsett,
  sjekkRolle,
  sjekkStatus,
  sjekkTeam,
  slugify,
  statusBrukere,
  teamBrukere,
  type Svar,
  type Vaktliste,
} from "@/lib/domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { endreVaktliste } from "@/lib/lager";
import { getAnsatte } from "@/lib/vaktlista";

function tekst(data: FormData, felt: string): string {
  const verdi = data.get(felt);
  return typeof verdi === "string" ? verdi : "";
}

// Sjekkes i hver handling: en handling er et åpent POST-endepunkt, så å skjule skjemaet
// i siden er ikke tilgangskontroll.
async function utfor(
  data: FormData,
  sti: string,
  endre: (v: Vaktliste) => string | null,
  okMelding: string,
): Promise<Svar> {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  const jeg = finnAnsatt(getAnsatte(), valgtId);
  if (!jeg || !erAdministrator(jeg)) {
    return { ok: false, melding: "Du har ikke tilgang til å endre dette." };
  }

  try {
    const feil = endreVaktliste(
      { forventetRevisjon: Number(tekst(data, "revisjon")), endretAv: jeg.id },
      endre,
    );
    if (feil) return { ok: false, melding: feil };
  } catch (e) {
    console.error("Lagring av vaktliste feilet", e);
    return { ok: false, melding: "Kunne ikke lagre. Prøv igjen, og si fra hvis det vedvarer." };
  }

  revalidatePath(sti);
  revalidatePath("/");
  return { ok: true, melding: okMelding };
}

// --- Ansatte ---

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

// --- Statuser og endringstyper (samme side) ---

const ENDRINGSTYPER_STI = "/admin/endringstyper";

function visesIPlan(data: FormData): boolean {
  return data.get("visesIPlan") === "on";
}

export async function leggTilStatus(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    ENDRINGSTYPER_STI,
    (v) => {
      const sjekket = sjekkStatus({ name: tekst(data, "name"), visesIPlan: visesIPlan(data) }, v.statuser);
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(slugify(sjekket.name), new Set(v.statuser.map((s) => s.id)), "status");
      v.statuser.push({ id, name: sjekket.name, visesIPlan: sjekket.visesIPlan });
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
        { name: tekst(data, "name"), visesIPlan: visesIPlan(data) },
        v.statuser.filter((s) => s.id !== status.id),
      );
      if ("feil" in sjekket) return sjekket.feil;
      status.name = sjekket.name;
      status.visesIPlan = sjekket.visesIPlan;
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
        { name: tekst(data, "name"), kategori: tekst(data, "kategori") },
        v.endringstyper,
      );
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(slugify(sjekket.name), new Set(v.endringstyper.map((t) => t.id)), "type");
      v.endringstyper.push({ id, name: sjekket.name, kategori: sjekket.kategori });
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
        { name: tekst(data, "name"), kategori: tekst(data, "kategori") },
        v.endringstyper.filter((t) => t.id !== type.id),
      );
      if ("feil" in sjekket) return sjekket.feil;
      type.name = sjekket.name;
      type.kategori = sjekket.kategori;
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
