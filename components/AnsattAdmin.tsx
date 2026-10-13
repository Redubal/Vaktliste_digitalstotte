"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { endreAnsatt, lagreAlleAnsatte, masseendreAnsatte, settAnsattAktiv } from "@/app/admin/handlinger";
import { MASSE_INGEN, type Lokasjon, type Rolle, type Svar, type Team } from "@/lib/domene";
import { ariaSort, delNavn, sorterRader, type Sortering } from "@/lib/sortering";
import { Feil, Lagringsstatus, useSkjemaStatus } from "./AdminFelles";
import { SorterKnapp, useSortering } from "./Sortering";

const ADMIN_KOLONNER = [
  { id: "navn", tittel: "Fornavn" },
  { id: "etternavn", tittel: "Etternavn" },
  { id: "team", tittel: "Team" },
  { id: "rolle", tittel: "Rolle" },
  { id: "lokasjon", tittel: "Lokasjon" },
];
const STANDARD_SORTERING: Sortering = { kolonne: "navn", retning: "stigende" };

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

export function komInn(opprettet: string | null): string {
  return opprettet ? opprettet.slice(0, 10) : "før loggen";
}

/** Knappen som deaktiverer eller aktiverer en person. Eget skjema, så den ikke lagrer resten av raden. */
export function AktivKnapp({
  ansatt,
  revisjon,
}: {
  ansatt: Pick<AnsattVisning, "brukerId" | "aktiv">;
  revisjon: number;
}) {
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
  meldEndret,
}: {
  ansatt: AnsattVisning;
  valg: Valg;
  revisjon: number;
  avkrysset: boolean;
  onVelg: (valgt: boolean) => void;
  /** Bruker-id som anker, bare på første rad for en bruker (en bruker kan ha flere oppsett). */
  ankerId?: string;
  uthevet: boolean;
  /** Sier fra til «Lagre alle» når raden har ulagrede endringer. */
  meldEndret: (id: string, endret: boolean) => void;
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
  useEffect(() => {
    meldEndret(ansatt.id, status.endret);
    return () => meldEndret(ansatt.id, false);
  }, [meldEndret, ansatt.id, status.endret]);

  return (
    <li id={ankerId} className={uthevet ? "admin-ansattrad rad--uthevet" : "admin-ansattrad"}>
      <input
        type="checkbox"
        checked={avkrysset}
        onChange={(e) => onVelg(e.target.checked)}
        aria-label={`Velg ${ansatt.name}`}
      />
      <div className="admin-ansattinnhold">
      <form action={handling} className={status.skjemaKlasse} onInput={status.onInput} data-oppsett={ansatt.id}>
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={ansatt.id} />
        <strong className="admin-navn">{delNavn(ansatt.name).fornavn}</strong>
        <strong className="admin-navn">{delNavn(ansatt.name).etternavn}</strong>
        {/* Status og «Kom inn» deler plassen, så raden ikke blir høyere når den har ulagrede endringer. */}
        <Lagringsstatus endret={status.endret} lagret={status.lagret} />
        {!status.endret && !status.lagret && <span className="admin-bruk">Kom inn: {komInn(ansatt.opprettet)}</span>}
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
      <span className="avkryssing-plass" />
      <div className="admin-ansattinnhold">
        <div className="admin-skjema" style={{ flex: "1 1 auto", marginBottom: 0 }}>
          <strong className="admin-navn">{delNavn(ansatt.name).fornavn}</strong>
          <strong className="admin-navn">{delNavn(ansatt.name).etternavn}</strong>
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
  const { sortering, sorterPaa } = useSortering(ADMIN_KOLONNER.map((k) => k.id), STANDARD_SORTERING);
  const rolleNavn = new Map(roller.map((r) => [r.id, r.name]));
  const lokasjonNavn = new Map(lokasjoner.map((l) => [l.id, l.name]));
  const verdier: Record<string, (a: AnsattVisning) => string> = {
    navn: (a) => a.name,
    etternavn: (a) => delNavn(a.name).etternavn,
    team: (a) => valg.teamNavn.get(a.teamId) ?? a.teamId,
    rolle: (a) => (a.rolleId ? (rolleNavn.get(a.rolleId) ?? "") : ""),
    lokasjon: (a) => (a.lokasjonId ? (lokasjonNavn.get(a.lokasjonId) ?? "") : ""),
  };
  const sortert = sorterRader(ansatte, sortering, verdier);
  const aktive = sortert.filter((a) => a.aktiv);
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

  // En feilmelding fra masseendring skjules så snart avkrysningen endres; den gjaldt forrige valg.
  const [skjultMasseSvar, setSkjultMasseSvar] = useState<Svar | null>(null);

  function velg(id: string, valgt: boolean) {
    setSkjultMasseSvar(masseSvar);
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

  // «Lagre alle»: radene med ulagrede endringer sier fra hver for seg (`meldEndret`); verdiene
  // leses fra radskjemaene (`data-oppsett`) idet knappen trykkes og sendes inn på én revisjon.
  const [endrede, setEndrede] = useState<Set<string>>(new Set());
  const meldEndret = useCallback((id: string, endret: boolean) => {
    setEndrede((forrige) => {
      if (forrige.has(id) === endret) return forrige;
      const ny = new Set(forrige);
      if (endret) ny.add(id);
      else ny.delete(id);
      return ny;
    });
  }, []);
  const listeRef = useRef<HTMLUListElement | null>(null);

  async function lagreAlleHandling(): Promise<Svar> {
    const rader: Record<string, string | boolean>[] = [];
    for (const skjema of listeRef.current?.querySelectorAll<HTMLFormElement>("form[data-oppsett]") ?? []) {
      const id = skjema.dataset.oppsett ?? "";
      if (!endrede.has(id)) continue;
      const felt = new FormData(skjema);
      const tekst = (n: string) => (typeof felt.get(n) === "string" ? (felt.get(n) as string) : "");
      rader.push({
        id,
        teamId: tekst("teamId"),
        rolleId: tekst("rolleId"),
        lokasjonId: tekst("lokasjonId"),
        erAdministrator: felt.get("erAdministrator") === "on",
      });
    }
    const data = new FormData();
    data.set("revisjon", String(revisjon));
    data.set("rader", JSON.stringify(rader));
    const svar = await lagreAlleAnsatte(null, data);
    if (svar.ok) setVentende({ ider: rader.map((r) => String(r.id)), revisjon });
    return svar;
  }

  const [alleSvar, lagreAlle, alleLagrer] = useActionState(lagreAlleHandling, null);

  // Hver rad husker sine egne verdier; en lagring i én rad nullstiller ikke de andre.
  // Deaktiverte ligger nederst, grået.
  return (
    <div>
      {/* «Lagre alle» står i masse-linja (knappen hører til dette skjemaet via `form`), så knappene står på én linje. */}
      <form id="lagre-alle" action={lagreAlle} hidden />
      <form action={masse} className="admin-skjema admin-masse">
        <input type="hidden" name="revisjon" value={revisjon} />
        {valgte.map((id) => (
          <input key={id} type="hidden" name="id" value={id} />
        ))}
        <div className="admin-masse-rad">
        <label className="admin-avkryssing">
          <input
            type="checkbox"
            checked={aktive.length > 0 && valgte.length === aktive.length}
            onChange={(e) => {
              setSkjultMasseSvar(masseSvar);
              setKrysset(e.target.checked ? new Set(aktive.map((a) => a.id)) : new Set());
            }}
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
        </div>
        <div className="admin-masse-rad">
        <button className="uke-btn" type="submit" form="lagre-alle" disabled={alleLagrer || endrede.size === 0}>
          Lagre alle{endrede.size > 0 ? ` (${endrede.size})` : ""}
        </button>
        <button className="uke-btn" type="submit" name="handling" value="sett" disabled={masserLagrer || valgte.length === 0}>
          Bruk på valgte
        </button>
        <button className="uke-btn" type="submit" name="handling" value="deaktiver" disabled={masserLagrer || valgte.length === 0}>
          Deaktiver valgte
        </button>
        {masseSvar?.ok && <span className="admin-status" role="status">{masseSvar.melding}</span>}
        {alleSvar?.ok && endrede.size === 0 && <span className="admin-status" role="status">{alleSvar.melding}</span>}
        </div>
        <Feil svar={masseSvar === skjultMasseSvar ? null : masseSvar} />
        <Feil svar={alleSvar} />
      </form>
      <div className="sorter-rad" role="group" aria-label="Sorter ansatte">
        <span className="admin-bruk">Sorter på:</span>
        {ADMIN_KOLONNER.map(({ id, tittel }) => (
          <span key={id} aria-sort={ariaSort(sortering, id)}>
            <SorterKnapp kolonne={id} sortering={sortering} onSorter={sorterPaa}>
              {tittel}
            </SorterKnapp>
          </span>
        ))}
      </div>
      <div className="ansatt-hode">
        <span className="avkryssing-plass" />
        <div className="ansatt-hode-ytre">
          <div className="ansatt-rutenett">
            {(["navn", "etternavn", "", "team", "rolle", "lokasjon"] as const).map((id, i) =>
              id ? (
                <span key={id} aria-sort={ariaSort(sortering, id)}>
                  <SorterKnapp kolonne={id} sortering={sortering} onSorter={sorterPaa}>
                    {ADMIN_KOLONNER.find((k) => k.id === id)?.tittel}
                  </SorterKnapp>
                </span>
              ) : (
                <span key={`tom-${i}`} />
              ),
            )}
          </div>
        </div>
      </div>
      <ul className="admin-lokasjoner" ref={listeRef}>
        {aktive.map((a) => (
          <AnsattRad
            meldEndret={meldEndret}
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
        {sortert
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
