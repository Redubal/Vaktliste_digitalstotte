import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DagAdmin } from "@/components/DagAdmin";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function DagerSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  if (!erAdministrator(finnAnsatt(getAnsatte(), valgtId))) redirect("/");

  const v = lesVaktliste();
  // Nyeste dato øverst, så en dag du nettopp la inn står der du ser den.
  const dager = [...v.dager].sort((a, b) => b.fromDate.localeCompare(a.fromDate) || a.comment.localeCompare(b.comment, "nb"));

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administrasjon</p>
          <h1>Dager</h1>
        </div>
        <Link className="uke-btn" href="/admin">
          Tilbake til admin
        </Link>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>Legg til, endre og slett</h2>
          <span className="counter">{dager.length} dager</span>
        </div>
        <p className="admin-ingress">
          Teksten vises over dagene i Uke og i Måned. La «til» stå tom for én enkelt dag.
        </p>
        <DagAdmin dager={dager} revisjon={v.revisjon} />
      </section>
    </main>
  );
}
