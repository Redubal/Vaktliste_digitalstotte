"use client";

import { useActionState } from "react";
import { endreDag, leggTilDag, slettDag } from "@/app/admin/handlinger";
import { DAG_MAKSLENGDE, type DagRad } from "@/lib/domene";
import { Feil, Lagringsstatus, useSkjemaStatus } from "./AdminFelles";

function Felter({ dag }: { dag?: DagRad }) {
  return (
    <>
      <input type="date" name="fromDate" defaultValue={dag?.fromDate} aria-label="Fra dato" required />
      <input type="date" name="toDate" defaultValue={dag?.toDate} aria-label="Til dato (tom = samme dag)" />
      <input
        name="comment"
        defaultValue={dag?.comment}
        placeholder="Tekst, for eksempel «Planleggingsdag»"
        aria-label="Tekst som vises over dagen"
        maxLength={DAG_MAKSLENGDE}
        required
      />
      <label className="admin-avkryssing">
        <input type="checkbox" name="fri" defaultChecked={dag?.fri} /> Fri for alle
      </label>
    </>
  );
}

function NyDag({ revisjon }: { revisjon: number }) {
  const [svar, handling, venter] = useActionState(leggTilDag, null);
  const status = useSkjemaStatus({ fromDate: "", toDate: "", comment: "", fri: "" }, svar);
  return (
    <form action={handling} className={status.skjemaKlasse} onInput={status.onInput}>
      <input type="hidden" name="revisjon" value={revisjon} />
      <Felter />
      <button className="uke-btn" type="submit" disabled={venter}>
        Legg til
      </button>
      <Lagringsstatus endret={status.endret} lagret={status.lagret} />
      <Feil svar={svar} />
    </form>
  );
}

function DagRadSkjema({ dag, revisjon }: { dag: DagRad; revisjon: number }) {
  const [endreSvar, endreHandling, lagrer] = useActionState(endreDag, null);
  const [slettSvar, slettHandling, sletter] = useActionState(slettDag, null);
  const opptatt = lagrer || sletter;
  const status = useSkjemaStatus(
    { fromDate: dag.fromDate, toDate: dag.toDate, comment: dag.comment, fri: dag.fri ? "on" : "" },
    endreSvar,
  );
  return (
    <li>
      <form action={endreHandling} className={status.skjemaKlasse} onInput={status.onInput}>
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={dag.id} />
        <Felter dag={dag} />
        <button className="uke-btn" type="submit" disabled={opptatt}>
          Lagre
        </button>
        <button className="uke-btn" type="submit" formAction={slettHandling} disabled={opptatt} formNoValidate>
          Slett
        </button>
        <Lagringsstatus endret={status.endret} lagret={status.lagret} />
        <Feil svar={endreSvar} />
        <Feil svar={slettSvar} />
      </form>
    </li>
  );
}

export function DagAdmin({ dager, revisjon }: { dager: DagRad[]; revisjon: number }) {
  // Skjemaet for ny dag tømmes når antall rader endres.
  return (
    <div>
      <NyDag key={dager.length} revisjon={revisjon} />
      <ul className="admin-lokasjoner">
        {dager.map((d) => (
          <DagRadSkjema key={d.id} dag={d} revisjon={revisjon} />
        ))}
      </ul>
    </div>
  );
}
