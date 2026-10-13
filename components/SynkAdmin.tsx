"use client";

import { useActionState } from "react";
import { settSynk, synkNaa } from "@/app/admin/handlinger";
import { SYNK_INTERVALLER, type Svar, type SynkInnstillinger } from "@/lib/domene";
import { Feil } from "./AdminFelles";

/** Tidene kommer ferdig formatert fra serveren, så de ikke avhenger av nettleserens tidssone. */
export type SynkVisning = {
  kilde: string;
  sistSynket: string | null;
  /** Siste forsøk, når det feilet; ellers `null`. */
  feiletSist: string | null;
  melding: string | null;
  neste: string | null;
};

export function SynkAdmin({
  innstillinger,
  visning,
  revisjon,
}: {
  innstillinger: SynkInnstillinger;
  visning: SynkVisning;
  revisjon: number;
}) {
  const [lagreSvar, lagre, lagrer] = useActionState(settSynk, null);
  const [synkSvar, synk, synker] = useActionState<Svar | null>(synkNaa, null);

  return (
    <div>
      <p className="admin-ingress">
        Kilde: <strong>{visning.kilde}</strong>. Nye personer havner under «Nye, mangler team» i Ansatte. Personer
        som er borte fra kilden, deaktiveres; ingen slettes. Personer som aldri er koblet til Entra, røres ikke.
      </p>
      <p className="admin-ingress">
        Sist synket: <strong>{visning.sistSynket ?? "aldri"}</strong>
        {visning.neste ? <> · Neste planlagte: {visning.neste} (kjøres når noen åpner en side etter det)</> : null}
      </p>
      {visning.feiletSist ? (
        <p className="admin-feil" role="alert">
          Siste forsøk {visning.feiletSist} feilet: {visning.melding}
        </p>
      ) : visning.melding ? (
        <p className="admin-bruk">Utfall: {visning.melding}</p>
      ) : null}

      <form action={synk} className="admin-skjema">
        <button className="uke-btn" type="submit" disabled={synker}>
          {synker ? "Synker …" : "Synk nå"}
        </button>
        {synkSvar?.ok ? (
          <span className="admin-status" role="status">
            {synkSvar.melding}
          </span>
        ) : null}
        <Feil svar={synkSvar} />
      </form>

      <form action={lagre} className="admin-skjema">
        <input type="hidden" name="revisjon" value={revisjon} />
        <label>
          <span className="admin-bruk">Hvor ofte </span>
          <select name="intervallTimer" defaultValue={String(innstillinger.intervallTimer)}>
            {SYNK_INTERVALLER.map((i) => (
              <option key={i.timer} value={i.timer}>
                {i.navn}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="admin-bruk">fra kl. </span>
          <input type="time" name="klokkeslett" defaultValue={innstillinger.klokkeslett} required />
        </label>
        <button className="uke-btn" type="submit" disabled={lagrer}>
          Lagre
        </button>
        {lagreSvar?.ok ? (
          <span className="admin-status" role="status">
            {lagreSvar.melding}
          </span>
        ) : null}
        <Feil svar={lagreSvar} />
      </form>
    </div>
  );
}
