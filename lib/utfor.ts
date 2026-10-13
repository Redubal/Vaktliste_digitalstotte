import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Svar, Vaktliste } from "./domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "./identitet";
import { endreVaktliste } from "./lager";
import { getAnsatte, type Ansatt } from "./vaktlista";

export function tekst(data: FormData, felt: string): string {
  const verdi = data.get(felt);
  return typeof verdi === "string" ? verdi : "";
}

/**
 * Felles for handlingene: sjekker hvem som er valgt, lagrer og laster siden på nytt.
 * Sjekkes i hver handling: en handling er et åpent POST-endepunkt, så å skjule skjemaet
 * i siden er ikke tilgangskontroll. `krav` = "ansatt" slipper inn alle som har valgt seg selv;
 * `endre` må da selv sjekke hva personen får gjøre.
 */
export async function utforSom(
  krav: "administrator" | "ansatt",
  data: FormData,
  sti: string,
  endre: (v: Vaktliste, jeg: Ansatt) => string | null,
  okMelding: string,
): Promise<Svar> {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  const jeg = finnAnsatt(getAnsatte(), valgtId);
  if (!jeg || (krav === "administrator" && !erAdministrator(jeg))) {
    return {
      ok: false,
      melding: jeg ? "Du har ikke tilgang til å endre dette." : "Velg deg selv øverst på siden først.",
    };
  }

  try {
    const feil = endreVaktliste(
      { forventetRevisjon: Number(tekst(data, "revisjon")), endretAv: jeg.id },
      (v) => endre(v, jeg),
    );
    if (feil) return { ok: false, melding: feil };
  } catch (e) {
    console.error("Lagring av vaktliste feilet", e);
    return { ok: false, melding: "Kunne ikke lagre. Prøv igjen, og si fra hvis det vedvarer." };
  }

  revalidatePath(sti);
  // «layout» også: rotlayouten viser vedlikeholdsmeldingen og skal ikke stå igjen med gammel tilstand.
  revalidatePath("/", "layout");
  return { ok: true, melding: okMelding };
}
