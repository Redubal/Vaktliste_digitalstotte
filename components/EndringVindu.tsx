"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { lagreEndring, slettEndring } from "@/app/handlinger";
import {
  ENDRING_KOMMENTAR_MAKSLENGDE,
  kanEndreEndring,
  kanSletteEndring,
  type Kategori,
  type Svar,
} from "@/lib/domene";
import { tidTekst, type UkeplanCelle } from "@/lib/ukeplan";
import type { Ansatt, Endring } from "@/lib/vaktlista";
import { Feil } from "./AdminFelles";
import { hva, periode } from "./Godkjenning";

/** Valgene vinduet trenger. Sendes bare når noen har valgt seg selv. */
export type EndringValg = {
  endringstyper: { id: string; name: string; kategori: Kategori }[];
  lokasjoner: { id: string; name: string; teamId: string }[];
};

/** Det vinduet trenger å vite om personen endringen gjelder. */
type VinduPerson = Pick<Ansatt, "id" | "name" | "teamId">;

/** Klokkeslett i vinduet: 15 minutters steg (i sekunder), og forslaget når «Bestemt klokkeslett» skrus på. */
const TID_STEG = 900;
const STANDARD_FRA = "08:00";
const STANDARD_TIL = "16:00";

/** Hva vinduet viser: skjema for en endring, skjema for en ny (`null`), eller lista over dagens endringer. */
type Valgt = Endring | "liste" | null;

/** `endringer` er dagens endringer (tom når vinduet åpnes direkte på én endring, fra Godkjenning). */
type AapenDag = { person: VinduPerson; iso: string; endringer: Endring[]; valgt: Valgt };

/**
 * Hva som vises når en dag klikkes: ingen endringer gir et tomt skjema; én endring du kan rette åpnes
 * direkte; ellers lista, der du velger «Rett» eller «Ny endring samme dag».
 */
function startValg(endringer: Endring[], aktør: { id: string; erAdmin: boolean }): Valgt {
  if (endringer.length === 0) return null;
  const [en] = endringer;
  if (endringer.length === 1 && kanEndreEndring({ brukerId: en.personId, virkning: en.virkning }, aktør)) return en;
  return "liste";
}

type Oppsett = {
  jegId: string | null;
  erAdmin: boolean;
  revisjon: number | null;
  valg: EndringValg | null;
};

/**
 * Klikk på en dag i Ukeplan eller Måned. `aapneFor` gir `undefined` når dagen ikke kan klikkes:
 * ingen har valgt seg selv, raden er en annens (og du er ikke administrator), eller personen er
 * ikke aktiv den dagen. `vindu` settes inn ett sted i visningen.
 */
export function useEndringVindu({ jegId, erAdmin, revisjon, valg }: Oppsett) {
  const [aapen, setAapen] = useState<AapenDag | null>(null);

  function aapneFor(person: Ansatt, celle: UkeplanCelle): (() => void) | undefined {
    // `!`/`typeof` og ikke `=== null`: etter en kodeendring kan siden ha gamle data uten feltene.
    if (!jegId || typeof revisjon !== "number" || !valg || celle.utenforPeriode) return undefined;
    if (!erAdmin && person.id !== jegId) return undefined;
    return () =>
      setAapen({
        person,
        iso: celle.iso,
        endringer: celle.endringer,
        valgt: startValg(celle.endringer, { id: jegId, erAdmin }),
      });
  }

  const vindu =
    aapen && jegId && typeof revisjon === "number" && valg ? (
      <Vindu
        // Ny nøkkel per dag og visning: feltene starter på nytt hver gang vinduet åpnes eller bytter visning.
        key={`${aapen.person.id}-${aapen.iso}-${valgtNøkkel(aapen.valgt)}`}
        dag={aapen}
        jegId={jegId}
        erAdmin={erAdmin}
        revisjon={revisjon}
        valg={valg}
        onVelg={(v) => setAapen({ ...aapen, valgt: v })}
        onLukk={() => setAapen(null)}
      />
    ) : null;

  return { aapneFor, vindu };
}

/**
 * «Rett» på en rad i Admin → Godkjenning: åpner samme vindu som i Ukeplan, direkte på endringen
 * (uten å gå via en dag i planen). Bare for administratorer. `teamId` for personen gir lokasjonslista
 * til riktig team; finnes den ikke, vises alle lokasjoner.
 */
