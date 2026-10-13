// Sortering i kolonner. Valget ligger i adressen som `?sorter=kolonne` (stigende) eller
// `?sorter=-kolonne` (synkende), så det tåler oppdatering av siden. Ingen imports: kan brukes overalt.

export type Retning = "stigende" | "synkende";
export type Sortering = { kolonne: string; retning: Retning };

/** Leser `sorter`-verdien. Ukjent kolonne gir `null` (ingen sortering). */
export function lesSortering(verdi: string | null, kolonner: readonly string[]): Sortering | null {
  if (!verdi) return null;
  const synkende = verdi.startsWith("-");
  const kolonne = synkende ? verdi.slice(1) : verdi;
  if (!kolonner.includes(kolonne)) return null;
  return { kolonne, retning: synkende ? "synkende" : "stigende" };
}

export function skrivSortering(s: Sortering): string {
  return s.retning === "synkende" ? `-${s.kolonne}` : s.kolonne;
}

/** Klikk på en overskrift: ny kolonne starter stigende, samme kolonne snur retningen. */
export function nesteSortering(naa: Sortering | null, kolonne: string): Sortering {
  if (naa?.kolonne === kolonne) {
    return { kolonne, retning: naa.retning === "stigende" ? "synkende" : "stigende" };
  }
  return { kolonne, retning: "stigende" };
}

export function ariaSort(s: Sortering | null, kolonne: string): "ascending" | "descending" | "none" {
  if (s?.kolonne !== kolonne) return "none";
  return s.retning === "stigende" ? "ascending" : "descending";
}

const samling = new Intl.Collator("nb", { numeric: true, sensitivity: "base" });

/**
 * Sorterer en kopi av lista. `verdier` sier hvordan hver kolonne leses ut av en rad. Like verdier
 * beholder rekkefølgen de hadde (stabil sortering), og tomme verdier havner nederst uansett retning.
 */
export function sorterRader<T>(
  rader: readonly T[],
  sortering: Sortering | null,
  verdier: Record<string, (rad: T) => string>,
): T[] {
  if (!sortering) return [...rader];
  const hent = verdier[sortering.kolonne];
  if (!hent) return [...rader];
  const fortegn = sortering.retning === "stigende" ? 1 : -1;
  return [...rader].sort((a, b) => {
    const x = hent(a);
    const y = hent(b);
    if (!x && !y) return 0;
    if (!x) return 1;
    if (!y) return -1;
    return fortegn * samling.compare(x, y);
  });
}
