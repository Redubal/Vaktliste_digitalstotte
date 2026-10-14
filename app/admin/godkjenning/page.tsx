import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { EndringValg } from "@/components/EndringVindu";
import { GodkjenningListe } from "@/components/GodkjenningListe";
import { avvistStatus, finnOverlapp, godkjentStatus } from "@/lib/domene";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte, getEndringer } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function GodkjenningSide() {
  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  const ansatte = getAnsatte();
  const jeg = finnAnsatt(ansatte, valgtId);
  if (!jeg || !erAdministrator(jeg)) redirect("/");

  const v = lesVaktliste();
  const valg: EndringValg = {
    endringstyper: v.endringstyper
      .map(({ id, name, kategori }) => ({ id, name, kategori }))
      .sort((a, b) => a.name.localeCompare(b.name, "nb")),
    lokasjoner: v.lokasjoner
      .map(({ id, name, teamId }) => ({ id, name, teamId }))
      .sort((a, b) => a.name.localeCompare(b.name, "nb")),
  };
  // En person kan ha flere oppsett; det første gir team til lokasjonslista i «Rett»-vinduet.
  const teamAvPerson: Record<string, string> = {};
  for (const a of ansatte) teamAvPerson[a.id] ??= a.teamId;
  const tilStatus = godkjentStatus(v.statuser);
  const avvistTil = avvistStatus(v.statuser);
  const ikkeAvvist = getEndringer().filter((e) => e.virkning !== "avvist");
  // Regnes ut her på serveren: en ventende endring som overlapper en godkjent eller en annen ventende.
  const overlappIder = [...finnOverlapp(ikkeAvvist)];
  const venter = ikkeAvvist
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
          {avvistTil
            ? `En avvist endring får statusen «${avvistTil.name}» og vises ikke i planen.`
            : "Ingen status betyr «Avvist» ennå. Legg til en under Endringstyper og statuser før du avviser."}{" "}
          Endringer som venter, vises med merke i Ukeplan og Måned.
        </p>
        {venter.length === 0 ? (
          <p className="empty-row">Ingen endringer venter på godkjenning.</p>
        ) : (
          <GodkjenningListe
            endringer={venter}
            alleEndringer={ikkeAvvist}
            overlappIder={overlappIder}
            revisjon={v.revisjon}
            jegId={jeg.id}
            valg={valg}
            teamAvPerson={teamAvPerson}
          />
        )}
      </section>
    </main>
  );
}
