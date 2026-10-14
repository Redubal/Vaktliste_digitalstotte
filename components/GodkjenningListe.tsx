"use client";

import type { Endring } from "@/lib/vaktlista";
import { useRettVindu, type EndringValg } from "./EndringVindu";
import { VenterListe } from "./Godkjenning";

/** Lista i Admin → Godkjenning, med «Rett» på hver rad (åpner samme vindu som i Ukeplan). */
export function GodkjenningListe({
  endringer,
  alleEndringer,
  overlappIder,
  revisjon,
  jegId,
  valg,
  teamAvPerson,
}: {
  endringer: Endring[];
  /** Alle endringer som ikke er avvist, så vinduet kan varsle om overlapp med dem. */
  alleEndringer: Endring[];
  overlappIder: string[];
  revisjon: number;
  jegId: string;
  valg: EndringValg;
  teamAvPerson: Record<string, string>;
}) {
  const { rett, vindu } = useRettVindu({ jegId, revisjon, valg, teamAvPerson, endringer: alleEndringer });
  return (
    <>
      <VenterListe endringer={endringer} revisjon={revisjon} onRett={rett} overlappIder={overlappIder} />
      {vindu}
    </>
  );
}
