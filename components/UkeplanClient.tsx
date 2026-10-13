"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Ansatt, Dag, Endring, Team } from "@/lib/vaktlista";
import {
  ALLE_TEAM,
  beregnUkeplan,
  classifyCelle,
  egenCelleStil,
  forrigeUke,
  nesteUke,
  venterPaaGodkjenning,
  type CelleType,
  type TeamFilter,
  type UkeplanCelle,
} from "@/lib/ukeplan";
import { useEndringVindu, type EndringValg } from "./EndringVindu";
import { BehandleKnapper, hva, periode, VenterMerke, VenterPanel } from "./Godkjenning";
import { ariaSort, forstFor, sorterRader } from "@/lib/sortering";
import { formatDayNumber, formatDayShort, formatWeekRange, isoWeek, todayUtc } from "@/lib/uker";
import { PERSON_KOLONNER, PERSON_VERDIER, STANDARD_PERSON_SORTERING } from "./personSortering";
import { Rollevelger, useRollefilter } from "./Rollefilter";
import { SorterKnapp, useSortering } from "./Sortering";

type Props = {
  team: Team[];
  ansatte: Ansatt[];
  endringer: Endring[];
  dager: Dag[];
  erAdmin: boolean;
  /** Den som har valgt seg selv; `null` = ingen, og da kan ingen dag klikkes. */
  jegId: string | null;
  /** Når noen har valgt seg selv: til vinduet, og til «Godkjenn» for administratorer. */
  revisjon: number | null;
  valg: EndringValg | null;
  /** Bruker-id som skal utheves (fra «Vis i ukeplan» i Admin). */
  utheves: string | null;
};

const CELLE_KLASSE: Record<CelleType, string> = {
  lokasjon: "celle celle--lokasjon",
  "endring-lokasjon": "celle celle--endring-lokasjon",
  "endring-status": "celle celle--endring-status",
  fri: "celle celle--fri",
  utenfor: "celle celle--utenfor",
};

/**
 * Innholdet i én dag, likt i tabellen og kortlisten. `revisjon` gir «Godkjenn» (bare administratorer);
 * `onAapne` gjør teksten til en knapp som åpner vinduet for endringer.
 */
function Celle({
  celle,
  person,
  revisjon,
  onAapne,
}: {
  celle: UkeplanCelle;
  person: string;
  revisjon: number | null;
  onAapne?: () => void;
}) {
  const venter = venterPaaGodkjenning(celle);
  const klasse = CELLE_KLASSE[classifyCelle(celle)] + (venter ? " celle--venter" : "");
  const innhold = (
    <>
      <span className="celle-tekst">{celle.primær}</span>
      {celle.endring && celle.endring.newLocation && <span className="celle-badge">{celle.endring.type}</span>}
    </>
  );
  return (
    <div className={klasse} style={egenCelleStil(celle)}>
      {onAapne ? (
        <button
          type="button"
          className="celle-aapne"
          onClick={onAapne}
          aria-label={`${celle.primær}, ${person}, ${celle.iso}. Legg inn eller endre`}
        >
          {innhold}
        </button>
      ) : (
        innhold
      )}
      {venter && <VenterMerke />}
      {venter && revisjon !== null && celle.endring && (
        <BehandleKnapper
          endringId={celle.endring.id}
          revisjon={revisjon}
          navn={`${hva(celle.endring)} for ${person}, ${periode(celle.endring)}`}
        />
      )}
    </div>
  );
}

