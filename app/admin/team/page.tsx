import Link from "next/link";
import { redirect } from "next/navigation";
import { TeamAdmin } from "@/components/TeamAdmin";
import { teamPersoner } from "@/lib/domene";
import { erAdministrator } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { innlogget } from "@/lib/utfor";

export const dynamic = "force-dynamic";

export default async function TeamSide() {
  if (!erAdministrator(await innlogget())) redirect("/");

  const v = lesVaktliste();
  // Tabellens rekkefølge, som i teamvelgeren; nye team kommer sist.
  const team = v.team.map((t) => ({ ...t, antallBrukere: teamPersoner(v, t.id).length }));

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administrasjon</p>
          <h1>Team</h1>
        </div>
        <Link className="uke-btn" href="/admin">
          Tilbake til admin
        </Link>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>Legg til, endre og slett</h2>
          <span className="counter">{team.length} team</span>
        </div>
        <TeamAdmin team={team} revisjon={v.revisjon} />
      </section>
    </main>
  );
}
