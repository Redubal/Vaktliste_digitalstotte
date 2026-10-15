import Link from "next/link";
import { redirect } from "next/navigation";
import { IdagFargeAdmin } from "@/components/IdagFargeAdmin";
import { SynkAdmin } from "@/components/SynkAdmin";
import { VedlikeholdAdmin } from "@/components/VedlikeholdAdmin";
import { sisteSynkTidspunkt, virkningFor } from "@/lib/domene";
import { erAdministrator, lokalModus } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { aktivKilde, lesSynkStatus } from "@/lib/synk";
import { innlogget } from "@/lib/utfor";

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
  const jeg = await innlogget();
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
        {lokalModus() ? (
          <p className="admin-advarsel">
            Lokal modus (<code>AUTH_MODUS=lokal</code>): identiteten er et valg, ikke innlogging. Hvem
            som helst kan velge en administrator og komme hit.
          </p>
        ) : null}
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
