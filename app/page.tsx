import Link from "next/link";
import { redirect } from "next/navigation";
import { DagClient } from "@/components/DagClient";
import type { EndringValg } from "@/components/EndringVindu";
import { Konto } from "@/components/Konto";
import { MaanedClient } from "@/components/MaanedClient";
import { MineEndringer } from "@/components/MineEndringer";
import { Tabs, type TabDefinition } from "@/components/Tabs";
import { UkeplanClient } from "@/components/UkeplanClient";
import { VaktlisteClient } from "@/components/VaktlisteClient";
import { erAdministrator, lokalModus } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { innlogget } from "@/lib/utfor";
import { getAnsatte, getDager, getEndringer, getMineEndringer, getTeam } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [nøkkel: string]: string | string[] | undefined }>;
}) {
  // Ingenting av planen leses eller sendes før det er klart hvem som spør. I lokal modus ser
  // også den som ikke har valgt seg selv planen, som før Fase 45.
  const jeg = await innlogget();
  if (!jeg && !lokalModus()) redirect("/logg-inn");
  const erAdmin = erAdministrator(jeg);

  const { person, fane } = await searchParams;
  const utheves = typeof person === "string" ? person : null;
  const ansatte = getAnsatte();
  const dager = getDager();
  const team = getTeam();

  // Til nettleseren: e-post og kommentar på ansatte brukes ikke i visningene, og avviste endringer
  // vises ikke i planen. Kommentaren på en endring kan handle om helse, så den sendes bare til
  // personen selv og administratorer. Holdes igjen her, så det ikke sendes ut (Fase 29).
  const ansatteUt = ansatte.map((a) => ({ ...a, upn: "", comment: "" }));
  const endringer = getEndringer()
    .filter((e) => e.virkning !== "avvist")
    .map((e) => (erAdmin || e.personId === jeg?.id ? e : { ...e, comment: "" }));
  // Bare når noen har valgt seg selv: revisjonen og valgene til vinduet for endringer (og
  // «Godkjenn» for administratorer). Uten dem kan ingen dag klikkes.
  const v = jeg ? lesVaktliste() : null;
  const revisjon = v ? v.revisjon : null;
  const valg: EndringValg | null = v
    ? {
        endringstyper: v.endringstyper
          .map(({ id, name, kategori }) => ({ id, name, kategori }))
          .sort((a, b) => a.name.localeCompare(b.name, "nb")),
        lokasjoner: v.lokasjoner
          .map(({ id, name, teamId }) => ({ id, name, teamId }))
          .sort((a, b) => a.name.localeCompare(b.name, "nb")),
      }
    : null;
  const jegId = jeg?.id ?? null;
  // Bytte i «Du er» oppdaterer siden uten å nullstille visningene; nøkkelen gjør at de starter på
  // nytt, så teamet følger personen som er valgt (ellers blir forrige persons team stående).
  const visningsNokkel = jegId ?? "ingen";

  // Ansatte ser Dag, Uke og Måned. Administrator ser i tillegg ansattlista og
  // lenken til admin-sidene. Utvalget gjøres her, på serveren, slik at innhold
  // en ansatt ikke skal se heller ikke sendes til nettleseren.
  const tabs: TabDefinition[] = [
    {
      id: "dag",
      label: "Dag",
      content: (
        <DagClient
          key={visningsNokkel}
          team={team}
          ansatte={ansatteUt}
          endringer={endringer}
          dager={dager}
          erAdmin={erAdmin}
          jegId={jegId}
          revisjon={revisjon}
          valg={valg}
        />
      ),
    },
    {
      id: "ukeplan",
      label: "Uke",
      content: (
        <UkeplanClient
          key={visningsNokkel}
          team={team}
          ansatte={ansatteUt}
          endringer={endringer}
          dager={dager}
          erAdmin={erAdmin}
          jegId={jegId}
          revisjon={revisjon}
          valg={valg}
          utheves={utheves}
        />
      ),
    },
    {
      id: "maaned",
      label: "Måned",
      content: (
        <MaanedClient
          key={visningsNokkel}
          team={team}
          ansatte={ansatteUt}
          endringer={endringer}
          dager={dager}
          erAdmin={erAdmin}
          jegId={jegId}
          revisjon={revisjon}
          valg={valg}
        />
      ),
    },
  ];

  // Egne endringer, valgt ut her på serveren: andres rader og begrunnelser sendes ikke med.
  if (jeg) {
    tabs.push({
      id: "mine",
      label: "Mine endringer",
      content: <MineEndringer endringer={getMineEndringer(jeg.id)} />,
    });
  }

  if (erAdmin) {
    tabs.push({
      id: "ansatte",
      label: "Ansatte",
      content: <VaktlisteClient employees={ansatteUt} team={team} />,
    });
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Digitale tjenester 2026/2027</p>
          <h1>Digital Støtte - Vaktlista</h1>
        </div>
        <div className="header-verktoy">
          <Konto jeg={jeg} />
          {erAdmin ? (
            <Link className="uke-btn" href="/admin">
              Admin
            </Link>
          ) : null}
        </div>
      </header>

      <Tabs initialTabId={typeof fane === "string" && tabs.some((t) => t.id === fane) ? fane : "dag"} tabs={tabs} />
    </main>
  );
}
