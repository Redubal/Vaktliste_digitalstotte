"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Svar } from "@/lib/domene";

export function Feil({ svar }: { svar: Svar | null }) {
  if (!svar || svar.ok) return null;
  return (
    <p className="admin-feil" role="alert">
      {svar.melding}
    </p>
  );
}

export function Bruk({ antall }: { antall: number }) {
  return (
    <span className="admin-bruk">
      {antall === 0 ? "Ikke i bruk" : `Brukes av ${antall} ${antall === 1 ? "person" : "personer"}`}
    </span>
  );
}

/** Hvor lenge «Lagret» står etter en vellykket lagring. */
const LAGRET_VISES_MS = 4000;

/** Slår skjemaets felt sammen til én tekst, i samme rekkefølge som `start`, så to tilstander kan sammenlignes. */
function nokkel(verdier: Record<string, string>, felt: string[]): string {
  return JSON.stringify(felt.map((f) => (verdier[f] ?? "").trim()));
}

/**
 * Lagret/ikke lagret for ett skjema (én rad). `start` er verdiene slik de står lagret
 * nå (fra siden); radens egne felt er ukontrollerte og husker det brukeren skrev.
 * Raden er «endret» når feltene avviker fra `start`, og blir «lagret» noen sekunder
 * etter at lagringen gikk bra. Mens raden er endret, advarer nettleseren før fanen lukkes.
 */
export function useSkjemaStatus(start: Record<string, string>, svar: Svar | null) {
  const felt = Object.keys(start);
  const startNokkel = nokkel(start, felt);
  // null = brukeren har ikke rørt skjemaet; da følger raden alltid siden.
  const [redigert, setRedigert] = useState<string | null>(null);
  const [skjult, setSkjult] = useState<Svar | null>(null);

  const endret = redigert !== null && redigert !== startNokkel;
  const lagret = !endret && svar?.ok === true && skjult !== svar;

  useEffect(() => {
    if (!svar?.ok) return;
    const t = setTimeout(() => setSkjult(svar), LAGRET_VISES_MS);
    return () => clearTimeout(t);
  }, [svar]);

  useEffect(() => {
    if (!endret) return;
    const advar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", advar);
    return () => window.removeEventListener("beforeunload", advar);
  }, [endret]);

  function onInput(e: FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget);
    const naa: Record<string, string> = {};
    for (const f of felt) {
      const v = data.get(f);
      naa[f] = typeof v === "string" ? v : "";
    }
    setRedigert(nokkel(naa, felt));
  }

  return {
    endret,
    lagret,
    onInput,
    skjemaKlasse: `admin-skjema${endret ? " admin-endret" : lagret ? " admin-lagret" : ""}`,
  };
}

export function Lagringsstatus({ endret, lagret }: { endret: boolean; lagret: boolean }) {
  return (
    <span className="admin-status" role="status">
      {endret ? "Ikke lagret" : lagret ? "Lagret" : ""}
    </span>
  );
}
