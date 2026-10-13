import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusAdmin, TypeAdmin } from "@/components/EndringstypeAdmin";
import { endringstypeBrukere, statusBrukere } from "@/lib/domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function EndringstyperSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  if (!erAdministrator(finnAnsatt(getAnsatte(), valgtId))) redirect("/");

  const v = lesVaktliste();
  const statuser = [...v.statuser]
    .sort((a, b) => a.name.localeCompare(b.name, "nb"))
    .map((s) => ({ ...s, antallBrukere: statusBrukere(v, s.id).length }));
  const typer = [...v.endringstyper]
    .sort((a, b) => a.name.localeCompare(b.name, "nb"))
    .map((t) => ({ ...t, antallBrukere: endringstypeBrukere(v, t.id).length }));

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administrasjon</p>
          <h1>Endringstyper og statuser</h1>
        </div>
        <Link className="uke-btn" href="/admin">
          Tilbake til admin
        </Link>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>Statuser</h2>
          <span className="counter">{statuser.length} statuser</span>
        </div>
        <p className="admin-ingress">
          Bare endringer med en status som er merket «Vises i plan» kommer med i ukeplan og
          månedsoversikt.
        </p>
        <StatusAdmin statuser={statuser} revisjon={v.revisjon} />
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Endringstyper</h2>
          <span className="counter">{typer.length} typer</span>
        </div>
        <p className="admin-ingress">Typer i kategorien «Fravær» får fri-farge i planen, hvis de ikke har egen farge.
        </p>
        <TypeAdmin typer={typer} revisjon={v.revisjon} />
      </section>
    </main>
  );
}
