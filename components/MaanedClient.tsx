"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Ansatt, Dag, Endring, Team } from "@/lib/vaktlista";
import {
  ALLE_TEAM,
  beregnMaaned,
  classifyCelle,
  egenFarge,
  egenGodkjent,
  forrigeMaaned,
  nesteMaaned,
  venterPaaGodkjenning,
  type CelleType,
  type TeamFilter,
  type UkeplanCelle,
} from "@/lib/ukeplan";
import { useEndringVindu, type EndringValg } from "./EndringVindu";
import { VenterPanel } from "./Godkjenning";
import { ariaSort, forstFor, sorterRader } from "@/lib/sortering";
import { formatDayNumber, formatDayShort, formatMonthName, todayUtc } from "@/lib/uker";
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
};

/** Prikkens klasse, med merke for en endring som venter, eller for ens egen godkjente. */
function prikkKlasse(celle: UkeplanCelle, jegId: string | null): string {
  const merke = venterPaaGodkjenning(celle) ? " prikk--venter" : egenGodkjent(celle, jegId) ? " prikk--godkjent" : "";
  return PRIKK_KLASSE[classifyCelle(celle)] + merke;
}

function tittelFor(celle: UkeplanCelle, dag: Date, jegId: string | null): string {
  const e = celle.endring;
  return [
    `${formatDayShort(dag)} ${dag.getUTCDate()}.`,
    celle.primær,
    e && e.newLocation ? e.type : null,
    e?.comment || null,
    venterPaaGodkjenning(celle) ? "venter på godkjenning" : null,
    egenGodkjent(celle, jegId) ? "godkjent" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** «5. okt» for én dag, «5. okt – 9. okt» for en periode. */
function datoTekst(fra: string, til: string): string {
  const tekst = (iso: string) => formatDayNumber(new Date(`${iso}T00:00:00Z`));
  return fra === til ? tekst(fra) : `${tekst(fra)} – ${tekst(til)}`;
}

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

export function MaanedClient({ team: alleTeam, ansatte, endringer, dager, erAdmin, jegId, revisjon, valg }: Props) {
  const { aapneFor, vindu } = useEndringVindu({ jegId, erAdmin, revisjon, valg });
  const today = useMemo(() => {
    const t = todayUtc();
    return { aar: t.getUTCFullYear(), maaned: t.getUTCMonth() + 1 };
  }, []);
  // Har noen valgt seg selv, starter visningen på teamet deres, så de står i listen.
  const [team, setTeam] = useState<TeamFilter>(
    ansatte.find((a) => a.id === jegId)?.teamId ?? alleTeam[0]?.id ?? ALLE_TEAM,
  );
  const [{ aar, maaned }, setMaaned] = useState(today);

  const plan = useMemo(
    () => beregnMaaned({ team, aar, maaned, ansatte, endringer, dager }),
    [team, aar, maaned, ansatte, endringer, dager],
  );

  // Merknader som treffer måneden, som tekst (prikken i tabellen sier bare at det finnes en).
  const merknader = useMemo(() => {
    const forste = `${aar}-${String(maaned).padStart(2, "0")}-01`;
    const siste = `${aar}-${String(maaned).padStart(2, "0")}-${String(new Date(Date.UTC(aar, maaned, 0)).getUTCDate()).padStart(2, "0")}`;
    return dager
      .filter((d) => d.fromDate <= siste && d.toDate >= forste)
      .sort((a, b) => a.fromDate.localeCompare(b.fromDate) || a.comment.localeCompare(b.comment, "nb"));
  }, [dager, aar, maaned]);

  const { sortering, sorterPaa } = useSortering(PERSON_KOLONNER, STANDARD_PERSON_SORTERING);
  const roller = useMemo(() => [...new Set(ansatte.map((a) => a.role))].sort((a, b) => a.localeCompare(b, "nb")), [ansatte]);
  const { rolle, velgRolle } = useRollefilter(roller);
  // Den som har valgt seg selv, står øverst uansett sortering.
  const rader = useMemo(
    () =>
      forstFor(
        sorterRader(
          rolle === null ? plan.rader : plan.rader.filter((r) => r.person.role === rolle),
          sortering,
          PERSON_VERDIER,
        ),
        (r) => r.person.id === jegId,
      ),
    [plan.rader, rolle, sortering, jegId],
  );

  return (
    <section aria-label="Månedsoversikt">
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
        <li>
          <span className="prikk prikk--endring-status prikk--venter" aria-hidden="true" />
          Venter på godkjenning
        </li>
        {jegId && (
          <li>
            <span className="prikk prikk--endring-status prikk--godkjent" aria-hidden="true" />
            Din godkjente endring
          </li>
        )}
      </ul>

      {merknader.length > 0 && (
        <ul className="maaned-merknader" aria-label="Merknader denne måneden">
          {merknader.map((d) => (
            <li key={d.id}>
              <strong>{datoTekst(d.fromDate, d.toDate)}</strong> {d.comment}
            </li>
          ))}
        </ul>
      )}

      <VenterPanel endringer={endringer} revisjon={erAdmin ? revisjon : null} />

      <div className="panel panel--ukeplan">
        <div className="table-wrapper visning-tabell">
          <table className="maaned-table">
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
              {rader.length === 0 && (
                <tr>
                  <td colSpan={plan.dager.length + 1} className="empty-row">
                    Ingen aktive personer denne måneden.
                  </td>
                </tr>
              )}
              {rader.map((rad) => (
                <tr key={`${rad.person.teamId}-${rad.person.id}`}>
                  <th scope="row" className="col-person">
                    {erAdmin ? (
                      <Link className="person-name person-lenke" href={`/admin/ansatte#${rad.person.id}`}>
                        {rad.person.name}
                      </Link>
                    ) : (
                      <span className="person-name">{rad.person.name}</span>
                    )}
                  </th>
                  {rad.celler.map((celle, i) => {
                    const dag = plan.dager[i];
                    const tittel = tittelFor(celle, dag, jegId);
                    const aapne = aapneFor(rad.person, celle);
                    const prikk = (
                      <span
                        className={prikkKlasse(celle, jegId)}
                        style={egenFarge(celle) ? { background: egenFarge(celle)! } : undefined}
                        aria-label={aapne ? undefined : tittel}
                      />
                    );
                    return (
                      <td
                        key={celle.iso}
                        title={tittel}
                        className={dag.getUTCDay() === 1 ? "col-mdag--uke" : undefined}
                      >
                        {aapne ? (
                          <button
                            type="button"
                            className="prikk-knapp"
                            onClick={aapne}
                            aria-label={`${rad.person.name}, ${tittel}. Legg inn eller endre`}
                          >
                            {prikk}
                          </button>
                        ) : (
                          prikk
                        )}
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
          {rader.length === 0 && <p className="empty-row">Ingen aktive personer denne måneden.</p>}
          <ul className="kortliste">
            {rader.map((rad) => (
              <li key={`${rad.person.teamId}-${rad.person.id}`} className="kort">
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
                <div className="mkal">
                  {["M", "T", "O", "T", "F", "L", "S"].map((b, i) => (
                    <span key={i} className="mkal-uke-dag">{b}</span>
                  ))}
                  {/* Første dag får riktig ukedagskolonne (mandag = 0). */}
                  {Array.from({ length: (plan.dager[0].getUTCDay() + 6) % 7 }, (_, i) => (
                    <span key={`tom-${i}`} />
                  ))}
                  {rad.celler.map((celle, i) => {
                    const dag = plan.dager[i];
                    const tittel = tittelFor(celle, dag, jegId);
                    const aapne = aapneFor(rad.person, celle);
                    const felles = {
                      className: `mkal-dag ${prikkKlasse(celle, jegId)}`,
                      style: egenFarge(celle) ? { background: egenFarge(celle)! } : undefined,
                      title: tittel,
                    };
                    return aapne ? (
                      <button
                        key={celle.iso}
                        type="button"
                        {...felles}
                        onClick={aapne}
                        aria-label={`${tittel}. Legg inn eller endre`}
                      >
                        {dag.getUTCDate()}
                      </button>
                    ) : (
                      <span key={celle.iso} {...felles} aria-label={tittel}>
                        {dag.getUTCDate()}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {vindu}
    </section>
  );
}
