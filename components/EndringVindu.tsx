"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { lagreEndring, slettEndring } from "@/app/handlinger";
import {
  ENDRING_KOMMENTAR_MAKSLENGDE,
  kanEndreEndring,
  kanSletteEndring,
  type Kategori,
  type Svar,
} from "@/lib/domene";
import type { UkeplanCelle } from "@/lib/ukeplan";
import type { Ansatt, Endring } from "@/lib/vaktlista";
import { Feil } from "./AdminFelles";
import { hva, periode } from "./Godkjenning";

/** Valgene vinduet trenger. Sendes bare når noen har valgt seg selv. */
export type EndringValg = {
  endringstyper: { id: string; name: string; kategori: Kategori }[];
  lokasjoner: { id: string; name: string; teamId: string }[];
};

type AapenDag = { person: Ansatt; iso: string; endring: Endring | null };

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
    return () => setAapen({ person, iso: celle.iso, endring: celle.endring ?? null });
  }

  const vindu =
    aapen && jegId && typeof revisjon === "number" && valg ? (
      <Vindu
        // Ny nøkkel per dag: feltene starter på nytt hver gang vinduet åpnes.
        key={`${aapen.person.id}-${aapen.iso}-${aapen.endring?.id ?? ""}`}
        dag={aapen}
        jegId={jegId}
        erAdmin={erAdmin}
        revisjon={revisjon}
        valg={valg}
        onLukk={() => setAapen(null)}
      />
    ) : null;

  return { aapneFor, vindu };
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
  onLukk,
}: {
  dag: AapenDag;
  jegId: string;
  erAdmin: boolean;
  revisjon: number;
  valg: EndringValg;
  onLukk: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    // Utviklingsmodus kjører effekten to ganger; et åpent vindu skal ikke åpnes på nytt.
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  const { person, endring } = dag;
  const aktør = { id: jegId, erAdmin };
  // Endringen i cella rettes bare når du får lov; ellers legger vinduet inn en ny.
  const retter =
    endring && kanEndreEndring({ brukerId: endring.personId, virkning: endring.virkning }, aktør) ? endring : null;

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

  let merknad: ReactNode = null;
  if (endring && !retter) {
    merknad = (
      <p className="vindu-merknad">
        Dagen har en godkjent endring ({hva(endring)}, {periode(endring)}). Bare en administrator kan endre den. En ny
        endring venter på godkjenning og vises i planen når den godkjente er fjernet.
      </p>
    );
  }

  return (
    <dialog ref={ref} className="endring-vindu" aria-labelledby="endring-vindu-tittel" onClose={onLukk}>
      <h2 id="endring-vindu-tittel">{tittel}</h2>
      {merknad}
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

        <label className="vindu-felt">
          <span>Kommentar (valgfritt)</span>
          <input type="text" name="comment" defaultValue={retter?.comment ?? ""} maxLength={ENDRING_KOMMENTAR_MAKSLENGDE} />
        </label>

        <p className="vindu-info">
          {erAdmin ? "Endringen gjelder med en gang." : "Endringen venter på godkjenning fra en administrator."}
        </p>

        <Feil svar={lagreFeil.synlig} />

        <div className="vindu-knapper">
          <button className="uke-btn uke-btn--today" type="submit" disabled={!klar || lagrer || sletter}>
            {lagrer ? "Lagrer …" : "Lagre"}
          </button>
          <button className="uke-btn" type="button" onClick={() => ref.current?.close()}>
            Avbryt
          </button>
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
