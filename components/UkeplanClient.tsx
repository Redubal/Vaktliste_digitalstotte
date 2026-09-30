"use client";

import { useMemo, useState } from "react";
import type { Ansatt, Dag, Endring } from "@/lib/vaktlista";
import {
  beregnUkeplan,
  classifyCelle,
  forrigeUke,
  nesteUke,
  TEAMS,
  type CelleType,
  type TeamFilter,
} from "@/lib/ukeplan";
import { formatDayNumber, formatDayShort, formatWeekRange, isoWeek, todayUtc } from "@/lib/uker";

type Props = {
  ansatte: Ansatt[];
  endringer: Endring[];
  dager: Dag[];
};

const CELLE_KLASSE: Record<CelleType, string> = {
  lokasjon: "celle celle--lokasjon",
  "endring-lokasjon": "celle celle--endring-lokasjon",
  "endring-status": "celle celle--endring-status",
  fri: "celle celle--fri",
  utenfor: "celle celle--utenfor",
};

export function UkeplanClient({ ansatte, endringer, dager }: Props) {
  const today = useMemo(() => isoWeek(todayUtc()), []);
  const [team, setTeam] = useState<TeamFilter>("Øst");
  const [{ aar, uke }, setUke] = useState<{ aar: number; uke: number }>({
    aar: today.year,
    uke: today.week,
  });

  const ukeplan = useMemo(
    () => beregnUkeplan({ team, aar, uke, ansatte, endringer, dager }),
    [team, aar, uke, ansatte, endringer, dager],
  );

  const goToday = () => setUke({ aar: today.year, uke: today.week });
  const goPrev = () => setUke(({ aar, uke }) => {
    const p = forrigeUke(aar, uke);
    return { aar: p.aar, uke: p.uke };
  });
  const goNext = () => setUke(({ aar, uke }) => {
    const p = nesteUke(aar, uke);
    return { aar: p.aar, uke: p.uke };
  });

  return (
    <section aria-label="Ukeplan">
      <div className="ukeplan-toolbar">
        <label className="select-field">
          <span>Team</span>
          <select value={team} onChange={(e) => setTeam(e.target.value as TeamFilter)}>
            {TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <div className="uke-nav" aria-label="Naviger uke">
          <button type="button" onClick={goPrev} className="uke-btn" aria-label="Forrige uke">
            ← Forrige
          </button>
          <div className="uke-label">
            <strong>Uke {ukeplan.uke}</strong>
            <span>{formatWeekRange(ukeplan.mandag)}</span>
          </div>
          <button type="button" onClick={goNext} className="uke-btn" aria-label="Neste uke">
            Neste →
          </button>
          <button type="button" onClick={goToday} className="uke-btn uke-btn--today">
            I dag
          </button>
        </div>
      </div>

      <div className="panel panel--ukeplan">
        <div className="table-wrapper">
          <table className="ukeplan-table">
            <thead>
              <tr>
                <th className="col-person">Ansatt</th>
                <th className="col-home">Fast lokasjon</th>
                {ukeplan.dager.map((d, i) => {
                  const noter = ukeplan.merknader[i];
                  return (
                    <th key={d.toISOString()} className="col-day">
                      <div className="day-head">
                        <span className="day-short">{formatDayShort(d)}</span>
                        <span className="day-number">{formatDayNumber(d)}</span>
                      </div>
                      {noter.length > 0 && (
                        <div className="day-notes">
                          {noter.map((n) => (
                            <span key={n} className="day-note" title={n}>{n}</span>
                          ))}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ukeplan.rader.length === 0 && (
                <tr>
                  <td colSpan={ukeplan.dager.length + 2} className="empty-row">
                    Ingen aktive personer denne uken.
                  </td>
                </tr>
              )}
              {ukeplan.rader.map((rad) => (
                <tr key={rad.person.id}>
                  <th scope="row" className="col-person">
                    <div className="person-cell">
                      <span className="person-name">{rad.person.name}</span>
                      <span className="person-meta">
                        {rad.person.team} · {rad.person.role}
                      </span>
                    </div>
                  </th>
                  <td className="col-home">{rad.person.location}</td>
                  {rad.celler.map((celle) => {
                    const type = classifyCelle(celle);
                    const tooltip = celle.endring
                      ? [
                          celle.endring.type,
                          celle.endring.newLocation ? `→ ${celle.endring.newLocation}` : null,
                          celle.endring.comment || null,
                          `(${celle.endring.radId})`,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : undefined;
                    return (
                      <td key={celle.iso} title={tooltip}>
                        <div className={CELLE_KLASSE[type]}>
                          <span className="celle-tekst">{celle.primær}</span>
                          {celle.endring && celle.endring.newLocation && (
                            <span className="celle-badge">{celle.endring.type}</span>
                          )}
                        </div>
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
