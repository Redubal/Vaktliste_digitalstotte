"use server";

import { redirect } from "next/navigation";
import type { Svar } from "@/lib/domene";
import { lokalModus } from "@/lib/identitet";
import { avsluttOkt, byttPassord, lesOkt, opprettOkt, provInnlogging } from "@/lib/innlogging";
import { tekst } from "@/lib/utfor";
import { getAnsatte } from "@/lib/vaktlista";

/** Svaret til innloggingsskjemaet. E-posten sendes tilbake så feltet ikke tømmes etter et galt forsøk. */
export type InnloggingSvar = { melding: string; epost: string } | null;

const MAKS_EPOSTLENGDE = 320;

export async function loggInn(_forrige: InnloggingSvar, data: FormData): Promise<InnloggingSvar> {
  if (lokalModus()) redirect("/");
  const epost = tekst(data, "epost").trim().slice(0, MAKS_EPOSTLENGDE);
  const oppgitt = tekst(data, "passord");
  if (!epost || !oppgitt) return { melding: "Skriv inn e-post og passord.", epost };

  const nokkel = epost.toLowerCase();
  // Bare aktive ansatte med team (som i planen). Andre får samme svar som en ukjent adresse.
  const ansatt = getAnsatte().find((a) => a.upn.trim().toLowerCase() === nokkel) ?? null;
  const utfall = await provInnlogging(ansatt?.id ?? null, nokkel, oppgitt);
  if (!utfall.ok || !ansatt) return { melding: utfall.ok ? "Feil e-post eller passord." : utfall.melding, epost };

  await opprettOkt(ansatt.id);
  redirect(utfall.maaBytte ? "/bytt-passord" : "/");
}

export async function loggUt(): Promise<void> {
  await avsluttOkt();
  redirect("/logg-inn");
}

export async function byttMittPassord(_forrige: Svar | null, data: FormData): Promise<Svar> {
  if (lokalModus()) redirect("/");
  const økt = await lesOkt();
  if (!økt) redirect("/logg-inn");
  const feil = await byttPassord(økt.brukerId, tekst(data, "gammelt"), tekst(data, "nytt"), tekst(data, "gjenta"));
  if (feil) return { ok: false, melding: feil };
  redirect("/");
}
