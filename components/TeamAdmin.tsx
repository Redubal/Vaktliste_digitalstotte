"use client";

import { useActionState } from "react";
import { endreTeam, leggTilTeam, slettTeam } from "@/app/admin/handlinger";
import { TEAM_MAKSLENGDE } from "@/lib/domene";
import { Bruk, Feil, Lagringsstatus, useSkjemaStatus } from "./AdminFelles";

export type TeamVisning = {
  id: string;
  name: string;
  antallBrukere: number;
};

function NyttTeam({ revisjon }: { revisjon: number }) {
  const [svar, handling, venter] = useActionState(leggTilTeam, null);
  const status = useSkjemaStatus({ name: "" }, svar);
  return (
    <form action={handling} className={status.skjemaKlasse} onInput={status.onInput}>
      <input type="hidden" name="revisjon" value={revisjon} />
      <input
        name="name"
        placeholder="Nytt team"
        aria-label="Navn på nytt team"
        maxLength={TEAM_MAKSLENGDE}
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

function TeamRad({ team, revisjon }: { team: TeamVisning; revisjon: number }) {
  const [endreSvar, endreHandling, lagrer] = useActionState(endreTeam, null);
  const [slettSvar, slettHandling, sletter] = useActionState(slettTeam, null);
  const opptatt = lagrer || sletter;
  const status = useSkjemaStatus({ name: team.name }, endreSvar);

  return (
    <li>
      <form action={endreHandling} className={status.skjemaKlasse} onInput={status.onInput}>
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={team.id} />
        <input
          name="name"
          defaultValue={team.name}
          aria-label={`Navn på ${team.name}`}
          maxLength={TEAM_MAKSLENGDE}
          required
        />
        <Bruk antall={team.antallBrukere} />
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

export function TeamAdmin({ team, revisjon }: { team: TeamVisning[]; revisjon: number }) {
  // Hver rad husker sine egne verdier. Skjemaet for nytt team tømmes når antall rader endres.
  return (
    <div>
      <NyttTeam key={team.length} revisjon={revisjon} />
      <ul className="admin-lokasjoner">
        {team.map((t) => (
          <TeamRad key={t.id} team={t} revisjon={revisjon} />
        ))}
      </ul>
    </div>
  );
}
