"use client";

import { useMemo, useState } from "react";
import type { Employee } from "@/lib/vaktlista";

export function VaktlisteClient({ employees }: { employees: Employee[] }) {
  const teamOptions = ["Alle", ...new Set(employees.map((person) => person.team))];
  const [teamFilter, setTeamFilter] = useState("Alle");
  const [search, setSearch] = useState("");

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((person) => {
      const matchTeam = teamFilter === "Alle" || person.team === teamFilter;
      const matchSearch =
        normalizedSearch.length === 0 ||
        person.name.toLowerCase().includes(normalizedSearch) ||
        person.role.toLowerCase().includes(normalizedSearch) ||
        person.location.toLowerCase().includes(normalizedSearch);

      return matchTeam && matchSearch;
    });
  }, [employees, search, teamFilter]);

  const teamSummary = filteredEmployees.reduce(
    (acc, person) => {
      acc[person.team] = (acc[person.team] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalEmployees = filteredEmployees.length;
  const eastEmployees = teamSummary["Øst"] ?? 0;
  const westEmployees = teamSummary["Vest"] ?? 0;
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
            {teamOptions.map((team) => (
              <option key={team} value={team}>
                {team}
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
        <article className="stat-card">
          <span className="label">Øst</span>
          <strong>{eastEmployees}</strong>
        </article>
        <article className="stat-card">
          <span className="label">Vest</span>
          <strong>{westEmployees}</strong>
        </article>
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
          {Object.entries(teamSummary).map(([team, count]) => (
            <article key={team} className="team-card">
              <span className="team-name">{team}</span>
              <strong>{count}</strong>
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
                <th>Navn</th>
                <th>Team</th>
                <th>Rolle</th>
                <th>Fast lokasjon</th>
                <th>Aktiv fra</th>
                <th>Aktiv til</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((person) => (
                <tr key={`${person.team}-${person.name}`}>
                  <td>
                    <span className="person-name">{person.name}</span>
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
