"use client";

import { useActionState } from "react";
import {
  endreEndringstype,
  endreStatus,
  leggTilEndringstype,
  leggTilStatus,
  slettEndringstype,
  slettStatus,
} from "@/app/admin/handlinger";
import { ENDRINGSTYPE_MAKSLENGDE, KATEGORIER, STATUS_MAKSLENGDE, type Kategori } from "@/lib/domene";
import { Feil } from "./AdminFelles";

export type StatusVisning = {
  id: string;
  name: string;
  visesIPlan: boolean;
  antallBrukere: number;
};

export type TypeVisning = {
  id: string;
  name: string;
  kategori: Kategori;
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
  return (
    <form action={handling} className="admin-skjema">
      <input type="hidden" name="revisjon" value={revisjon} />
      <input
        name="name"
        placeholder="Ny status"
        aria-label="Navn på ny status"
        maxLength={STATUS_MAKSLENGDE}
        required
      />
      <label className="admin-avkryssing">
        <input type="checkbox" name="visesIPlan" defaultChecked /> Vises i plan
      </label>
      <button className="uke-btn" type="submit" disabled={venter}>
        Legg til
      </button>
      <Feil svar={svar} />
    </form>
  );
}

function StatusRad({ status, revisjon }: { status: StatusVisning; revisjon: number }) {
  const [endreSvar, endreHandling, lagrer] = useActionState(endreStatus, null);
  const [slettSvar, slettHandling, sletter] = useActionState(slettStatus, null);
  const opptatt = lagrer || sletter;

  return (
    <li>
      <form action={endreHandling} className="admin-skjema">
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={status.id} />
        <input
          name="name"
          defaultValue={status.name}
          aria-label={`Navn på ${status.name}`}
          maxLength={STATUS_MAKSLENGDE}
          required
        />
        <label className="admin-avkryssing">
          <input type="checkbox" name="visesIPlan" defaultChecked={status.visesIPlan} /> Vises i plan
        </label>
        <BrukEndringer antall={status.antallBrukere} />
        <button className="uke-btn" type="submit" disabled={opptatt}>
          Lagre
        </button>
        <button className="uke-btn" type="submit" formAction={slettHandling} disabled={opptatt}>
          Slett
        </button>
        <Feil svar={endreSvar} />
        <Feil svar={slettSvar} />
      </form>
    </li>
  );
}

function KategoriValg({ verdi, navn }: { verdi?: Kategori; navn: string }) {
  return (
    <select name="kategori" defaultValue={verdi ?? "annet"} aria-label={navn}>
      {KATEGORIER.map((k) => (
        <option key={k.id} value={k.id}>
          {k.navn}
        </option>
      ))}
    </select>
  );
}

function NyType({ revisjon }: { revisjon: number }) {
  const [svar, handling, venter] = useActionState(leggTilEndringstype, null);
  return (
    <form action={handling} className="admin-skjema">
      <input type="hidden" name="revisjon" value={revisjon} />
      <input
        name="name"
        placeholder="Ny endringstype"
        aria-label="Navn på ny endringstype"
        maxLength={ENDRINGSTYPE_MAKSLENGDE}
        required
      />
      <KategoriValg navn="Kategori for ny endringstype" />
      <button className="uke-btn" type="submit" disabled={venter}>
        Legg til
      </button>
      <Feil svar={svar} />
    </form>
  );
}

function TypeRad({ type, revisjon }: { type: TypeVisning; revisjon: number }) {
  const [endreSvar, endreHandling, lagrer] = useActionState(endreEndringstype, null);
  const [slettSvar, slettHandling, sletter] = useActionState(slettEndringstype, null);
  const opptatt = lagrer || sletter;

  return (
    <li>
      <form action={endreHandling} className="admin-skjema">
        <input type="hidden" name="revisjon" value={revisjon} />
        <input type="hidden" name="id" value={type.id} />
        <input
          name="name"
          defaultValue={type.name}
          aria-label={`Navn på ${type.name}`}
          maxLength={ENDRINGSTYPE_MAKSLENGDE}
          required
        />
        <KategoriValg verdi={type.kategori} navn={`Kategori for ${type.name}`} />
        <BrukEndringer antall={type.antallBrukere} />
        <button className="uke-btn" type="submit" disabled={opptatt}>
          Lagre
        </button>
        <button className="uke-btn" type="submit" formAction={slettHandling} disabled={opptatt}>
          Slett
        </button>
        <Feil svar={endreSvar} />
        <Feil svar={slettSvar} />
      </form>
    </li>
  );
}

export function StatusAdmin({ statuser, revisjon }: { statuser: StatusVisning[]; revisjon: number }) {
  // Nøkkelen byttes ved hver lagring, slik at skjemaene får friske verdier og tømmes.
  return (
    <div key={revisjon}>
      <NyStatus revisjon={revisjon} />
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
    <div key={revisjon}>
      <NyType revisjon={revisjon} />
      <ul className="admin-lokasjoner">
        {typer.map((t) => (
          <TypeRad key={t.id} type={t} revisjon={revisjon} />
        ))}
      </ul>
    </div>
  );
}