export function useRettVindu({
  jegId,
  revisjon,
  valg,
  teamAvPerson,
}: {
  jegId: string;
  revisjon: number;
  valg: EndringValg;
  teamAvPerson: Record<string, string>;
}) {
  const [aapen, setAapen] = useState<AapenDag | null>(null);

  function rett(endring: Endring): () => void {
    return () =>
      setAapen({
        person: { id: endring.personId, name: endring.person, teamId: teamAvPerson[endring.personId] ?? "" },
        iso: endring.fromDate,
        endringer: [],
        valgt: endring,
      });
  }

  const vindu = aapen ? (
    <Vindu
      key={`${aapen.person.id}-${valgtNøkkel(aapen.valgt)}`}
      dag={aapen}
      jegId={jegId}
      erAdmin
      revisjon={revisjon}
      valg={valg}
      onVelg={() => {}}
      onLukk={() => setAapen(null)}
    />
  ) : null;

  return { rett, vindu };
}

function valgtNøkkel(valgt: Valgt): string {
  return valgt === "liste" ? "liste" : (valgt?.id ?? "ny");
}

/** Viser `svar` til noe i skjemaet endres; da forsvinner den gamle feilmeldingen. */
function useSynligSvar(svar: Svar | null) {
  const [skjult, setSkjult] = useState<Svar | null>(null);
  return { synlig: svar === skjult ? null : svar, skjul: () => setSkjult(svar) };
}

