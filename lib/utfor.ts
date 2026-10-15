import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Svar, Vaktliste } from "./domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt, lokalModus } from "./identitet";
import { lesOkt } from "./innlogging";
import { endreVaktliste } from "./lager";
import { getAnsatte, type Ansatt } from "./vaktlista";

export function tekst(data: FormData, felt: string): string {
  const verdi = data.get(felt);
  return typeof verdi === "string" ? verdi : "";
}

/**
 * Den innloggede, eller `null`. Eneste sted sider, layout og handlinger finner ut hvem brukeren er.
 * `null` også når passordet må byttes først, og når personen er deaktivert eller mangler team
 * (`getAnsatte` tar bare med aktive). Med `AUTH_MODUS=lokal`: den som er valgt i «Du er».
 * Leser kapselen før databasen, så `next build` aldri leser data (Fase 43).
 */
export async function innlogget(): Promise<Ansatt | null> {
  if (lokalModus()) {
    const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
    return finnAnsatt(getAnsatte(), valgtId);
  }
  const økt = await lesOkt();
  if (!økt || økt.maaBytte) return null;
  return finnAnsatt(getAnsatte(), økt.brukerId);
}

export function ikkeInnloggetMelding(): string {
  return lokalModus() ? "Velg deg selv øverst på siden først." : "Du er ikke logget inn. Last siden på nytt.";
}

/**
 * Felles for handlingene: sjekker hvem som er innlogget, lagrer og laster siden på nytt.
 * Sjekkes i hver handling: en handling er et åpent POST-endepunkt, så å skjule skjemaet
 * i siden er ikke tilgangskontroll. `krav` = "ansatt" slipper inn alle som er innlogget;
 * `endre` må da selv sjekke hva personen får gjøre.
 */
export async function utforSom(
  krav: "administrator" | "ansatt",
  data: FormData,
  sti: string,
  endre: (v: Vaktliste, jeg: Ansatt) => string | null,
  okMelding: string,
): Promise<Svar> {
  const jeg = await innlogget();
  if (!jeg || (krav === "administrator" && !erAdministrator(jeg))) {
    return {
      ok: false,
      melding: jeg ? "Du har ikke tilgang til å endre dette." : ikkeInnloggetMelding(),
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
