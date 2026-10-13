"use client";

import type { Endring } from "@/lib/vaktlista";
import { useRettVindu, type EndringValg } from "./EndringVindu";
import { VenterListe } from "./Godkjenning";

/** Lista i Admin → Godkjenning, med «Rett» på hver rad (åpner samme vindu som i Ukeplan). */
export function GodkjenningListe({
  endringer,
  revisjon,
  jegId,
  valg,
  teamAvPerson,
}: {
  endringer: Endring[];
  revisjon: number;
  jegId: string;
  valg: EndringValg;
  teamAvPerson: Record<string, string>;
}) {
  const { rett, vindu } = useRettVindu({ jegId, revisjon, valg, teamAvPerson });
  return (
    <>
      <VenterListe endringer={endringer} revisjon={revisjon} onRett={rett} />
      {vindu}
    </>
  );
}
