import Link from "next/link";
import { redirect } from "next/navigation";
import { RolleAdmin } from "@/components/RolleAdmin";
import { rolleBrukere } from "@/lib/domene";
import { erAdministrator } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { innlogget } from "@/lib/utfor";

export const dynamic = "force-dynamic";

export default async function RollerSide() {
  if (!erAdministrator(await innlogget())) redirect("/");

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
