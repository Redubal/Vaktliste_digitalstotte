import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RolleAdmin } from "@/components/RolleAdmin";
import { rolleBrukere } from "@/lib/domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function RollerSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  if (!erAdministrator(finnAnsatt(getAnsatte(), valgtId))) redirect("/");

  const v = lesVaktliste();
  const roller = [...v.roller]
    .sort((a, b) => a.name.localeCompare(b.name, "nb"))
    .map((r) => ({ ...r, antallBrukere: rolleBrukere(v, r.id).length }));

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administrasjon</p>
          <h1>Roller</h1>
        </div>
        <Link className="uke-btn" href="/admin">
          Tilbake til admin
        </Link>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>Legg til, endre og slett</h2>
          <span className="counter">{roller.length} roller</span>
        </div>
        <RolleAdmin roller={roller} revisjon={v.revisjon} />
      </section>
    </main>
  );
}
