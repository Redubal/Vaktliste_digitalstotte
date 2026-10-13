"use client";

import { useActionState } from "react";
import { endreLokasjon, leggTilLokasjon, slettLokasjon } from "@/app/admin/handlinger";
import { LOKASJON_MAKSLENGDE, type Team } from "@/lib/domene";
import { Bruk, Feil, Lagringsstatus, useSkjemaStatus } from "./AdminFelles";

export type LokasjonVisning = {
  id: string;
  name: string;
  teamId: string;
  antallBrukere: number;
};

function TeamValg({ team, verdi }: { team: Team[]; verdi: string }) {
  return (
    <select name="teamId" defaultValue={verdi} aria-label="Team">
      {team.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

function NyLokasjon({ team, revisjon }: { team: Team[]; revisjon: number }) {
  const [svar, handling, venter] = useActionState(leggTilLokasjon, null);
  const status = useSkjemaStatus({ name: "", teamId: team[0]?.id ?? "" }, svar);
  return (
    <form action={handling} className={status.skjemaKlasse} onInput={status.onInput}>
      <input type="hidden" name="revisjon" value={revisjon} />
      <input
        name="name"
        placeholder="Ny lokasjon"
        aria-label="Navn på ny lokasjon"
        maxLength={LOKASJON_MAKSLENGDE}
        required
      />
      <TeamValg team={team} verdi={team[0]?.id ?? ""} />
      <button className="uke-btn" type="submit" disabled={venter}>
        Legg til
      </button>
      <Lagringsstatus endret={status.endret} lagret={status.lagret} />
      <Feil svar={svar} />
    </form>
  );
}

function LokasjonRad({
  lokasjon,
  team,
  revisjon,
}: {
  lokasjon: LokasjonVisning;
  team: Team[];
  revisjon: number;
}) {
  const [endreSvar, endreHandling, lagrer] = useActionState(endreLokasjon, null);
  const [slettSvar, slettHandling, sletter] = useActionState(slettLokasjon, null);
  const opptatt = lagrer || sletter;
  const status = useSkjemaStatus({ name: lokasjon.name, teamId: lokasjon.teamId }, endreSvar);

  return (
    <li>
      <form action={endreHandling} className={status.skjemaKlasse} onInput={status.onInput}>
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={lokasjon.id} />
        <input
          name="name"
          defaultValue={lokasjon.name}
          aria-label={`Navn på ${lokasjon.name}`}
          maxLength={LOKASJON_MAKSLENGDE}
          required
        />
        <TeamValg team={team} verdi={lokasjon.teamId} />
        <Bruk antall={lokasjon.antallBrukere} />
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

export function LokasjonAdmin({
  lokasjoner,
  team,
  revisjon,
}: {
  lokasjoner: LokasjonVisning[];
  team: Team[];
  revisjon: number;
}) {
  // Hver rad husker sine egne verdier. Skjemaet for ny lokasjon tømmes når antall rader endres.
  return (
    <div>
      <NyLokasjon key={lokasjoner.length} team={team} revisjon={revisjon} />
      <ul className="admin-lokasjoner">
        {lokasjoner.map((l) => (
          <LokasjonRad key={l.id} lokasjon={l} team={team} revisjon={revisjon} />
        ))}
      </ul>
    </div>
  );
}
