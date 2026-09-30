"use client";

import { useMemo, useState } from "react";
import type { Ansatt, Dag, Endring } from "@/lib/vaktlista";
import {
  beregnMaaned,
  classifyCelle,
  forrigeMaaned,
  nesteMaaned,
  TEAMS,
  type CelleType,
  type TeamFilter,
} from "@/lib/ukeplan";
import { formatDayShort, formatMonthName, todayUtc } from "@/lib/uker";

type Props = {
  ansatte: Ansatt[];
  endringer: Endring[];
  dager: Dag[];
};

const PRIKK_KLASSE: Record<CelleType, string> = {
  lokasjon: "prikk prikk--lokasjon",
  "endring-lokasjon": "prikk prikk--endring-lokasjon",
  "endring-status": "prikk prikk--endring-status",
  fri: "prikk prikk--fri",
  utenfor: "prikk prikk--utenfor",
};

const FORKLARING: { type: CelleType; tekst: string }[] = [
  { type: "lokasjon", tekst: "Fast lokasjon" },
  { type: "endring-lokasjon", tekst: "Annen lokasjon" },
  { type: "fri", tekst: "Fri, ferie eller syk" },
  { type: "endring-status", tekst: "Annet" },
  { type: "utenfor", tekst: "Ikke aktiv" },
];

export function MaanedClient({ ansatte, endringer, dager }: Props) {
  const today = useMemo(() => {
    const t = todayUtc();
    return { aar: t.getUTCFullYear(), maaned: t.getUTCMonth() + 1 };
  }, []);
  const [team, setTeam] = useState<TeamFilter>("Øst");
  const [{ aar, maaned }, setMaaned] = useState(today);

  const plan = useMemo(
    () => beregnMaaned({ team, aar, maaned, ansatte, endringer, dager }),
    [team, aar, maaned, ansatte, endringer, dager],
  );

  return (
    <section aria-label="Månedsoversikt">
      <div className="ukeplan-toolbar">
        <label className="select-field">
          <span>Team</span>
          <select value={team} onChange={(e) => setTeam(e.target.value as TeamFilter)}>
            {TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <div className="uke-nav" aria-label="Naviger måned">
          <button
            type="button"
            className="uke-btn"
            aria-label="Forrige måned"
            onClick={() => setMaaned(({ aar, maaned }) => forrigeMaaned(aar, maaned))}
          >
            ← Forrige
          </button>
          <div className="uke-label">
            <strong>{formatMonthName(aar, maaned)}</strong>
          </div>
          <button
            type="button"
            className="uke-btn"
            aria-label="Neste måned"
            onClick={() => setMaaned(({ aar, maaned }) => nesteMaaned(aar, maaned))}
          >
            Neste →
          </button>
          <button type="button" className="uke-btn uke-btn--today" onClick={() => setMaaned(today)}>
            I dag
          </button>
        </div>
      </div>

      <ul className="forklaring" aria-label="Forklaring">
        {FORKLARING.map((f) => (
          <li key={f.type}>
            <span className={PRIKK_KLASSE[f.type]} aria-hidden="true" />
            {f.tekst}
          </li>
        ))}
      </ul>

      <div className="panel panel--ukeplan">
        <div className="table-wrapper">
          <table className="maaned-table">
            <thead>
              <tr>
                <th className="col-person">Ansatt</th>
                {plan.dager.map((d, i) => {
                  const noter = plan.merknader[i];
                  return (
                    <th
                      key={d.toISOString()}
                      className={d.getUTCDay() === 1 ? "col-mdag--uke" : undefined}
                      title={noter.length > 0 ? noter.join(", ") : undefined}
                    >
                      <div className="mdag-head">
                        <span className="mdag-navn">{formatDayShort(d).charAt(0)}</span>
                        <span className="mdag-nr">{d.getUTCDate()}</span>
                        {noter.length > 0 && <span className="mdag-merke" aria-label={noter.join(", ")} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {plan.rader.length === 0 && (
                <tr>
                  <td colSpan={plan.dager.length + 1} className="empty-row">
                    Ingen aktive personer denne måneden.
                  </td>
                </tr>
              )}
              {plan.rader.map((rad) => (
                <tr key={rad.person.id}>
                  <th scope="row" className="col-person">
                    <span className="person-name">{rad.person.name}</span>
                  </th>
                  {rad.celler.map((celle, i) => {
                    const type = classifyCelle(celle);
                    const e = celle.endring;
                    const dag = plan.dager[i];
                    const tittel = [
                      `${formatDayShort(dag)} ${dag.getUTCDate()}.`,
                      celle.primær,
                      e && e.newLocation ? e.type : null,
                      e?.comment || null,
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <td
                        key={celle.iso}
                        title={tittel}
                        className={dag.getUTCDay() === 1 ? "col-mdag--uke" : undefined}
                      >
                        <span className={PRIKK_KLASSE[type]} aria-label={tittel} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
