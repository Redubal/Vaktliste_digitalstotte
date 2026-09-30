import type { Ansatt } from "./vaktlista";

/**
 * Hvem brukeren har valgt å være, lagret i en informasjonskapsel.
 *
 * Kapsel og ikke nettleserlagring, fordi serveren må kunne lese valget: det er
 * serveren som avgjør hvilke faner og hvilke sider brukeren får. Ligger valget
 * bare i nettleseren, må alt innhold sendes ut og skjules med CSS.
 *
 * Fila importerer med vilje ingenting som bare virker på serveren, slik at både
 * server- og klientkode kan bruke den.
 *
 * MERK: dette er ikke innlogging. Enhver kan velge hvem som helst i lista og få
 * admintilgang. Det er en feilsikring mot å klikke feil, ikke en sikkerhets-
 * grense. Ekte skille kommer med Entra SSO, og da skal dette fjernes — ikke
 * bygges videre på.
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
