import Link from "next/link";
import { redirect } from "next/navigation";
import { TABELLER, lesEndringslogg, type LoggLinje } from "@/lib/endringslogg";
import { erAdministrator } from "@/lib/identitet";
import { innlogget } from "@/lib/utfor";

export const dynamic = "force-dynamic";

const MAKS_LINJER = 500;
const TIDSSONE = "Europe/Oslo";
const DATO = /^\d{4}-\d{2}-\d{2}$/;

/** Dato (ÅÅÅÅ-MM-DD) slik den er på veggen i Norge, ikke i UTC. */
function osloDato(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: TIDSSONE });
}

function tidTekst(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("nb-NO", { timeZone: TIDSSONE, dateStyle: "short", timeStyle: "medium" });
}

function datoTekst(dato: string): string {
  const [å, m, d] = dato.split("-");
  return `${d}.${m}.${å}`;
}

function setning(l: LoggLinje): string {
  if (l.handling === "kjørt") return `${l.endretAv} kjørte (${l.rad})`;
  const info = TABELLER.find((t) => t.nøkkel === l.tabell);
  return `${l.endretAv} ${l.handling} ${info?.entall ?? l.tabell} «${l.rad}»`;
}

function enkelt(verdi: string | string[] | undefined): string {
  return typeof verdi === "string" ? verdi : "";
}

export default async function LoggSide({
  searchParams,
}: {
  searchParams: Promise<{ [nøkkel: string]: string | string[] | undefined }>;
}) {
  if (!erAdministrator(await innlogget())) redirect("/");

  const p = await searchParams;
  const filter = TABELLER.find((t) => t.nøkkel === enkelt(p.tabell))?.nøkkel ?? null;

  const idag = osloDato(new Date());
  const alleDager = enkelt(p.periode) === "alle";
  let fra = DATO.test(enkelt(p.fra)) ? enkelt(p.fra) : "";
  let til = DATO.test(enkelt(p.til)) ? enkelt(p.til) : "";
  if (!alleDager && !fra && !til) fra = til = idag;
  if (fra && til && fra > til) [fra, til] = [til, fra];

  const alle = lesEndringslogg();
  const treff = alle.filter((l) => {
    if (filter && l.tabell !== filter) return false;
    if (alleDager) return true;
    const dato = osloDato(new Date(l.tid));
    return (!fra || dato >= fra) && (!til || dato <= til);
  });
  const synlige = treff.slice(0, MAKS_LINJER);

  const lenke = (nye: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const verdier: Record<string, string | null> = { tabell: filter, ...nye };
    for (const [k, v] of Object.entries(verdier)) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `/admin/logg?${s}` : "/admin/logg";
  };
  const knapp = (aktiv: boolean) => ({ className: "uke-btn", "aria-current": aktiv ? ("page" as const) : undefined });

  const manedStart = `${idag.slice(0, 8)}01`;
  const årStart = `${idag.slice(0, 4)}-01-01`;
  const periodeTekst = alleDager
    ? "hele loggen"
    : fra === til
      ? datoTekst(fra)
      : `${fra ? datoTekst(fra) : "begynnelsen"} – ${til ? datoTekst(til) : "nå"}`;

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administrasjon</p>
          <h1>Endringslogg</h1>
        </div>
        <Link className="uke-btn" href="/admin">
          Tilbake til admin
        </Link>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>Hvem endret hva</h2>
          <span className="counter">
            {periodeTekst}:{" "}
            {treff.length > MAKS_LINJER ? `de ${MAKS_LINJER} nyeste av ${treff.length}` : `${treff.length} endringer`}
          </span>
        </div>

        <div className="admin-meny">
          <Link {...knapp(!alleDager && fra === idag && til === idag)} href={lenke({ fra: idag, til: idag })}>
            I dag
          </Link>
          <Link {...knapp(!alleDager && fra === manedStart && til === idag)} href={lenke({ fra: manedStart, til: idag })}>
            Denne måneden
          </Link>
          <Link {...knapp(!alleDager && fra === årStart && til === idag)} href={lenke({ fra: årStart, til: idag })}>
            I år
          </Link>
          <Link {...knapp(alleDager)} href={lenke({ periode: "alle" })}>
            Hele loggen
          </Link>
        </div>

        <form className="logg-filter" method="get" action="/admin/logg">
          {alleDager && <input type="hidden" name="periode" value="alle" />}
          <label className="select-field">
            Fra
            <input type="date" name="fra" defaultValue={alleDager ? "" : fra} max={idag} />
          </label>
          <label className="select-field">
            Til
            <input type="date" name="til" defaultValue={alleDager ? "" : til} max={idag} />
          </label>
          <label className="select-field">
            Tabell
            <select name="tabell" defaultValue={filter ?? ""}>
              <option value="">Alle tabeller</option>
              {TABELLER.map((t) => (
                <option key={t.nøkkel} value={t.nøkkel}>
                  {t.overskrift}
                </option>
              ))}
            </select>
          </label>
          <button className="uke-btn" type="submit">
            Vis
          </button>
        </form>

        {synlige.length === 0 ? (
          <p className="admin-ingress">
            Ingen endringer i {periodeTekst}. Prøv en lengre periode. Loggen fylles fra og med Fase 9, så
            eldre endringer finnes ikke.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="logg-tabell">
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "35%" }} />
                <col style={{ width: "50%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Tid</th>
                  <th>Endring</th>
                  <th>Detaljer</th>
                </tr>
              </thead>
              <tbody>
                {synlige.map((l, i) => (
                  <tr key={`${l.tid}-${l.tabell}-${l.radId}-${i}`}>
                    <td>{tidTekst(l.tid)}</td>
                    <td>{setning(l)}</td>
                    <td>
                      {l.felt.map((f) => (
                        <div key={f.felt}>
                          <strong>{f.felt}:</strong>{" "}
                          {l.handling === "endret"
                            ? `${f.gammel ?? "(tom)"} → ${f.ny ?? "(tom)"}`
                            : (f.ny ?? f.gammel)}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
