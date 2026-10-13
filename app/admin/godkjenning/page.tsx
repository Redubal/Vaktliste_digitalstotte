import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VenterListe } from "@/components/Godkjenning";
import { godkjentStatus } from "@/lib/domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte, getEndringer } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function GodkjenningSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  if (!erAdministrator(finnAnsatt(getAnsatte(), valgtId))) redirect("/");

  const v = lesVaktliste();
  const tilStatus = godkjentStatus(v.statuser);
  const venter = getEndringer()
    .filter((e) => e.virkning === "venter")
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate) || a.person.localeCompare(b.person, "nb"));

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administrasjon</p>
          <h1>Godkjenning</h1>
        </div>
        <Link className="uke-btn" href="/admin">
          Tilbake til admin
        </Link>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>Venter på godkjenning</h2>
          <span className="counter">{venter.length} endringer</span>
        </div>
        <p className="admin-ingress">
          {tilStatus
            ? `En godkjent endring får statusen «${tilStatus.name}» og vises i planen uten merke.`
            : "Ingen status betyr «Godkjent» ennå. Legg til en under Endringstyper og statuser før du godkjenner."}{" "}
          Endringer som venter, vises med merke i Ukeplan og Måned.
        </p>
        {venter.length === 0 ? (
          <p className="empty-row">Ingen endringer venter på godkjenning.</p>
        ) : (
          <VenterListe endringer={venter} revisjon={v.revisjon} />
        )}
      </section>
    </main>
  );
}
