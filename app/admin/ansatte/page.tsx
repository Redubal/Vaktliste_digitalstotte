import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnsattAdmin } from "@/components/AnsattAdmin";
import { NyeAnsatte } from "@/components/NyeAnsatte";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function AnsatteSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  if (!erAdministrator(finnAnsatt(getAnsatte(), valgtId))) redirect("/");

  const v = lesVaktliste();
  const brukere = new Map(v.brukere.map((b) => [b.id, b]));
  const ansatte = v.oppsett
    .filter((o) => brukere.get(o.brukerId)?.name.trim())
    .map((o) => {
      const b = brukere.get(o.brukerId)!;
      return {
        id: o.id,
        brukerId: b.id,
        name: b.name.trim(),
        teamId: o.teamId,
        rolleId: o.rolleId,
        lokasjonId: o.lokasjonId,
        erAdministrator: b.erAdministrator === true,
        aktiv: b.aktiv,
        opprettet: b.opprettet,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));
  // Personer uten oppsett (fra synken): nyeste først, deaktiverte nederst.
  const medOppsett = new Set(v.oppsett.map((o) => o.brukerId));
  const nye = v.brukere
    .filter((b) => !medOppsett.has(b.id) && b.name.trim())
    .map((b) => ({ brukerId: b.id, name: b.name.trim(), upn: b.upn, aktiv: b.aktiv, opprettet: b.opprettet }))
    .sort((a, b) => Number(b.aktiv) - Number(a.aktiv) || (b.opprettet ?? "").localeCompare(a.opprettet ?? ""));

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
          <h2>Nye, mangler team</h2>
          <span className="counter">{nye.filter((n) => n.aktiv).length} nye</span>
        </div>
        <NyeAnsatte nye={nye} team={v.team} revisjon={v.revisjon} />
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Endre team, rolle, lokasjon og adminstatus</h2>
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
