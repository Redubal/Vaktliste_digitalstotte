"use client";

import { useActionState } from "react";
import { giTeam } from "@/app/admin/handlinger";
import type { Team } from "@/lib/domene";
import { Feil } from "./AdminFelles";
import { AktivKnapp, komInn } from "./AnsattAdmin";

/** En person uten oppsett: kommer fra synken og er ikke med i planen før vedkommende har et team. */
export type NyAnsatt = {
  brukerId: string;
  name: string;
  upn: string | null;
  aktiv: boolean;
  opprettet: string | null;
};

function NyRad({ ansatt, team, revisjon }: { ansatt: NyAnsatt; team: Team[]; revisjon: number }) {
  const [svar, handling, lagrer] = useActionState(giTeam, null);
  return (
    <li className={ansatt.aktiv ? "admin-nyrad" : "admin-deaktivert admin-nyrad"}>
      <div className="admin-nyinnhold">
        <form action={handling} className="admin-skjema">
          <input type="hidden" name="revisjon" value={revisjon} />
          <input type="hidden" name="brukerId" value={ansatt.brukerId} />
          <strong className="admin-navn">{ansatt.name}</strong>
          {ansatt.upn ? <span className="admin-bruk">{ansatt.upn}</span> : null}
          <span className="admin-bruk">Kom inn: {komInn(ansatt.opprettet)}</span>
          {ansatt.aktiv ? (
            <>
              <select name="teamId" defaultValue="" required aria-label={`Team for ${ansatt.name}`}>
                <option value="" disabled>
                  Velg team
                </option>
                {team.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button className="uke-btn" type="submit" disabled={lagrer}>
                Legg til i team
              </button>
            </>
          ) : (
            <span className="admin-bruk">Deaktivert</span>
          )}
          <Feil svar={svar} />
        </form>
        <AktivKnapp ansatt={ansatt} revisjon={revisjon} />
      </div>
    </li>
  );
}

export function NyeAnsatte({ nye, team, revisjon }: { nye: NyAnsatt[]; team: Team[]; revisjon: number }) {
  if (nye.length === 0) return <p className="admin-ingress">Ingen nye personer venter på team.</p>;
  return (
    <ul className="admin-lokasjoner">
      {nye.map((a) => (
        <NyRad key={a.brukerId} ansatt={a} team={team} revisjon={revisjon} />
      ))}
    </ul>
  );
}
