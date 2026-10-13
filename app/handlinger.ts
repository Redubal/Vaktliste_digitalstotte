"use server";

import {
  leggTilEndring,
  rettEndring,
  slettEndring as slettEndringRad,
  type Aktør,
  type EndringSkjema,
  type Svar,
  type Vaktliste,
} from "@/lib/domene";
import { tekst, utforSom } from "@/lib/utfor";
import type { Ansatt } from "@/lib/vaktlista";

// Handlingene fra Ukeplan og Måned. Alle som har valgt seg selv slipper inn; hva hver person
// får gjøre (egne endringer, bare de som venter) sjekkes i `lib/domene.ts`.

function somAktør(v: Vaktliste, jeg: Ansatt): { feil: string } | { aktør: Aktør } {
  if (!jeg.erAdministrator && v.innstillinger.vedlikehold) return { feil: v.innstillinger.melding };
  return { aktør: { id: jeg.id, erAdmin: jeg.erAdministrator } };
}

function skjema(data: FormData): EndringSkjema {
  return {
    typeId: tekst(data, "typeId"),
    lokasjonId: tekst(data, "lokasjonId"),
    fromDate: tekst(data, "fromDate"),
    toDate: tekst(data, "toDate"),
    fromTime: tekst(data, "fromTime"),
    toTime: tekst(data, "toTime"),
    comment: tekst(data, "comment"),
  };
}

/** Ny endring når `id` er tom, ellers retting av endringen med den id-en. */
export async function lagreEndring(_forrige: Svar | null, data: FormData): Promise<Svar> {
  const id = tekst(data, "id");
  return utforSom(
    "ansatt",
    data,
    "/",
    (v, jeg) => {
      const s = somAktør(v, jeg);
      if ("feil" in s) return s.feil;
      return id
        ? rettEndring(v, id, skjema(data), s.aktør)
        : leggTilEndring(v, tekst(data, "brukerId"), skjema(data), s.aktør);
    },
    id ? "Endringen er rettet." : "Endringen er lagt inn.",
  );
}

export async function slettEndring(_forrige: Svar | null, data: FormData): Promise<Svar> {
  return utforSom(
    "ansatt",
    data,
    "/",
    (v, jeg) => {
      const s = somAktør(v, jeg);
      if ("feil" in s) return s.feil;
      return slettEndringRad(v, tekst(data, "id"), s.aktør);
    },
    "Endringen er slettet.",
  );
}
