"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { avvis, godkjenn } from "@/app/admin/handlinger";
import { AVVIST_GRUNN_MAKSLENGDE } from "@/lib/domene";
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

/**
 * Avviser én endring, med valgfri begrunnelse i et lite vindu. Vinduet legges i `body`, så stilene
 * til cella det ble åpnet fra ikke smitter over. Bare for administratorer, som «Godkjenn».
 */
export function AvvisKnapp({ endringId, revisjon, navn }: { endringId: string; revisjon: number; navn: string }) {
  const [aapen, setAapen] = useState(false);
  return (
    <>
      <button className="uke-btn avvis-knapp" type="button" onClick={() => setAapen(true)} aria-label={`Avvis ${navn}`}>
        Avvis
      </button>
      {aapen &&
        createPortal(
          <AvvisVindu endringId={endringId} revisjon={revisjon} navn={navn} onLukk={() => setAapen(false)} />,
          document.body,
        )}
    </>
  );
}

function AvvisVindu({
  endringId,
  revisjon,
  navn,
  onLukk,
}: {
  endringId: string;
  revisjon: number;
  navn: string;
  onLukk: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    // Utviklingsmodus kjører effekten to ganger; et åpent vindu skal ikke åpnes på nytt.
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  const [svar, handling, avviser] = useActionState(avvis, null);
  useEffect(() => {
    if (svar?.ok) ref.current?.close();
  }, [svar]);

  return (
    <dialog ref={ref} className="endring-vindu" aria-labelledby="avvis-vindu-tittel" onClose={onLukk}>
      <h2 id="avvis-vindu-tittel">Avvis endringen</h2>
      <p className="vindu-merknad">{navn}</p>
      <form action={handling} className="vindu-skjema">
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={endringId} />
        <label className="vindu-felt">
          <span>Begrunnelse (valgfritt)</span>
          <input type="text" name="avvistGrunn" maxLength={AVVIST_GRUNN_MAKSLENGDE} autoFocus />
        </label>
        <p className="vindu-info">En avvist endring vises ikke i planen.</p>
        <Feil svar={svar} />
        <div className="vindu-knapper">
          <button className="uke-btn slett-knapp" type="submit" disabled={avviser}>
            {avviser ? "Avviser …" : "Avvis"}
          </button>
          <button className="uke-btn" type="button" onClick={() => ref.current?.close()}>
            Avbryt
          </button>
        </div>
      </form>
    </dialog>
  );
}

/** «Godkjenn» og «Avvis» side om side, for én endring som venter. */
export function BehandleKnapper(props: { endringId: string; revisjon: number; navn: string }) {
  return (
    <div className="godkjenn-knapper">
      <GodkjennKnapp {...props} />
      <AvvisKnapp {...props} />
    </div>
  );
}

/**
 * Sammenleggbart panel i Ukeplan og Måned med alle endringer som venter, uansett uke, måned og team
 * (samme utvalg som Admin → Godkjenning). Vises ikke når ingen venter.
 */
export function VenterPanel({ endringer, revisjon }: { endringer: Endring[]; revisjon: number | null }) {
  const venter = useMemo(
    () =>
      endringer
        .filter((e) => e.virkning === "venter")
        .sort((a, b) => a.fromDate.localeCompare(b.fromDate) || a.person.localeCompare(b.person, "nb")),
    [endringer],
  );

  if (venter.length === 0) return null;
  return (
    <details className="panel venter-panel">
      <summary>
        {venter.length} {venter.length === 1 ? "endring venter" : "endringer venter"} på godkjenning
      </summary>
      <VenterListe endringer={venter} revisjon={revisjon} />
    </details>
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
            {revisjon !== null && <th>Behandle</th>}
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
                  <BehandleKnapper endringId={e.id} revisjon={revisjon} navn={`${hva(e)} for ${e.person}, ${periode(e)}`} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
