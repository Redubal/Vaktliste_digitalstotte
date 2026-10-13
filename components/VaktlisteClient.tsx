"use client";

import { useMemo, useState } from "react";
import { ariaSort, delNavn, sorterRader, type Sortering } from "@/lib/sortering";
import type { Employee, Team } from "@/lib/vaktlista";
import { SorterKnapp, useSortering } from "./Sortering";

const KOLONNER = [
  { id: "navn", tittel: "Fornavn" },
  { id: "etternavn", tittel: "Etternavn" },
  { id: "team", tittel: "Team" },
  { id: "rolle", tittel: "Rolle" },
  { id: "lokasjon", tittel: "Fast lokasjon" },
  { id: "fra", tittel: "Aktiv fra" },
  { id: "til", tittel: "Aktiv til" },
];
const KOLONNE_IDER = KOLONNER.map((k) => k.id);
const STANDARD_SORTERING: Sortering = { kolonne: "navn", retning: "stigende" };
const VERDIER: Record<string, (p: Employee) => string> = {
  navn: (p) => p.name,
  etternavn: (p) => delNavn(p.name).etternavn,
  team: (p) => p.team,
  rolle: (p) => p.role,
  lokasjon: (p) => p.location,
  fra: (p) => p.activeFrom,
  til: (p) => p.activeTo,
};

export function VaktlisteClient({ employees, team }: { employees: Employee[]; team: Team[] }) {
  const [teamFilter, setTeamFilter] = useState("Alle");
  const [search, setSearch] = useState("");

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((person) => {
      const matchTeam = teamFilter === "Alle" || person.teamId === teamFilter;
      const matchSearch =
        normalizedSearch.length === 0 ||
        person.name.toLowerCase().includes(normalizedSearch) ||
        person.role.toLowerCase().includes(normalizedSearch) ||
        person.location.toLowerCase().includes(normalizedSearch);

      return matchTeam && matchSearch;
    });
  }, [employees, search, teamFilter]);

  const { sortering, sorterPaa } = useSortering(KOLONNE_IDER, STANDARD_SORTERING);
  const sorterte = useMemo(
    () => sorterRader(filteredEmployees, sortering, VERDIER),
    [filteredEmployees, sortering],
  );

  const teamSummary =filteredEmployees.reduce(
    (acc, person) => {
      acc[person.teamId] = (acc[person.teamId] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalEmployees = filteredEmployees.length;
  const locations = new Set(filteredEmployees.map((person) => person.location)).size;

  return (
    <section aria-label="Ansatte">
      <section className="toolbar" aria-label="Filtre for vaktliste">
        <label className="search-field">
          <span>Søk</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Navn, rolle eller lokasjon"
            aria-label="Søk i vaktliste"
          />
        </label>

        <label className="select-field">
          <span>Team</span>
          <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
            <option value="Alle">Alle</option>
            {team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="stats-grid" aria-label="Statistikk for vaktliste">
        <article className="stat-card primary">
          <span className="label">Viste ansatte</span>
          <strong>{totalEmployees}</strong>
        </article>
        {team.map((t) => (
          <article key={t.id} className="stat-card">
            <span className="label">{t.name}</span>
            <strong>{teamSummary[t.id] ?? 0}</strong>
          </article>
        ))}
        <article className="stat-card">
          <span className="label">Lokasjoner</span>
          <strong>{locations}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Teamoversikt</h2>
        </div>

        <div className="team-grid">
          {team
            .filter((t) => teamSummary[t.id])
            .map((t) => (
              <article key={t.id} className="team-card">
                <span className="team-name">{t.name}</span>
                <strong>{teamSummary[t.id]}</strong>
                <small>ansatte</small>
              </article>
            ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Ansatte</h2>
          <span className="counter">{filteredEmployees.length} treff</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {KOLONNER.map(({ id, tittel }) => (
                  <th key={id} aria-sort={ariaSort(sortering, id)}>
                    <SorterKnapp kolonne={id} sortering={sortering} onSorter={sorterPaa}>
                      {tittel}
                    </SorterKnapp>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorterte.map((person) => (
                <tr key={`${person.teamId}-${person.id}`}>
                  <td>
                    <span className="person-name">{delNavn(person.name).fornavn}</span>
                  </td>
                  <td>
                    <span className="person-name">{delNavn(person.name).etternavn}</span>
                  </td>
                  <td>
                    <span className="status-tag">{person.team}</span>
                  </td>
                  <td>{person.role}</td>
                  <td>{person.location}</td>
                  <td>{person.activeFrom}</td>
                  <td>{person.activeTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
