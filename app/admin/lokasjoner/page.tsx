import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LokasjonAdmin } from "@/components/LokasjonAdmin";
import { lokasjonBrukere } from "@/lib/domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function LokasjonerSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  if (!erAdministrator(finnAnsatt(getAnsatte(), valgtId))) redirect("/");

  const v = lesVaktliste();
  const lokasjoner = [...v.lokasjoner]
    .sort((a, b) => a.name.localeCompare(b.name, "nb"))
    .map((l) => ({ ...l, antallBrukere: lokasjonBrukere(v, l.id).length }));

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administrasjon</p>
          <h1>Lokasjoner</h1>
        </div>
        <Link className="uke-btn" href="/admin">
          Tilbake til admin
        </Link>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>Legg til, endre og slett</h2>
          <span className="counter">{lokasjoner.length} lokasjoner</span>
        </div>
        <LokasjonAdmin lokasjoner={lokasjoner} team={v.team} revisjon={v.revisjon} />
      </section>
    </main>
  );
}
