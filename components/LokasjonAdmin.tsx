"use client";

import { useActionState } from "react";
import { endreLokasjon, leggTilLokasjon, slettLokasjon } from "@/app/admin/handlinger";
import { LOKASJON_MAKSLENGDE, TEAM, type Svar } from "@/lib/domene";

export type LokasjonVisning = {
  id: string;
  name: string;
  team: string;
  antallBrukere: number;
};

function Feil({ svar }: { svar: Svar | null }) {
  if (!svar || svar.ok) return null;
  return (
    <p className="admin-feil" role="alert">
      {svar.melding}
    </p>
  );
}

function TeamValg({ verdi }: { verdi: string }) {
  return (
    <select name="team" defaultValue={verdi} aria-label="Team">
      {TEAM.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

function NyLokasjon({ revisjon }: { revisjon: number }) {
  const [svar, handling, venter] = useActionState(leggTilLokasjon, null);
  return (
    <form action={handling} className="admin-skjema">
      <input type="hidden" name="revisjon" value={revisjon} />
      <input
        name="name"
        placeholder="Ny lokasjon"
        aria-label="Navn på ny lokasjon"
        maxLength={LOKASJON_MAKSLENGDE}
        required
      />
      <TeamValg verdi={TEAM[0]} />
      <button className="uke-btn" type="submit" disabled={venter}>
        Legg til
      </button>
      <Feil svar={svar} />
    </form>
  );
}

function LokasjonRad({ lokasjon, revisjon }: { lokasjon: LokasjonVisning; revisjon: number }) {
  const [endreSvar, endreHandling, lagrer] = useActionState(endreLokasjon, null);
  const [slettSvar, slettHandling, sletter] = useActionState(slettLokasjon, null);
  const opptatt = lagrer || sletter;

  return (
    <li>
      <form action={endreHandling} className="admin-skjema">
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={lokasjon.id} />
        <input
          name="name"
          defaultValue={lokasjon.name}
          aria-label={`Navn på ${lokasjon.name}`}
          maxLength={LOKASJON_MAKSLENGDE}
          required
        />
        <TeamValg verdi={lokasjon.team} />
        <span className="admin-bruk">
          {lokasjon.antallBrukere === 0
            ? "Ikke i bruk"
            : `Brukes av ${lokasjon.antallBrukere} ${lokasjon.antallBrukere === 1 ? "person" : "personer"}`}
        </span>
        <button className="uke-btn" type="submit" disabled={opptatt}>
          Lagre
        </button>
        <button className="uke-btn" type="submit" formAction={slettHandling} disabled={opptatt}>
          Slett
        </button>
        <Feil svar={endreSvar} />
        <Feil svar={slettSvar} />
      </form>
    </li>
  );
}

export function LokasjonAdmin({
  lokasjoner,
  revisjon,
}: {
  lokasjoner: LokasjonVisning[];
  revisjon: number;
}) {
  // Nøkkelen byttes ved hver lagring, slik at skjemaene får friske verdier og tømmes.
  return (
    <div key={revisjon}>
      <NyLokasjon revisjon={revisjon} />
      <ul className="admin-lokasjoner">
        {lokasjoner.map((l) => (
          <LokasjonRad key={l.id} lokasjon={l} revisjon={revisjon} />
        ))}
      </ul>
    </div>
  );
}
