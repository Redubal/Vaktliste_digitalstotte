"use client";

import { useMemo, useState } from "react";
import type { Ansatt, Dag, Endring, Team } from "@/lib/vaktlista";
import { forstFor } from "@/lib/sortering";
import { ALLE_TEAM, beregnDag, type TeamFilter } from "@/lib/ukeplan";
import { addDays, formatDayNumber, formatDayShort, formatIsoDate, parseIsoDate, todayUtc } from "@/lib/uker";
import { useEndringVindu, type EndringValg } from "./EndringVindu";
import { Celle } from "./UkeplanClient";

type Props = {
  team: Team[];
  ansatte: Ansatt[];
  endringer: Endring[];
  dager: Dag[];
  erAdmin: boolean;
  /** Den som har valgt seg selv; `null` = ingen, og da kan ingen endring åpnes. */
  jegId: string | null;
  /** Når noen har valgt seg selv: til vinduet, og til «Godkjenn» for administratorer. */
  revisjon: number | null;
  valg: EndringValg | null;
};

/** Én dag: bare de som har en endring (borte, flyttet, på kurs), med pil for forrige og neste dag. */
export function DagClient({ team: alleTeam, ansatte, endringer, dager, erAdmin, jegId, revisjon, valg }: Props) {
  const { aapneFor, aapneNy, vindu } = useEndringVindu({ jegId, erAdmin, revisjon, valg, endringer, ansatte });
  const godkjennRevisjon = erAdmin ? revisjon : null;
  const idagIso = useMemo(() => formatIsoDate(todayUtc()), []);
  const [iso, setIso] = useState(idagIso);
  const [team, setTeam] = useState<TeamFilter>(
    ansatte.find((a) => a.id === jegId)?.teamId ?? alleTeam[0]?.id ?? ALLE_TEAM,
  );

  const dag = useMemo(() => beregnDag({ team, iso, ansatte, endringer, dager }), [team, iso, ansatte, endringer, dager]);
  // Den som har valgt seg selv, står øverst, som i Uke og Måned.
  const rader = useMemo(
    () =>
      forstFor(
        dag.rader.filter((r) => r.celle.endringer.length > 0),
        (r) => r.person.id === jegId,
      ),
    [dag.rader, jegId],
  );
  const dato = parseIsoDate(iso);

  const flytt = (n: number) => setIso(formatIsoDate(addDays(parseIsoDate(iso), n)));
  // Tomt felt (datoen slettet) gir ingen ny dag; da blir den gamle stående.
  const velgDato = (verdi: string) => {
    if (verdi) setIso(verdi);
  };

  return (
    <section aria-label="Dag">
      <div className="ukeplan-toolbar">
        {aapneNy && (
          <button type="button" onClick={() => aapneNy(iso)} className="uke-btn uke-btn--today">
            Registrer
          </button>
        )}
        <label className="select-field">
          <span>Team</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            {alleTeam.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            <option value={ALLE_TEAM}>Alle team</option>
          </select>
        </label>
        <label className="select-field">
          <span>Dato</span>
          <input type="date" value={iso} onChange={(e) => velgDato(e.target.value)} />
        </label>

        <div className="uke-nav" aria-label="Naviger dag">
          <button type="button" onClick={() => flytt(-1)} className="uke-btn" aria-label="Forrige dag">
            ← Forrige
          </button>
          <div className="uke-label">
            <strong>
              {formatDayShort(dato)} {formatDayNumber(dato)}
            </strong>
            {iso === idagIso && <span>I dag</span>}
          </div>
          <button type="button" onClick={() => flytt(1)} className="uke-btn" aria-label="Neste dag">
            Neste →
          </button>
          <button type="button" onClick={() => setIso(idagIso)} className="uke-btn uke-btn--today">
            I dag
          </button>
        </div>
      </div>

      <div className="panel panel--ukeplan">
        {dag.merknader.length > 0 && <p className="empty-row">{dag.merknader.join(", ")}</p>}
        {rader.length === 0 && <p className="empty-row">Ingen hendelser denne dagen.</p>}
        <ul className="kortliste">
          {rader.map(({ person, celle }) => (
            <li key={`${person.teamId}-${person.id}`} className="kort">
              <div className="person-cell">
                <span className="person-name">{person.name}</span>
                <span className="person-meta">
                  {person.team} · {person.role}
                </span>
              </div>
              <Celle
                celle={celle}
                person={person.name}
                jegId={jegId}
                revisjon={godkjennRevisjon}
                onAapne={aapneFor(person, celle)}
              />
            </li>
          ))}
        </ul>
      </div>
      {vindu}
    </section>
  );
}
