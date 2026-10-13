"use client";

import { useActionState } from "react";
import { endreAnsatt, settAnsattAktiv } from "@/app/admin/handlinger";
import type { Lokasjon, Rolle, Team } from "@/lib/domene";
import { Feil, Lagringsstatus, useSkjemaStatus } from "./AdminFelles";

export type AnsattVisning = {
  /** Id-en til oppsettet (ikke brukeren): en person kan ha flere oppsett. */
  id: string;
  brukerId: string;
  name: string;
  teamId: string;
  rolleId: string | null;
  lokasjonId: string | null;
  erAdministrator: boolean;
  aktiv: boolean;
  /** ISO-tid; `null` for dem som fantes før loggen. */
  opprettet: string | null;
};

type Valg = { team: Team[]; roller: Rolle[]; lokasjoner: Lokasjon[]; teamNavn: Map<string, string> };

function komInn(opprettet: string | null): string {
  return opprettet ? opprettet.slice(0, 10) : "før loggen";
}

/** Knappen som deaktiverer eller aktiverer en person. Eget skjema, så den ikke lagrer resten av raden. */
function AktivKnapp({ ansatt, revisjon }: { ansatt: AnsattVisning; revisjon: number }) {
  const [svar, handling, lagrer] = useActionState(settAnsattAktiv, null);
  return (
    <form action={handling} className="admin-skjema">
      <input type="hidden" name="revisjon" value={revisjon} />
      <input type="hidden" name="brukerId" value={ansatt.brukerId} />
      <input type="hidden" name="aktiv" value={ansatt.aktiv ? "false" : "true"} />
      <button className="uke-btn" type="submit" disabled={lagrer}>
        {ansatt.aktiv ? "Deaktiver" : "Aktiver"}
      </button>
      <Feil svar={svar} />
    </form>
  );
}

function AnsattRad({ ansatt, valg, revisjon }: { ansatt: AnsattVisning; valg: Valg; revisjon: number }) {
  const [svar, handling, lagrer] = useActionState(endreAnsatt, null);
  const status = useSkjemaStatus(
    {
      teamId: ansatt.teamId,
      rolleId: ansatt.rolleId ?? "",
      lokasjonId: ansatt.lokasjonId ?? "",
      erAdministrator: ansatt.erAdministrator ? "on" : "",
    },
    svar,
  );

  return (
    <li>
      <form action={handling} className={status.skjemaKlasse} onInput={status.onInput}>
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={ansatt.id} />
        <strong className="admin-navn">{ansatt.name}</strong>
        <span className="admin-bruk">Kom inn: {komInn(ansatt.opprettet)}</span>
        <select name="teamId" defaultValue={ansatt.teamId} aria-label={`Team for ${ansatt.name}`}>
          {valg.team.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select name="rolleId" defaultValue={ansatt.rolleId ?? ""} aria-label={`Rolle for ${ansatt.name}`}>
          <option value="">Ingen rolle</option>
          {valg.roller.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          name="lokasjonId"
          defaultValue={ansatt.lokasjonId ?? ""}
          aria-label={`Lokasjon for ${ansatt.name}`}
        >
          <option value="">Ingen lokasjon</option>
          {valg.lokasjoner.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({valg.teamNavn.get(l.teamId) ?? l.teamId})
            </option>
          ))}
        </select>
        <label className="admin-avkryssing">
          <input type="checkbox" name="erAdministrator" defaultChecked={ansatt.erAdministrator} />
          Administrator
        </label>
        <button className="uke-btn" type="submit" disabled={lagrer}>
          Lagre
        </button>
        <Lagringsstatus endret={status.endret} lagret={status.lagret} />
        <Feil svar={svar} />
      </form>
      <AktivKnapp ansatt={ansatt} revisjon={revisjon} />
    </li>
  );
}

function DeaktivertRad({ ansatt, revisjon }: { ansatt: AnsattVisning; revisjon: number }) {
  return (
    <li className="admin-deaktivert">
      <div className="admin-skjema">
        <strong className="admin-navn">{ansatt.name}</strong>
        <span className="admin-bruk">Kom inn: {komInn(ansatt.opprettet)}</span>
        <span className="admin-bruk">Deaktivert</span>
      </div>
      <AktivKnapp ansatt={ansatt} revisjon={revisjon} />
    </li>
  );
}

export function AnsattAdmin({
  ansatte,
  team,
  roller,
  lokasjoner,
  revisjon,
}: {
  ansatte: AnsattVisning[];
  team: Team[];
  roller: Rolle[];
  lokasjoner: Lokasjon[];
  revisjon: number;
}) {
  const valg: Valg = { team, roller, lokasjoner, teamNavn: new Map(team.map((t) => [t.id, t.name])) };
  // Hver rad husker sine egne verdier; en lagring i én rad nullstiller ikke de andre.
  // Deaktiverte ligger nederst, grået.
  return (
    <div>
      <ul className="admin-lokasjoner">
        {ansatte
          .filter((a) => a.aktiv)
          .map((a) => (
            <AnsattRad key={a.id} ansatt={a} valg={valg} revisjon={revisjon} />
          ))}
        {ansatte
          .filter((a) => !a.aktiv)
          .map((a) => (
            <DeaktivertRad key={a.id} ansatt={a} revisjon={revisjon} />
          ))}
      </ul>
    </div>
  );
}
