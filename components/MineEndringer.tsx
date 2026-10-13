"use client";

import type { Virkning } from "@/lib/domene";
import type { MinEndring } from "@/lib/vaktlista";
import { AvvistMerke, GodkjentMerke, hva, periode, VenterMerke } from "./Godkjenning";

function Merke({ virkning }: { virkning: Virkning }) {
  if (virkning === "godkjent") return <GodkjentMerke />;
  if (virkning === "avvist") return <AvvistMerke />;
  return <VenterMerke />;
}

/**
 * Egne endringer med status og begrunnelse for avvisning. Lista er valgt ut på serveren
 * (`getMineEndringer`), så andres rader og begrunnelser kommer aldri hit.
 */
export function MineEndringer({ endringer }: { endringer: MinEndring[] }) {
  return (
    <section className="panel" aria-label="Mine endringer">
      <div className="section-head">
        <h2>Mine endringer</h2>
        <span className="counter">
          {endringer.length} {endringer.length === 1 ? "endring" : "endringer"}
        </span>
      </div>

      {endringer.length === 0 ? (
        <p className="empty-row">Du har ingen endringer. Klikk på en dag i Ukeplan eller Måned for å legge inn en.</p>
      ) : (
        <>
          <div className="table-wrapper visning-tabell">
            <table className="logg-tabell mine-tabell">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Gjelder</th>
                  <th>Periode</th>
                  <th>Kommentar</th>
                  <th>Begrunnelse</th>
                </tr>
              </thead>
              <tbody>
                {endringer.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Merke virkning={e.virkning} />
                    </td>
                    <td>{hva(e)}</td>
                    <td>{periode(e)}</td>
                    <td>{e.comment}</td>
                    <td>{e.avvistGrunn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="visning-kort">
            <ul className="kortliste">
              {endringer.map((e) => (
                <li key={e.id} className="kort mine-kort">
                  <div className="mine-kort-topp">
                    <span className="person-name">{hva(e)}</span>
                    <Merke virkning={e.virkning} />
                  </div>
                  <span className="person-meta">{periode(e)}</span>
                  {e.comment && <p className="mine-kort-tekst">{e.comment}</p>}
                  {e.avvistGrunn && <p className="mine-kort-tekst">Begrunnelse: {e.avvistGrunn}</p>}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
