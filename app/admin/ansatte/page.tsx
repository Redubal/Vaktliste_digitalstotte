import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnsattAdmin } from "@/components/AnsattAdmin";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function AnsatteSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  if (!erAdministrator(finnAnsatt(getAnsatte(), valgtId))) redirect("/");

  const v = lesVaktliste();
  const navn = new Map(v.brukere.map((b) => [b.id, b.name.trim()]));
  const ansatte = v.oppsett
    .filter((o) => navn.get(o.brukerId))
    .map((o) => ({
      id: o.id,
      name: navn.get(o.brukerId) ?? "",
      teamId: o.teamId,
      rolleId: o.rolleId,
      lokasjonId: o.lokasjonId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administrasjon</p>
          <h1>Ansatte</h1>
        </div>
        <Link className="uke-btn" href="/admin">
          Tilbake til admin
        </Link>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>Endre team, rolle og lokasjon</h2>
          <span className="counter">{ansatte.length} ansatte</span>
        </div>
        <AnsattAdmin
          ansatte={ansatte}
          team={v.team}
          roller={[...v.roller].sort((a, b) => a.name.localeCompare(b.name, "nb"))}
          lokasjoner={[...v.lokasjoner].sort((a, b) => a.name.localeCompare(b.name, "nb"))}
          revisjon={v.revisjon}
        />
      </section>
    </main>
  );
}
