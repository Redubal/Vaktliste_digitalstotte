"use client";

import { useActionState, useState } from "react";
import { settIdagFarge } from "@/app/admin/handlinger";
import type { Innstillinger } from "@/lib/domene";
import { Feil, Lagringsstatus, useSkjemaStatus } from "./AdminFelles";

/** Standardfargen på rammen er `--idag-ramme` i globals.css (= `--heading`); vises når «Egen farge» er av. */
const STANDARD_RAMME = "#10263b";
const STANDARD_FYLL = "#ffffff";

/** Velger rammen og fyllet i dagens rute. Uten avkryssing gjelder standard: mørk ramme, ingen egen fyll. */
export function IdagFargeAdmin({ innstillinger, revisjon }: { innstillinger: Innstillinger; revisjon: number }) {
  const [svar, handling, venter] = useActionState(settIdagFarge, null);
  const { idagFarge, idagFyll } = innstillinger;
  const [egenRamme, setEgenRamme] = useState(idagFarge !== null);
  const [ramme, setRamme] = useState(idagFarge ?? "#d62828");
  const [egenFyll, setEgenFyll] = useState(idagFyll !== null);
  const [fyll, setFyll] = useState(idagFyll ?? "#ffe9a8");
  const status = useSkjemaStatus(
    {
      egenFarge: idagFarge !== null ? "on" : "",
      farge: idagFarge ?? "",
      egenFyll: idagFyll !== null ? "on" : "",
      fyll: idagFyll ?? "",
    },
    svar,
  );

  return (
    <form action={handling} className={`${status.skjemaKlasse} idagfarge-skjema`} onInput={status.onInput}>
      <input type="hidden" name="revisjon" value={revisjon} />
      <p className="admin-ingress">
        Rammen og fyllet i dagens dato i Uke og Måned. Uten egen farge er rammen mørk blå, som overskriftene, og
        fyllet er ikke valgt. I mobilkalenderen er det bare rammen som endres.
      </p>
      <label>
        <input type="checkbox" name="egenFarge" checked={egenRamme} onChange={(e) => setEgenRamme(e.target.checked)} />{" "}
        Egen ramme
      </label>
      <input
        type="color"
        name="farge"
        value={egenRamme ? ramme : STANDARD_RAMME}
        disabled={!egenRamme}
        onChange={(e) => setRamme(e.target.value)}
        aria-label="Farge på rammen"
      />
      <label>
        <input type="checkbox" name="egenFyll" checked={egenFyll} onChange={(e) => setEgenFyll(e.target.checked)} />{" "}
        Eget fyll
      </label>
      <input
        type="color"
        name="fyll"
        value={egenFyll ? fyll : STANDARD_FYLL}
        disabled={!egenFyll}
        onChange={(e) => setFyll(e.target.value)}
        aria-label="Fyllfarge"
      />
      <span
        className="idagfarge-forhandsvis"
        style={{
          boxShadow: `inset 0 0 0 3px ${egenRamme ? ramme : STANDARD_RAMME}`,
          backgroundColor: egenFyll ? fyll : undefined,
        }}
        aria-hidden="true"
      >
        17
      </span>
      <button className="uke-btn" type="submit" disabled={venter}>
        Lagre
      </button>
      <Lagringsstatus endret={status.endret} lagret={status.lagret} />
      <Feil svar={svar} />
    </form>
  );
}
