"use client";

import { useActionState, useState } from "react";
import {
  endreEndringstype,
  endreStatus,
  leggTilEndringstype,
  leggTilStatus,
  slettEndringstype,
  slettStatus,
} from "@/app/admin/handlinger";
import {
  ENDRINGSTYPE_MAKSLENGDE,
  KATEGORIER,
  STANDARDFARGER,
  STATUS_MAKSLENGDE,
  VIRKNINGER,
  type Kategori,
  type Virkning,
} from "@/lib/domene";
import { Feil, Lagringsstatus, useSkjemaStatus } from "./AdminFelles";

export type StatusVisning = {
  id: string;
  name: string;
  virkning: Virkning;
  antallBrukere: number;
};

function VirkningVelger({ virkning, navn }: { virkning: Virkning; navn: string }) {
  return (
    <select name="virkning" defaultValue={virkning} aria-label={navn}>
      {VIRKNINGER.map((k) => (
        <option key={k.id} value={k.id}>
          {k.navn}
        </option>
      ))}
    </select>
  );
}

export type TypeVisning = {
  id: string;
  name: string;
  kategori: Kategori;
  farge: string | null;
  antallBrukere: number;
};

function BrukEndringer({ antall }: { antall: number }) {
  return (
    <span className="admin-bruk">
      {antall === 0 ? "Ikke i bruk" : `Brukt av ${antall} ${antall === 1 ? "person" : "personer"}`}
    </span>
  );
}

function NyStatus({ revisjon }: { revisjon: number }) {
  const [svar, handling, venter] = useActionState(leggTilStatus, null);
  const status = useSkjemaStatus({ name: "", virkning: "venter" }, svar);
  return (
    <form action={handling} className={status.skjemaKlasse} onInput={status.onInput}>
      <input type="hidden" name="revisjon" value={revisjon} />
      <input
        name="name"
        placeholder="Ny status"
        aria-label="Navn på ny status"
        maxLength={STATUS_MAKSLENGDE}
        required
      />
      <VirkningVelger virkning="venter" navn="Hva ny status betyr" />
      <button className="uke-btn" type="submit" disabled={venter}>
        Legg til
      </button>
      <Lagringsstatus endret={status.endret} lagret={status.lagret} />
      <Feil svar={svar} />
    </form>
  );
}

function StatusRad({ status, revisjon }: { status: StatusVisning; revisjon: number }) {
  const [endreSvar, endreHandling, lagrer] = useActionState(endreStatus, null);
  const [slettSvar, slettHandling, sletter] = useActionState(slettStatus, null);
  const opptatt = lagrer || sletter;
  const skjema = useSkjemaStatus(
    { name: status.name, virkning: status.virkning },
    endreSvar,
  );

  return (
    <li>
      <form action={endreHandling} className={skjema.skjemaKlasse} onInput={skjema.onInput}>
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={status.id} />
        <input
          name="name"
          defaultValue={status.name}
          aria-label={`Navn på ${status.name}`}
          maxLength={STATUS_MAKSLENGDE}
          required
        />
        <VirkningVelger virkning={status.virkning} navn={`Hva ${status.name} betyr`} />
        <BrukEndringer antall={status.antallBrukere} />
        <button className="uke-btn" type="submit" disabled={opptatt}>
          Lagre
        </button>
        <button className="uke-btn" type="submit" formAction={slettHandling} disabled={opptatt}>
          Slett
        </button>
        <Lagringsstatus endret={skjema.endret} lagret={skjema.lagret} />
        <Feil svar={endreSvar} />
        <Feil svar={slettSvar} />
      </form>
    </li>
  );
}

/**
 * Kategori og farge hører sammen: uten «Egen farge» viser fargefeltet (grået) standardfargen for
 * valgt kategori. Fargefeltet sendes bare med når «Egen farge» er på.
 */
