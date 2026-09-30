import { cookies } from "next/headers";
import Link from "next/link";
import { IdentitetsVelger } from "@/components/IdentitetsVelger";
import { MaanedClient } from "@/components/MaanedClient";
import { Tabs, type TabDefinition } from "@/components/Tabs";
import { UkeplanClient } from "@/components/UkeplanClient";
import { VaktlisteClient } from "@/components/VaktlisteClient";
import { IDENTITET_COOKIE, erAdministrator, finnAnsatt } from "@/lib/identitet";
import { getAnsatte, getDager, getEndringer } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default async function Home() {
  const ansatte = getAnsatte();
  const endringer = getEndringer();
  const dager = getDager();

  const valgtId = (await cookies()).get(IDENTITET_COOKIE)?.value ?? null;
  const jeg = finnAnsatt(ansatte, valgtId);
  const erAdmin = erAdministrator(jeg);

  // Ansatte ser Ukeplan og Måned. Administrator ser i tillegg ansattlista og
  // lenken til admin-sidene. Utvalget gjøres her, på serveren, slik at innhold
  // en ansatt ikke skal se heller ikke sendes til nettleseren.
  const tabs: TabDefinition[] = [
    {
      id: "ukeplan",
      label: "Ukeplan",
      content: <UkeplanClient ansatte={ansatte} endringer={endringer} dager={dager} />,
    },
    {
      id: "maaned",
      label: "Måned",
      content: <MaanedClient ansatte={ansatte} endringer={endringer} dager={dager} />,
    },
  ];

  if (erAdmin) {
    tabs.push({
      id: "ansatte",
      label: "Ansatte",
      content: <VaktlisteClient employees={ansatte} />,
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

      <Tabs initialTabId="ukeplan" tabs={tabs} />
    </main>
  );
}
