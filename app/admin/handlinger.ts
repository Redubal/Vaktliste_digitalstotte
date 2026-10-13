"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  ledigId,
  nektSletting,
  sjekkLokasjon,
  slugify,
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

  revalidatePath("/admin/lokasjoner");
  revalidatePath("/");
  return { ok: true, melding: okMelding };
}

export async function leggTilLokasjon(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    (v) => {
      const sjekket = sjekkLokasjon({ name: tekst(data, "name"), team: tekst(data, "team") }, v.lokasjoner);
      if ("feil" in sjekket) return sjekket.feil;
      const id = ledigId(slugify(sjekket.name), new Set(v.lokasjoner.map((l) => l.id)));
      v.lokasjoner.push({ id, name: sjekket.name, team: sjekket.team });
      return null;
    },
    "Lokasjonen er lagt til.",
  );
}

export async function endreLokasjon(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    (v) => {
      const lokasjon = v.lokasjoner.find((l) => l.id === tekst(data, "id"));
      if (!lokasjon) return "Lokasjonen finnes ikke lenger. Last siden på nytt.";
      const sjekket = sjekkLokasjon(
        { name: tekst(data, "name"), team: tekst(data, "team") },
        v.lokasjoner.filter((l) => l.id !== lokasjon.id),
      );
      if ("feil" in sjekket) return sjekket.feil;
      lokasjon.name = sjekket.name;
      lokasjon.team = sjekket.team;
      return null;
    },
    "Endringen er lagret.",
  );
}

export async function slettLokasjon(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utfor(
    data,
    (v) => {
      const lokasjon = v.lokasjoner.find((l) => l.id === tekst(data, "id"));
      if (!lokasjon) return "Lokasjonen finnes ikke lenger. Last siden på nytt.";
      const nektet = nektSletting(v, lokasjon);
      if (nektet) return nektet;
      v.lokasjoner = v.lokasjoner.filter((l) => l.id !== lokasjon.id);
      return null;
    },
    "Lokasjonen er slettet.",
  );
}