function Vindu({
  dag,
  jegId,
  erAdmin,
  revisjon,
  valg,
  onVelg,
  onLukk,
}: {
  dag: AapenDag;
  jegId: string;
  erAdmin: boolean;
  revisjon: number;
  valg: EndringValg;
  onVelg: (valgt: Valgt) => void;
  onLukk: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    // Utviklingsmodus kjører effekten to ganger; et åpent vindu skal ikke åpnes på nytt.
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  const { person, valgt } = dag;
  const aktør = { id: jegId, erAdmin };
  // Endringen rettes bare når du får lov; ellers legger vinduet inn en ny.
  const retter =
    valgt && valgt !== "liste" && kanEndreEndring({ brukerId: valgt.personId, virkning: valgt.virkning }, aktør)
      ? valgt
      : null;

  const [lagreSvar, lagre, lagrer] = useActionState(lagreEndring, null);
  const [slettSvar, slett, sletter] = useActionState(slettEndring, null);
  const lagreFeil = useSynligSvar(lagreSvar);
  const [bekreftSlett, setBekreftSlett] = useState(false);

  // Lagret eller slettet: siden har fått nye data, vinduet lukkes.
  useEffect(() => {
    if (lagreSvar?.ok || slettSvar?.ok) ref.current?.close();
  }, [lagreSvar, slettSvar]);

  const [typeId, setTypeId] = useState(retter?.typeId ?? "");
  const [lokasjonId, setLokasjonId] = useState(retter?.lokasjonId ?? "");
  const [fra, setFra] = useState(retter?.fromDate || dag.iso);
  const [medTid, setMedTid] = useState(Boolean(retter?.fromTime));
  const type = valg.endringstyper.find((t) => t.id === typeId);
  // Lokasjon spørres alltid om: typer som «Flyttet» kan ligge i «Annet». Påkrevd for lokasjonstyper.
  const lokasjonPaakrevd = type?.kategori === "lokasjon";
  const lokasjoner = valg.lokasjoner.filter((l) => l.teamId === person.teamId);
  const lokasjonsvalg = lokasjoner.length > 0 ? lokasjoner : valg.lokasjoner;
  const klar = Boolean(typeId) && Boolean(fra) && (!lokasjonPaakrevd || Boolean(lokasjonId));

  const egen = person.id === jegId;
  const tittel = retter
    ? `Rett endring${egen ? "" : ` for ${person.name}`}`
    : `Ny endring${egen ? "" : ` for ${person.name}`}`;

  if (valgt === "liste") {
    return (
      <dialog ref={ref} className="endring-vindu" aria-labelledby="endring-vindu-tittel" onClose={onLukk}>
        <h2 id="endring-vindu-tittel">Endringer samme dag{egen ? "" : ` for ${person.name}`}</h2>
        <ul className="vindu-liste">
          {dag.endringer.map((e) => (
            <li key={e.id}>
              <span className="vindu-liste-tekst">
                {tidTekst(e) && <strong>{tidTekst(e)} </strong>}
                {hva(e)}
                <small>
                  {periode(e)} · {e.virkning === "venter" ? "venter på godkjenning" : "godkjent"}
                </small>
              </span>
              {kanEndreEndring({ brukerId: e.personId, virkning: e.virkning }, aktør) ? (
                <button className="uke-btn" type="button" onClick={() => onVelg(e)}>
                  Rett
                </button>
              ) : (
                <small>Bare en administrator kan endre den</small>
              )}
            </li>
          ))}
        </ul>
        <p className="vindu-info">
          {erAdmin
            ? "En ny endring gjelder med en gang."
            : "En ny endring venter på godkjenning fra en administrator."}
        </p>
        <div className="vindu-knapper">
          <button className="uke-btn uke-btn--today" type="button" onClick={() => onVelg(null)}>
            Ny endring samme dag
          </button>
          <button className="uke-btn" type="button" onClick={() => ref.current?.close()}>
            Lukk
          </button>
        </div>
      </dialog>
    );
  }

  return (
    <dialog ref={ref} className="endring-vindu" aria-labelledby="endring-vindu-tittel" onClose={onLukk}>
      <h2 id="endring-vindu-tittel">{tittel}</h2>
      <form action={lagre} onChange={lagreFeil.skjul} className="vindu-skjema">
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={retter?.id ?? ""} />
        <input type="hidden" name="brukerId" value={person.id} />

        <label className="vindu-felt">
          <span>Hva gjelder det?</span>
          <select name="typeId" value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
            <option value="" disabled>
              Velg …
            </option>
            {valg.endringstyper.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="vindu-felt">
          <span>Ny lokasjon{lokasjonPaakrevd ? "" : " (valgfritt)"}</span>
          <select name="lokasjonId" value={lokasjonId} onChange={(e) => setLokasjonId(e.target.value)}>
            <option value="">{lokasjonPaakrevd ? "Velg …" : "Ingen"}</option>
            {lokasjonsvalg.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>

        <div className="vindu-datoer">
          <label className="vindu-felt">
            <span>Fra</span>
            <input type="date" name="fromDate" value={fra} onChange={(e) => setFra(e.target.value)} required />
          </label>
          <label className="vindu-felt">
            <span>Til</span>
            <input type="date" name="toDate" defaultValue={retter?.toDate || dag.iso} min={fra} />
          </label>
        </div>

        <label className="admin-avkryssing">
          <input type="checkbox" checked={medTid} onChange={(e) => setMedTid(e.target.checked)} /> Bestemt klokkeslett
        </label>
        {medTid ? (
          <>
            <div className="vindu-datoer">
              <label className="vindu-felt">
                <span>Fra kl.</span>
                <input type="time" name="fromTime" step={TID_STEG} defaultValue={retter?.fromTime || STANDARD_FRA} required />
              </label>
              <label className="vindu-felt">
                <span>Til kl.</span>
                <input type="time" name="toTime" step={TID_STEG} defaultValue={retter?.toTime || STANDARD_TIL} required />
              </label>
            </div>
            <p className="vindu-info">Gjelder endringen flere dager, er klokkeslettet det samme hver dag.</p>
          </>
        ) : (
          <p className="vindu-info">Uten klokkeslett gjelder endringen hele dagen.</p>
        )}

        <label className="vindu-felt">
          <span>Kommentar (valgfritt)</span>
          <input type="text" name="comment" defaultValue={retter?.comment ?? ""} maxLength={ENDRING_KOMMENTAR_MAKSLENGDE} />
        </label>

        <p className="vindu-info">
          {retter
            ? retter.virkning === "venter"
              ? "Endringen venter fortsatt på godkjenning; rettingen godkjenner den ikke."
              : "Rettingen gjelder med en gang."
            : erAdmin
              ? "Endringen gjelder med en gang."
              : "Endringen venter på godkjenning fra en administrator."}
        </p>

        <Feil svar={lagreFeil.synlig} />

        <div className="vindu-knapper">
          <button className="uke-btn uke-btn--today" type="submit" disabled={!klar || lagrer || sletter}>
            {lagrer ? "Lagrer …" : "Lagre"}
          </button>
          <button className="uke-btn" type="button" onClick={() => ref.current?.close()}>
            Avbryt
          </button>
          {retter && dag.endringer.length > 0 && (
            <button className="uke-btn" type="button" onClick={() => onVelg(null)}>
              Ny endring samme dag
            </button>
          )}
          {dag.endringer.length > 1 && (
            <button className="uke-btn" type="button" onClick={() => onVelg("liste")}>
              Tilbake til lista
            </button>
          )}
        </div>
      </form>

      {retter && kanSletteEndring(aktør) && (
        <form action={slett} className="vindu-slett">
          <input type="hidden" name="revisjon" value={revisjon} />
          <input type="hidden" name="id" value={retter.id} />
          {bekreftSlett ? (
            <>
              <span>Slette hele endringen ({periode(retter)})?</span>
              <button className="uke-btn slett-knapp" type="submit" disabled={sletter || lagrer}>
                {sletter ? "Sletter …" : "Ja, slett"}
              </button>
              <button className="uke-btn" type="button" onClick={() => setBekreftSlett(false)}>
                Nei
              </button>
            </>
          ) : (
            <button className="uke-btn" type="button" onClick={() => setBekreftSlett(true)}>
              Slett endringen
            </button>
          )}
          <Feil svar={slettSvar} />
        </form>
      )}
    </dialog>
  );
}
