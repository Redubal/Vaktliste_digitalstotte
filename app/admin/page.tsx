import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IdagFargeAdmin } from "@/components/IdagFargeAdmin";
import { SynkAdmin } from "@/components/SynkAdmin";
import { VedlikeholdAdmin } from "@/components/VedlikeholdAdmin";
import { sisteSynkTidspunkt, virkningFor } from "@/lib/domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { aktivKilde, lesSynkStatus } from "@/lib/synk";
import { getAnsatte } from "@/lib/vaktlista";

function tidspunkt(iso: string | Date): string {
  const d = new Date(iso);
  const dato = d.toLocaleDateString("nb-NO", { timeZone: "Europe/Oslo" });
  const kl = d.toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit" });
  return `${dato} kl. ${kl}`;
}

// Uten denne blir sida bygget som statisk HTML og viser data fra byggetidspunktet.
// Den feilen virker i `next dev` og dukker først opp i produksjon.
export const dynamic = "force-dynamic";

export default async function AdminSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  const jeg = finnAnsatt(getAnsatte(), valgtId);
  if (!erAdministrator(jeg)) redirect("/");
  const v = lesVaktliste();
  const antallVenter = v.endringer.filter((e) => virkningFor(e.statusId, v.statuser) === "venter").length;
  const synkStatus = lesSynkStatus();
  const nå = new Date();
  const siste = sisteSynkTidspunkt(v.synk, nå);
  const synkVisning = {
    kilde: aktivKilde().navn,
    sistSynket: synkStatus.sistOk ? tidspunkt(synkStatus.sistOk) : null,
    feiletSist: synkStatus.ok === false && synkStatus.sistForsøk ? tidspunkt(synkStatus.sistForsøk) : null,
    melding: synkStatus.melding,
    neste: siste ? tidspunkt(new Date(siste.getTime() + v.synk.intervallTimer * 3_600_000)) : null,
  };

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
          <Link className="uke-btn" href="/admin/dager">
            Dager
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

      <section className="panel">
        <div className="section-head">
          <h2>Rammen for dagens dato</h2>
          <span className="counter">{v.innstillinger.idagFarge ? "egen farge" : "standardfarge"}</span>
        </div>
        <IdagFargeAdmin innstillinger={v.innstillinger} revisjon={v.revisjon} />
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Synk av ansatte</h2>
          <span className="counter">{v.synk.intervallTimer ? "automatisk på" : "automatisk av"}</span>
        </div>
        <SynkAdmin innstillinger={v.synk} visning={synkVisning} revisjon={v.revisjon} />
      </section>
    </main>
  );
}
