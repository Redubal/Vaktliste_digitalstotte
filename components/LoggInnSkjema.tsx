"use client";

import { useActionState } from "react";
import { loggInn } from "@/app/innlogging/handlinger";

export function LoggInnSkjema() {
  const [svar, handling, venter] = useActionState(loggInn, null);

  return (
    <form action={handling} className="innlogging-skjema">
      <label className="innlogging-felt">
        <span>E-post</span>
        <input
          // Ny nøkkel etter et galt forsøk: feltet tegnes på nytt med e-posten som ble skrevet.
          key={svar?.epost ?? ""}
          name="epost"
          type="email"
          autoComplete="username"
          defaultValue={svar?.epost ?? ""}
          required
        />
      </label>
      <label className="innlogging-felt">
        <span>Passord</span>
        <input name="passord" type="password" autoComplete="current-password" required />
      </label>
      <button className="uke-btn" type="submit" disabled={venter}>
        {venter ? "Logger inn …" : "Logg inn"}
      </button>
      {svar ? (
        <p className="admin-feil" role="alert">
          {svar.melding}
        </p>
      ) : null}
    </form>
  );
}
