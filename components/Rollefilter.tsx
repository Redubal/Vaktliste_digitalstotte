"use client";

import { useSearchParams } from "next/navigation";

/**
 * Rollefilteret fra adressen (`?rolle=`), på samme måte som sorteringen: et valg bytter bare
 * adressen på stedet (`replaceState`), så det tåler oppdatering. `null` betyr alle roller.
 * En rolle som ikke finnes i listen (gammel lenke) gir `null`.
 */
export function useRollefilter(roller: readonly string[]) {
  const params = useSearchParams();
  const verdi = params.get("rolle");
  const rolle = verdi !== null && roller.includes(verdi) ? verdi : null;

  function velgRolle(ny: string | null) {
    const url = new URL(window.location.href);
    if (ny === null) url.searchParams.delete("rolle");
    else url.searchParams.set("rolle", ny);
    window.history.replaceState(null, "", url);
  }

  return { rolle, velgRolle };
}

export function Rollevelger({
  roller,
  rolle,
  onVelg,
}: {
  roller: readonly string[];
  rolle: string | null;
  onVelg: (rolle: string | null) => void;
}) {
  return (
    <label className="select-field">
      <span>Rolle</span>
      <select value={rolle ?? ""} onChange={(e) => onVelg(e.target.value === "" ? null : e.target.value)}>
        <option value="">Alle roller</option>
        {roller.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </label>
  );
}
