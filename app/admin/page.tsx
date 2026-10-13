import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VedlikeholdAdmin } from "@/components/VedlikeholdAdmin";
import { virkningFor } from "@/lib/domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte } from "@/lib/vaktlista";

// Uten denne blir sida bygget som statisk HTML og viser data fra byggetidspunktet.
// Den feilen virker i `next dev` og dukker først opp i produksjon.
export const dynamic = "force-dynamic";

export default async function AdminSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  const jeg = finnAnsatt(getAnsatte(), valgtId);
  if (!erAdministrator(jeg)) redirect("/");
  const v = lesVaktliste();
  const antallVenter = v.endringer.filter((e) => virkningFor(e.statusId, v.statuser) === "venter").length;

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administrasjon</p>
          <h1>Admin</h1>
        </div>
        <Link className="uke-btn" href="/">
          Tilbake til vaktlista
        </Link>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>Vedlikehold</h2>
          <span className="counter">{v.innstillinger.vedlikehold ? "vedlikehold på" : "vedlikehold av"}</span>
        </div>
        <p className="admin-ingress">
          Du er logget på som <strong>{jeg?.name}</strong> og har admintilgang. Vedlikehold av
          listene appen bygger på kommer én liste om gangen.
        </p>
        <div className="admin-meny">
          <Link className="uke-btn" href="/admin/godkjenning">
            Godkjenning ({antallVenter})
          </Link>
          <Link className="uke-btn" href="/admin/ansatte">
            Ansatte
          </Link>
          <Link className="uke-btn" href="/admin/team">
            Team
          </Link>
          <Link className="uke-btn" href="/admin/lokasjoner">
            Lokasjoner
          </Link>
          <Link className="uke-btn" href="/admin/roller">
            Roller
          </Link>
          <Link className="uke-btn" href="/admin/endringstyper">
            Endringstyper og statuser
          </Link>
          <Link className="uke-btn" href="/admin/logg">
            Endringslogg
          </Link>
        </div>
        <VedlikeholdAdmin innstillinger={v.innstillinger} revisjon={v.revisjon} />
        <p className="admin-advarsel">
          Identiteten over er et midlertidig valg, ikke innlogging. Hvem som helst kan velge
          en administrator i nedtrekkslisten og komme hit. Ekte tilgangsstyring kommer med
          Entra SSO.
        </p>
      </section>
    </main>
  );
}
