"use client";

import { useActionState } from "react";
import { byttMittPassord } from "@/app/innlogging/handlinger";
import { Feil } from "./AdminFelles";

export function ByttPassordSkjema({ minLengde }: { minLengde: number }) {
  const [svar, handling, venter] = useActionState(byttMittPassord, null);

  return (
    <form action={handling} className="innlogging-skjema">
      <label className="innlogging-felt">
        <span>Nåværende passord</span>
        <input name="gammelt" type="password" autoComplete="current-password" required />
      </label>
      <label className="innlogging-felt">
        <span>Nytt passord (minst {minLengde} tegn)</span>
        <input name="nytt" type="password" autoComplete="new-password" minLength={minLengde} required />
      </label>
      <label className="innlogging-felt">
        <span>Nytt passord en gang til</span>
        <input name="gjenta" type="password" autoComplete="new-password" minLength={minLengde} required />
      </label>
      <button className="uke-btn" type="submit" disabled={venter}>
        {venter ? "Lagrer …" : "Bytt passord"}
      </button>
      <Feil svar={svar} />
    </form>
  );
}
