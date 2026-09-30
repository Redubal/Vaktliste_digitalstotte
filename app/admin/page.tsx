import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { getAnsatte } from "@/lib/vaktlista";

// Uten denne blir sida bygget som statisk HTML og viser data fra byggetidspunktet.
// Den feilen virker i `next dev` og dukker først opp i produksjon.
export const dynamic = "force-dynamic";

export default async function AdminSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  const jeg = finnAnsatt(getAnsatte(), valgtId);
  if (!erAdministrator(jeg)) redirect("/");

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
          <span className="counter">kommer</span>
        </div>
        <p className="admin-ingress">
          Du er logget på som <strong>{jeg?.name}</strong> og har admintilgang. Her kommer
          vedlikehold av listene appen bygger på, én liste om gangen:
        </p>
        <ul className="admin-liste">
          <li>Lokasjoner — legge til, endre og fjerne</li>
          <li>Roller</li>
          <li>Endringstyper og statuser</li>
          <li>Team</li>
          <li>Ansatte — endre rolle, team og lokasjon</li>
        </ul>
        <p className="admin-advarsel">
          Identiteten over er et midlertidig valg, ikke innlogging. Hvem som helst kan velge
          en administrator i nedtrekkslisten og komme hit. Ekte tilgangsstyring kommer med
          Entra SSO.
        </p>
      </section>
    </main>
  );
}
