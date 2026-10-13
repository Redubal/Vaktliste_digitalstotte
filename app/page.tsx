import { cookies } from "next/headers";
import Link from "next/link";
import type { EndringValg } from "@/components/EndringVindu";
import { IdentitetsVelger } from "@/components/IdentitetsVelger";
import { MaanedClient } from "@/components/MaanedClient";
import { MineEndringer } from "@/components/MineEndringer";
import { Tabs, type TabDefinition } from "@/components/Tabs";
import { UkeplanClient } from "@/components/UkeplanClient";
import { VaktlisteClient } from "@/components/VaktlisteClient";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { lesVaktliste } from "@/lib/lager";
import { getAnsatte, getDager, getEndringer, getMineEndringer, getTeam } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [nøkkel: string]: string | string[] | undefined }>;
}) {
  const { person, fane } = await searchParams;
  const utheves = typeof person === "string" ? person : null;
  const ansatte = getAnsatte();
  const endringer = getEndringer();
  const dager = getDager();
  const team = getTeam();

  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  const jeg = finnAnsatt(ansatte, valgtId);
  const erAdmin = erAdministrator(jeg);
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

  // Ansatte ser Ukeplan og Måned. Administrator ser i tillegg ansattlista og
  // lenken til admin-sidene. Utvalget gjøres her, på serveren, slik at innhold
  // en ansatt ikke skal se heller ikke sendes til nettleseren.
  const tabs: TabDefinition[] = [
    {
      id: "ukeplan",
      label: "Ukeplan",
      content: (
        <UkeplanClient
          key={visningsNokkel}
          team={team}
          ansatte={ansatte}
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
          ansatte={ansatte}
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
      content: <VaktlisteClient employees={ansatte} team={team} />,
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
          <IdentitetsVelger
            valg={ansatte.map(({ id, name }) => ({ id, name }))}
            valgtId={jeg?.id ?? null}
          />
          {erAdmin ? (
            <Link className="uke-btn" href="/admin">
              Admin
            </Link>
          ) : null}
        </div>
      </header>

      <Tabs initialTabId={typeof fane === "string" && tabs.some((t) => t.id === fane) ? fane : "ukeplan"} tabs={tabs} />
    </main>
  );
}
