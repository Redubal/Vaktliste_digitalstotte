"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  lesSortering,
  nesteSortering,
  skrivSortering,
  type Sortering,
} from "@/lib/sortering";

/**
 * Sorteringen fra adressen (`?sorter=`). Å klikke en overskrift bytter bare adressen på stedet
 * (`replaceState`), uten å hente siden på nytt og uten ny rad i nettleserhistorikken.
 */
export function useSortering(kolonner: readonly string[]) {
  const params = useSearchParams();
  const sortering = lesSortering(params.get("sorter"), kolonner);

  function sorterPaa(kolonne: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("sorter", skrivSortering(nesteSortering(sortering, kolonne)));
    window.history.replaceState(null, "", url);
  }

  return { sortering, sorterPaa };
}

/** Klikkbar overskrift med pil. `aria-sort` settes på `<th>` med `ariaSort` fra `lib/sortering`. */
export function SorterKnapp({
  kolonne,
  sortering,
  onSorter,
  children,
}: {
  kolonne: string;
  sortering: Sortering | null;
  onSorter: (kolonne: string) => void;
  children: ReactNode;
}) {
  const aktiv = sortering?.kolonne === kolonne;
  return (
    <button type="button" className="sorter-knapp" onClick={() => onSorter(kolonne)}>
      {children}
      <span className="sorter-pil" aria-hidden="true">
        {aktiv ? (sortering.retning === "stigende" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}
