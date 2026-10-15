import type { Ansatt } from "./vaktlista";

/**
 * Hvem brukeren er. Fra Fase 45 avgjøres det av innloggingen (`lib/innlogging.ts`): kapselen
 * `OKT_COOKIE` bærer et tilfeldig token som slås opp i tabellen `okt`.
 *
 * Fila importerer med vilje ingenting som bare virker på serveren, slik at både server- og
 * klientkode, og `proxy.ts`, kan bruke den.
 */
export const OKT_COOKIE = "vaktliste-okt";

/**
 * `AUTH_MODUS=lokal` i `.env.local` beholder «Du er»-velgeren i utvikling, uten passord. Gjelder
 * aldri i produksjon (`next build`/`next start`), så en glemt variabel åpner ikke appen.
 */
export function lokalModus(): boolean {
  return process.env.AUTH_MODUS === "lokal" && process.env.NODE_ENV !== "production";
}

/**
 * Velgeren i lokal modus, lagret i en informasjonskapsel. Ikke innlogging: enhver kan velge
 * hvem som helst, også en administrator. Brukes bare med `lokalModus()`.
 */
export const IDENTITET_COOKIE = "vaktliste-identitet";

/** Ett år. Valget er en bekvemmelighet, ikke en sesjon som skal utløpe. */
export const IDENTITET_MAKS_ALDER = 60 * 60 * 24 * 365;

export function finnAnsatt(ansatte: Ansatt[], id: string | null | undefined): Ansatt | null {
  if (!id) return null;
  return ansatte.find((a) => a.id === id) ?? null;
}

export function erAdministrator(ansatt: Ansatt | null): boolean {
  return ansatt?.erAdministrator === true;
}