function KategoriOgFarge({
  kategori: start,
  farge,
  navn,
}: {
  kategori?: Kategori;
  farge?: string | null;
  navn: { kategori: string; farge: string };
}) {
  const [kategori, setKategori] = useState<Kategori>(start ?? "annet");
  const [paa, setPaa] = useState(Boolean(farge));
  const [valgt, setValgt] = useState<string | null>(farge ?? null);
  return (
    <>
      <select
        name="kategori"
        value={kategori}
        onChange={(e) => setKategori(e.target.value as Kategori)}
        aria-label={navn.kategori}
      >
        {KATEGORIER.map((k) => (
          <option key={k.id} value={k.id}>
            {k.navn}
          </option>
        ))}
      </select>
      <label className="admin-avkryssing">
        <input type="checkbox" name="egenFarge" checked={paa} onChange={(e) => setPaa(e.target.checked)} /> Egen farge
      </label>
      <input
        type="color"
        name="farge"
        value={paa ? (valgt ?? STANDARDFARGER[kategori]) : STANDARDFARGER[kategori]}
        onChange={(e) => setValgt(e.target.value)}
        disabled={!paa}
        aria-label={navn.farge}
      />
    </>
  );
}

function NyType({ revisjon }: { revisjon: number }) {
  const [svar, handling, venter] = useActionState(leggTilEndringstype, null);
  const status = useSkjemaStatus({ name: "", kategori: "annet", egenFarge: "", farge: "" }, svar);
  return (
    <form action={handling} className={status.skjemaKlasse} onInput={status.onInput}>
      <input type="hidden" name="revisjon" value={revisjon} />
      <input
        name="name"
        placeholder="Ny endringstype"
        aria-label="Navn på ny endringstype"
        maxLength={ENDRINGSTYPE_MAKSLENGDE}
        required
      />
      <KategoriOgFarge navn={{ kategori: "Kategori for ny endringstype", farge: "Farge for ny endringstype" }} />
      <button className="uke-btn" type="submit" disabled={venter}>
        Legg til
      </button>
      <Lagringsstatus endret={status.endret} lagret={status.lagret} />
      <Feil svar={svar} />
    </form>
  );
}

function TypeRad({ type, revisjon }: { type: TypeVisning; revisjon: number }) {
  const [endreSvar, endreHandling, lagrer] = useActionState(endreEndringstype, null);
  const [slettSvar, slettHandling, sletter] = useActionState(slettEndringstype, null);
  const opptatt = lagrer || sletter;
  const status = useSkjemaStatus(
    { name: type.name, kategori: type.kategori, egenFarge: type.farge ? "on" : "", farge: type.farge ?? "" },
    endreSvar,
  );

  return (
    <li>
      <form action={endreHandling} className={status.skjemaKlasse} onInput={status.onInput}>
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={type.id} />
        <input
          name="name"
          defaultValue={type.name}
          aria-label={`Navn på ${type.name}`}
          maxLength={ENDRINGSTYPE_MAKSLENGDE}
          required
        />
        <KategoriOgFarge
          kategori={type.kategori}
          farge={type.farge}
          navn={{ kategori: `Kategori for ${type.name}`, farge: `Farge for ${type.name}` }}
        />
        <BrukEndringer antall={type.antallBrukere} />
        <button className="uke-btn" type="submit" disabled={opptatt}>
          Lagre
        </button>
        <button className="uke-btn" type="submit" formAction={slettHandling} disabled={opptatt}>
          Slett
        </button>
        <Lagringsstatus endret={status.endret} lagret={status.lagret} />
        <Feil svar={endreSvar} />
        <Feil svar={slettSvar} />
      </form>
    </li>
  );
}

export function StatusAdmin({ statuser, revisjon }: { statuser: StatusVisning[]; revisjon: number }) {
  // Hver rad husker sine egne verdier. Skjemaet for ny status tømmes når antall rader endres.
  return (
    <div>
      <NyStatus key={statuser.length} revisjon={revisjon} />
      <ul className="admin-lokasjoner">
        {statuser.map((s) => (
          <StatusRad key={s.id} status={s} revisjon={revisjon} />
        ))}
      </ul>
    </div>
  );
}

export function TypeAdmin({ typer, revisjon }: { typer: TypeVisning[]; revisjon: number }) {
  return (
    <div>
      <NyType key={typer.length} revisjon={revisjon} />
      <ul className="admin-lokasjoner">
        {typer.map((t) => (
          <TypeRad key={t.id} type={t} revisjon={revisjon} />
        ))}
      </ul>
    </div>
  );
}
