"use client";

import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { endreAnsatt, masseendreAnsatte, settAnsattAktiv } from "@/app/admin/handlinger";
import { MASSE_INGEN, type Lokasjon, type Rolle, type Svar, type Team } from "@/lib/domene";
import { Feil, Lagringsstatus, useSkjemaStatus } from "./AdminFelles";

export type AnsattVisning = {
  /** Id-en til oppsettet (ikke brukeren): en person kan ha flere oppsett. */
  id: string;
  brukerId: string;
  name: string;
  teamId: string;
  rolleId: string | null;
  lokasjonId: string | null;
  erAdministrator: boolean;
  aktiv: boolean;
  /** ISO-tid; `null` for dem som fantes før loggen. */
  opprettet: string | null;
};

type Valg = { team: Team[]; roller: Rolle[]; lokasjoner: Lokasjon[]; teamNavn: Map<string, string> };

function abonnerPaaHash(varsle: () => void) {
  window.addEventListener("hashchange", varsle);
  return () => window.removeEventListener("hashchange", varsle);
}

function komInn(opprettet: string | null): string {
  return opprettet ? opprettet.slice(0, 10) : "før loggen";
}

/** Knappen som deaktiverer eller aktiverer en person. Eget skjema, så den ikke lagrer resten av raden. */
function AktivKnapp({ ansatt, revisjon }: { ansatt: AnsattVisning; revisjon: number }) {
  const [svar, handling, lagrer] = useActionState(settAnsattAktiv, null);
  return (
    <form action={handling} className="admin-skjema">
      <input type="hidden" name="revisjon" value={revisjon} />
      <input type="hidden" name="brukerId" value={ansatt.brukerId} />
      <input type="hidden" name="aktiv" value={ansatt.aktiv ? "false" : "true"} />
      <button className="uke-btn" type="submit" disabled={lagrer}>
        {ansatt.aktiv ? "Deaktiver" : "Aktiver"}
      </button>
      <Feil svar={svar} />
    </form>
  );
}

function AnsattRad({
  ansatt,
  valg,
  revisjon,
  avkrysset,
  onVelg,
  ankerId,
  uthevet,
}: {
  ansatt: AnsattVisning;
  valg: Valg;
  revisjon: number;
  avkrysset: boolean;
  onVelg: (valgt: boolean) => void;
  /** Bruker-id som anker, bare på første rad for en bruker (en bruker kan ha flere oppsett). */
  ankerId?: string;
  uthevet: boolean;
}) {
  const [svar, handling, lagrer] = useActionState(endreAnsatt, null);
  const status = useSkjemaStatus(
    {
      teamId: ansatt.teamId,
      rolleId: ansatt.rolleId ?? "",
      lokasjonId: ansatt.lokasjonId ?? "",
      erAdministrator: ansatt.erAdministrator ? "on" : "",
    },
    svar,
  );

  return (
    <li id={ankerId} className={uthevet ? "admin-ansattrad rad--uthevet" : "admin-ansattrad"}>
      <input
        type="checkbox"
        checked={avkrysset}
        onChange={(e) => onVelg(e.target.checked)}
        aria-label={`Velg ${ansatt.name}`}
      />
      <div className="admin-ansattinnhold">
      <form action={handling} className={status.skjemaKlasse} onInput={status.onInput}>
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={ansatt.id} />
        <strong className="admin-navn">{ansatt.name}</strong>
        <span className="admin-bruk">Kom inn: {komInn(ansatt.opprettet)}</span>
        <select name="teamId" defaultValue={ansatt.teamId} aria-label={`Team for ${ansatt.name}`}>
          {valg.team.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select name="rolleId" defaultValue={ansatt.rolleId ?? ""} aria-label={`Rolle for ${ansatt.name}`}>
          <option value="">Ingen rolle</option>
          {valg.roller.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          name="lokasjonId"
          defaultValue={ansatt.lokasjonId ?? ""}
          aria-label={`Lokasjon for ${ansatt.name}`}
        >
          <option value="">Ingen lokasjon</option>
          {valg.lokasjoner.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({valg.teamNavn.get(l.teamId) ?? l.teamId})
            </option>
          ))}
        </select>
        <label className="admin-avkryssing">
          <input type="checkbox" name="erAdministrator" defaultChecked={ansatt.erAdministrator} />
          Administrator
        </label>
        <button className="uke-btn" type="submit" disabled={lagrer}>
          Lagre
        </button>
        <Lagringsstatus endret={status.endret} lagret={status.lagret} />
        <Feil svar={svar} />
      </form>
      <AktivKnapp ansatt={ansatt} revisjon={revisjon} />
      <Link className="uke-btn" href={`/?person=${encodeURIComponent(ansatt.brukerId)}`}>
        Vis i ukeplan
      </Link>
      </div>
    </li>
  );
}

function DeaktivertRad({
  ansatt,
  revisjon,
  ankerId,
  uthevet,
}: {
  ansatt: AnsattVisning;
  revisjon: number;
  ankerId?: string;
  uthevet: boolean;
}) {
  return (
    <li id={ankerId} className={uthevet ? "admin-deaktivert admin-ansattrad rad--uthevet" : "admin-deaktivert admin-ansattrad"}>
      <div className="admin-ansattinnhold">
        <div className="admin-skjema" style={{ flex: "1 1 auto", marginBottom: 0 }}>
          <strong className="admin-navn">{ansatt.name}</strong>
          <span className="admin-bruk">Kom inn: {komInn(ansatt.opprettet)}</span>
          <span className="admin-bruk">Deaktivert</span>
        </div>
        <AktivKnapp ansatt={ansatt} revisjon={revisjon} />
      </div>
    </li>
  );
}

