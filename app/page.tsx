import { MaanedClient } from "@/components/MaanedClient";
import { Tabs } from "@/components/Tabs";
import { UkeplanClient } from "@/components/UkeplanClient";
import { VaktlisteClient } from "@/components/VaktlisteClient";
import { getAnsatte, getDager, getEndringer } from "@/lib/vaktlista";

export const dynamic = "force-dynamic";

export default function Home() {
  const ansatte = getAnsatte();
  const endringer = getEndringer();
  const dager = getDager();

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Digitale tjenester 2026/2027</p>
          <h1>Digital Støtte - Vaktlista</h1>
        </div>
      </header>

      <Tabs
        initialTabId="ukeplan"
        tabs={[
          {
            id: "ukeplan",
            label: "Ukeplan",
            content: (
              <UkeplanClient ansatte={ansatte} endringer={endringer} dager={dager} />
            ),
          },
          {
            id: "maaned",
            label: "Måned",
            content: (
              <MaanedClient ansatte={ansatte} endringer={endringer} dager={dager} />
            ),
          },
          {
            id: "ansatte",
            label: "Ansatte",
            content: <VaktlisteClient employees={ansatte} />,
          },
        ]}
      />
    </main>
  );
}
