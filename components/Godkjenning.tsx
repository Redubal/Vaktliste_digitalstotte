"use client";

import { useActionState } from "react";
import { godkjenn } from "@/app/admin/handlinger";
import type { Endring } from "@/lib/vaktlista";
import { Feil } from "./AdminFelles";

/** «2026-10-13» → «13.10.2026». */
function dato(iso: string): string {
  const [aar, mnd, dag] = iso.split("-");
  return aar && mnd && dag ? `${dag}.${mnd}.${aar}` : iso;
}

export function periode(e: Endring): string {
  const fra = [dato(e.fromDate), e.fromTime].filter(Boolean).join(" ");
  const til = [e.toDate && e.toDate !== e.fromDate ? dato(e.toDate) : "", e.toTime].filter(Boolean).join(" ");
  return til ? `${fra} – ${til}` : fra;
}

/** Hva endringen gjelder: ny lokasjon, ellers typen. */
export function hva(e: Endring): string {
  if (e.newLocation) return e.type ? `${e.type} → ${e.newLocation}` : `→ ${e.newLocation}`;
  return e.type || "Endring";
}

/** Tekstmerket på en endring som venter. Teksten bærer betydningen, ikke bare fargen. */
export function VenterMerke() {
  return <span className="venter-merke">Venter</span>;
}

/**
 * Godkjenner én endring (hele perioden). Bare for administratorer: handlingen sjekker selv,
 * men knappen vises ikke for andre. Siden lastes på nytt med ny revisjon etter godkjenning.
 */
export function GodkjennKnapp({ endringId, revisjon, navn }: { endringId: string; revisjon: number; navn: string }) {
  const [svar, handling, venter] = useActionState(godkjenn, null);
  return (
    <form action={handling} className="godkjenn-skjema">
      <input type="hidden" name="revisjon" value={revisjon} />
      <input type="hidden" name="id" value={endringId} />
      <button className="uke-btn godkjenn-knapp" type="submit" disabled={venter} aria-label={`Godkjenn ${navn}`}>
        {venter ? "Godkjenner …" : "Godkjenn"}
      </button>
      <Feil svar={svar} />
    </form>
  );
}

/** Tabell over endringer som venter. Uten `revisjon` vises ingen knapper (ikke administrator). */
export function VenterListe({ endringer, revisjon }: { endringer: Endring[]; revisjon: number | null }) {
  return (
    <div className="table-wrapper">
      <table className="logg-tabell venter-tabell">
        <thead>
          <tr>
            <th>Person</th>
            <th>Gjelder</th>
            <th>Periode</th>
            <th>Status</th>
            <th>Kommentar</th>
            {revisjon !== null && <th>Godkjenn</th>}
          </tr>
        </thead>
        <tbody>
          {endringer.map((e) => (
            <tr key={e.id}>
              <td>{e.person}</td>
              <td>{hva(e)}</td>
              <td>{periode(e)}</td>
              <td>{e.status || "Ingen status"}</td>
              <td>{e.comment}</td>
              {revisjon !== null && (
                <td>
                  <GodkjennKnapp endringId={e.id} revisjon={revisjon} navn={`${hva(e)} for ${e.person}, ${periode(e)}`} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
