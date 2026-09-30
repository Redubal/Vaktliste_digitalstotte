"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { IDENTITET_COOKIE, IDENTITET_MAKS_ALDER } from "@/lib/identitet";

export type IdentitetsValg = {
  id: string;
  name: string;
};

export function IdentitetsVelger({
  valg,
  valgtId,
}: {
  valg: IdentitetsValg[];
  valgtId: string | null;
}) {
  const router = useRouter();
  const [venter, startOvergang] = useTransition();

  function velg(id: string) {
    // Tom verdi betyr «ingen valgt»: sett alder 0, så fjerner nettleseren kapselen.
    const verdi = id ? encodeURIComponent(id) : "";
    const alder = id ? IDENTITET_MAKS_ALDER : 0;
    document.cookie = `${IDENTITET_COOKIE}=${verdi}; path=/; max-age=${alder}; samesite=lax`;
    // Serveren avgjør hvilke faner som vises, så siden må rendres på nytt.
    startOvergang(() => router.refresh());
  }

  return (
    <div className="identitet">
      <label className="select-field">
        <span>Du er</span>
        <select
          value={valgtId ?? ""}
          disabled={venter}
          onChange={(event) => velg(event.target.value)}
        >
          <option value="">Velg deg selv …</option>
          {valg.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
      <p className="identitet-hint">Midlertidig valg — ikke innlogging</p>
    </div>
  );
}