export function AnsattAdmin({
  ansatte,
  team,
  roller,
  lokasjoner,
  revisjon,
}: {
  ansatte: AnsattVisning[];
  team: Team[];
  roller: Rolle[];
  lokasjoner: Lokasjon[];
  revisjon: number;
}) {
  const valg: Valg = { team, roller, lokasjoner, teamNavn: new Map(team.map((t) => [t.id, t.name])) };
  const aktive = ansatte.filter((a) => a.aktiv);
  // Raden fra lenken i Ukeplan/Måned (`#<brukerId>`) utheves. Ankeret ligger bare på første rad per bruker.
  const hash = useSyncExternalStore(abonnerPaaHash, () => window.location.hash, () => "");
  const utheves = decodeURIComponent(hash.slice(1));
  const ankre = new Set<string>();
  const ankerFor = (a: AnsattVisning) => {
    if (ankre.has(a.brukerId)) return undefined;
    ankre.add(a.brukerId);
    return a.brukerId;
  };
  const [krysset, setKrysset] = useState<Set<string>>(new Set());
  // Radene er ukontrollerte og tar ikke imot nye verdier fra siden. Etter en masseendring får
  // de berørte radene ny nøkkel, så de vises på nytt med det som nå er lagret. Andre rader røres ikke.
  const [versjon, setVersjon] = useState<Record<string, number>>({});
  // Radene som ble endret, og revisjonen de ble sendt inn på. Nøkkelen byttes først når siden
  // har fått ny revisjon fra serveren; ellers starter radene på nytt med de gamle verdiene.
  const [ventende, setVentende] = useState<{ ider: string[]; revisjon: number } | null>(null);
  if (ventende && revisjon !== ventende.revisjon) {
    setVentende(null);
    setVersjon((v) => Object.fromEntries([...Object.entries(v), ...ventende.ider.map((id) => [id, (v[id] ?? 0) + 1])]));
  }
  // Bare aktive kan være valgt (en deaktivert rad har ingen avkrysning).
  const valgte = aktive.filter((a) => krysset.has(a.id)).map((a) => a.id);

  function velg(id: string, valgt: boolean) {
    const ny = new Set(krysset);
    if (valgt) ny.add(id);
    else ny.delete(id);
    setKrysset(ny);
  }

  async function masseHandling(forrige: Svar | null, data: FormData): Promise<Svar> {
    const svar = await masseendreAnsatte(forrige, data);
    if (svar.ok) {
      const ider = data.getAll("id").filter((x): x is string => typeof x === "string");
      setVentende({ ider, revisjon: Number(data.get("revisjon")) });
      if (data.get("handling") === "deaktiver") setKrysset(new Set());
    }
    return svar;
  }

  const [masseSvar, masse, masserLagrer] = useActionState(masseHandling, null);

  // Hver rad husker sine egne verdier; en lagring i én rad nullstiller ikke de andre.
  // Deaktiverte ligger nederst, grået.
  return (
    <div>
      <form action={masse} className="admin-skjema admin-masse">
        <input type="hidden" name="revisjon" value={revisjon} />
        {valgte.map((id) => (
          <input key={id} type="hidden" name="id" value={id} />
        ))}
        <label className="admin-avkryssing">
          <input
            type="checkbox"
            checked={aktive.length > 0 && valgte.length === aktive.length}
            onChange={(e) => setKrysset(e.target.checked ? new Set(aktive.map((a) => a.id)) : new Set())}
          />
          Velg alle synlige
        </label>
        <span className="admin-bruk">{valgte.length} valgt</span>
        <select name="teamId" defaultValue="" aria-label="Sett team for valgte">
          <option value="">Team: uendret</option>
          {team.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select name="rolleId" defaultValue="" aria-label="Sett rolle for valgte">
          <option value="">Rolle: uendret</option>
          <option value={MASSE_INGEN}>Fjern rolle</option>
          {roller.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select name="lokasjonId" defaultValue="" aria-label="Sett lokasjon for valgte">
          <option value="">Lokasjon: uendret</option>
          <option value={MASSE_INGEN}>Fjern lokasjon</option>
          {lokasjoner.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({valg.teamNavn.get(l.teamId) ?? l.teamId})
            </option>
          ))}
        </select>
        <button className="uke-btn" type="submit" name="handling" value="sett" disabled={masserLagrer}>
          Bruk på valgte
        </button>
        <button className="uke-btn" type="submit" name="handling" value="deaktiver" disabled={masserLagrer}>
          Deaktiver valgte
        </button>
        {masseSvar?.ok && <span className="admin-status" role="status">{masseSvar.melding}</span>}
        <Feil svar={masseSvar} />
      </form>
      <ul className="admin-lokasjoner">
        {aktive.map((a) => (
          <AnsattRad
            key={`${a.id}:${versjon[a.id] ?? 0}`}
            ansatt={a}
            valg={valg}
            revisjon={revisjon}
            avkrysset={krysset.has(a.id)}
            onVelg={(v) => velg(a.id, v)}
            ankerId={ankerFor(a)}
            uthevet={a.brukerId === utheves}
          />
        ))}
        {ansatte
          .filter((a) => !a.aktiv)
          .map((a) => (
            <DeaktivertRad
              key={a.id}
              ansatt={a}
              revisjon={revisjon}
              ankerId={ankerFor(a)}
              uthevet={a.brukerId === utheves}
            />
          ))}
      </ul>
    </div>
  );
}
