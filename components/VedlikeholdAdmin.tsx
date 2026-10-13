"use client";

import { useActionState } from "react";
import { settVedlikehold } from "@/app/admin/handlinger";
import { VEDLIKEHOLD_MELDING_MAKSLENGDE, type Innstillinger } from "@/lib/domene";
import { Feil } from "./AdminFelles";

/** Bryter for vedlikeholdsmodus. Knappene sender `vedlikehold` = true/false sammen med meldingen. */
export function VedlikeholdAdmin({ innstillinger, revisjon }: { innstillinger: Innstillinger; revisjon: number }) {
  const [svar, handling, venter] = useActionState(settVedlikehold, null);

  return (
    <form action={handling} className="admin-skjema vedlikehold-skjema">
      <input type="hidden" name="revisjon" value={revisjon} />
      <p className="admin-ingress">
        Vedlikehold er <strong>{innstillinger.vedlikehold ? "på" : "av"}</strong>. Når det er på, ser alle som ikke er
        administratorer bare meldingen under.
      </p>
      <label className="vedlikehold-melding">
        <span>Melding til ansatte</span>
        <textarea
          name="melding"
          defaultValue={innstillinger.melding}
          maxLength={VEDLIKEHOLD_MELDING_MAKSLENGDE}
          rows={2}
        />
      </label>
      <div className="vedlikehold-knapper">
        <button className="uke-btn" type="submit" name="vedlikehold" value="true" disabled={venter}>
          {innstillinger.vedlikehold ? "Lagre melding" : "Slå på vedlikehold"}
        </button>
        {innstillinger.vedlikehold ? (
          <button className="uke-btn" type="submit" name="vedlikehold" value="false" disabled={venter}>
            Slå av vedlikehold
          </button>
        ) : null}
      </div>
      {svar?.ok ? (
        <p className="admin-status" role="status">
          {svar.melding}
        </p>
      ) : null}
      <Feil svar={svar} />
    </form>
  );
}