export function UkeplanClient({
  team: alleTeam,
  ansatte,
  endringer,
  dager,
  erAdmin,
  jegId,
  revisjon,
  valg,
  utheves,
}: Props) {
  const { aapneFor, vindu } = useEndringVindu({ jegId, erAdmin, revisjon, valg });
  const godkjennRevisjon = erAdmin ? revisjon : null;
  const today = useMemo(() => isoWeek(todayUtc()), []);
  // Kommer du fra Admin, starter visningen på teamet til personen, ellers er raden ikke i listen.
  // Ellers starter den på teamet til den som har valgt seg selv, av samme grunn.
  const [team, setTeam] = useState<TeamFilter>(
    ansatte.find((a) => a.id === (utheves ?? jegId))?.teamId ?? alleTeam[0]?.id ?? ALLE_TEAM,
  );
  const utheveRef = useRef<HTMLTableRowElement | null>(null);
  const utheveKortRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    // Tabellen eller kortlisten er skjult (display: none) etter bredden; bare den synlige kan rulles til.
    const synlig = utheveRef.current?.offsetParent ? utheveRef.current : utheveKortRef.current;
    synlig?.scrollIntoView({ block: "center" });
  }, []);
  const [{ aar, uke }, setUke] = useState<{ aar: number; uke: number }>({
    aar: today.year,
    uke: today.week,
  });

  const ukeplan = useMemo(
    () => beregnUkeplan({ team, aar, uke, ansatte, endringer, dager }),
    [team, aar, uke, ansatte, endringer, dager],
  );

  const { sortering, sorterPaa } = useSortering(PERSON_KOLONNER, STANDARD_PERSON_SORTERING);
  const roller = useMemo(() => [...new Set(ansatte.map((a) => a.role))].sort((a, b) => a.localeCompare(b, "nb")), [ansatte]);
  const { rolle, velgRolle } = useRollefilter(roller);
  // Den som har valgt seg selv, står øverst uansett sortering.
  const rader = useMemo(
    () =>
      forstFor(
        sorterRader(
          rolle === null ? ukeplan.rader : ukeplan.rader.filter((r) => r.person.role === rolle),
          sortering,
          PERSON_VERDIER,
        ),
        (r) => r.person.id === jegId,
      ),
    [ukeplan.rader, rolle, sortering, jegId],
  );

  const goToday =() => setUke({ aar: today.year, uke: today.week });
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
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            {alleTeam.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            <option value={ALLE_TEAM}>Alle team</option>
          </select>
        </label>

        <Rollevelger roller={roller} rolle={rolle} onVelg={velgRolle} />

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

      <VenterPanel endringer={endringer} revisjon={godkjennRevisjon} />

      <div className="panel panel--ukeplan">
        <div className="table-wrapper visning-tabell">
          <table className="ukeplan-table">
            <thead>
              <tr>
                <th className="col-person" aria-sort={ariaSort(sortering, sortering?.kolonne ?? "")}>
                  <div className="sorter-gruppe">
                    <SorterKnapp kolonne="navn" sortering={sortering} onSorter={sorterPaa}>
                      Navn
                    </SorterKnapp>
                    <SorterKnapp kolonne="rolle" sortering={sortering} onSorter={sorterPaa}>
                      Rolle
                    </SorterKnapp>
                  </div>
                </th>
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
              {rader.length === 0 && (
                <tr>
                  <td colSpan={ukeplan.dager.length + 1} className="empty-row">
                    Ingen aktive personer denne uken.
                  </td>
                </tr>
              )}
              {rader.map((rad) => (
                <tr
                  key={`${rad.person.teamId}-${rad.person.id}`}
                  ref={rad.person.id === utheves ? utheveRef : undefined}
                  className={rad.person.id === utheves ? "rad--uthevet" : undefined}
                >
                  <th scope="row" className="col-person">
                    <div className="person-cell">
                      {erAdmin ? (
                        <Link className="person-name person-lenke" href={`/admin/ansatte#${rad.person.id}`}>
                          {rad.person.name}
                        </Link>
                      ) : (
                        <span className="person-name">{rad.person.name}</span>
                      )}
                      <span className="person-meta">
                        {rad.person.team} · {rad.person.role}
                      </span>
                    </div>
                  </th>
                  {rad.celler.map((celle) => {
                    const tooltip = celle.endring
                      ? [
                          celle.endring.type,
                          celle.endring.newLocation ? `→ ${celle.endring.newLocation}` : null,
                          celle.endring.comment || null,
                          venterPaaGodkjenning(celle) ? "– venter på godkjenning" : null,
                          `(${celle.endring.id})`,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : undefined;
                    return (
                      <td key={celle.iso} title={tooltip}>
                        <Celle
                          celle={celle}
                          person={rad.person.name}
                          revisjon={godkjennRevisjon}
                          onAapne={aapneFor(rad.person, celle)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="visning-kort">
          <div className="sorter-gruppe kort-sortering">
            <SorterKnapp kolonne="navn" sortering={sortering} onSorter={sorterPaa}>
              Navn
            </SorterKnapp>
            <SorterKnapp kolonne="rolle" sortering={sortering} onSorter={sorterPaa}>
              Rolle
            </SorterKnapp>
          </div>
          {rader.length === 0 && <p className="empty-row">Ingen aktive personer denne uken.</p>}
          <ul className="kortliste">
            {rader.map((rad) => (
              <li
                key={`${rad.person.teamId}-${rad.person.id}`}
                ref={rad.person.id === utheves ? utheveKortRef : undefined}
                className={rad.person.id === utheves ? "kort rad--uthevet" : "kort"}
              >
                <div className="person-cell">
                  {erAdmin ? (
                    <Link className="person-name person-lenke" href={`/admin/ansatte#${rad.person.id}`}>
                      {rad.person.name}
                    </Link>
                  ) : (
                    <span className="person-name">{rad.person.name}</span>
                  )}
                  <span className="person-meta">
                    {rad.person.team} · {rad.person.role}
                  </span>
                </div>
                <ul className="kort-dager">
                  {rad.celler.map((celle, i) => {
                    const d = ukeplan.dager[i];
                    const noter = ukeplan.merknader[i];
                    return (
                      <li key={celle.iso} className="kort-dag">
                        <span className="kort-dag-navn">
                          {formatDayShort(d)} {formatDayNumber(d)}
                          {noter.length > 0 && <span className="kort-dag-note">{noter.join(", ")}</span>}
                        </span>
                        <Celle
                          celle={celle}
                          person={rad.person.name}
                          revisjon={godkjennRevisjon}
                          onAapne={aapneFor(rad.person, celle)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {vindu}
    </section>
  );
}
