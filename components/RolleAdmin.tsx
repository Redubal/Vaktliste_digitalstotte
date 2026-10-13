"use client";

import { useActionState } from "react";
import { endreRolle, leggTilRolle, slettRolle } from "@/app/admin/handlinger";
import { ROLLE_MAKSLENGDE } from "@/lib/domene";
import { Bruk, Feil, Lagringsstatus, useSkjemaStatus } from "./AdminFelles";

export type RolleVisning = {
  id: string;
  name: string;
  antallBrukere: number;
};

function NyRolle({ revisjon }: { revisjon: number }) {
  const [svar, handling, venter] = useActionState(leggTilRolle, null);
  const status = useSkjemaStatus({ name: "" }, svar);
  return (
    <form action={handling} className={status.skjemaKlasse} onInput={status.onInput}>
      <input type="hidden" name="revisjon" value={revisjon} />
      <input
        name="name"
        placeholder="Ny rolle"
        aria-label="Navn på ny rolle"
        maxLength={ROLLE_MAKSLENGDE}
        required
      />
      <button className="uke-btn" type="submit" disabled={venter}>
        Legg til
      </button>
      <Lagringsstatus endret={status.endret} lagret={status.lagret} />
      <Feil svar={svar} />
    </form>
  );
}

function RolleRad({ rolle, revisjon }: { rolle: RolleVisning; revisjon: number }) {
  const [endreSvar, endreHandling, lagrer] = useActionState(endreRolle, null);
  const [slettSvar, slettHandling, sletter] = useActionState(slettRolle, null);
  const opptatt = lagrer || sletter;
  const status = useSkjemaStatus({ name: rolle.name }, endreSvar);

  return (
    <li>
      <form action={endreHandling} className={status.skjemaKlasse} onInput={status.onInput}>
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={rolle.id} />
        <input
          name="name"
          defaultValue={rolle.name}
          aria-label={`Navn på ${rolle.name}`}
          maxLength={ROLLE_MAKSLENGDE}
          required
        />
        <Bruk antall={rolle.antallBrukere} />
        <button className="uke-btn" type="submit" disabled={opptatt}>
          Lagre
        </button>
        <button className="uke-btn" type="submit" formAction={slettHandling} disabled={opptatt}>
          Slett
        </button>
        <Lagringsstatus endret={status.endret} lagret={status.lagret} />
        <Feil svar={endreSvar} />
        <Feil svar={slettSvar} />
      </form>
    </li>
  );
}

export function RolleAdmin({ roller, revisjon }: { roller: RolleVisning[]; revisjon: number }) {
  // Hver rad husker sine egne verdier. Skjemaet for ny rolle tømmes når antall rader endres.
  return (
    <div>
      <NyRolle key={roller.length} revisjon={revisjon} />
      <ul className="admin-lokasjoner">
        {roller.map((r) => (
          <RolleRad key={r.id} rolle={r} revisjon={revisjon} />
        ))}
      </ul>
    </div>
  );
}
