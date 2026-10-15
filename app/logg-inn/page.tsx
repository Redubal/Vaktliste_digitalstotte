import { redirect } from "next/navigation";
import { LoggInnSkjema } from "@/components/LoggInnSkjema";
import { lokalModus } from "@/lib/identitet";
import { lesOkt } from "@/lib/innlogging";
import { innlogget } from "@/lib/utfor";

export const dynamic = "force-dynamic";

export default async function LoggInnSide() {
  if (lokalModus()) redirect("/");
  const økt = await lesOkt();
  if (økt?.maaBytte) redirect("/bytt-passord");
  // En gyldig økt for en som er deaktivert gir `null` her, og skjemaet vises: ingen omdirigering i ring.
  if (await innlogget()) redirect("/");

  return (
    <main className="page-shell">
      <section className="panel innlogging-side">
        <p className="eyebrow">Digital Støtte - Vaktlista</p>
        <h1>Logg inn</h1>
        <LoggInnSkjema />
      </section>
    </main>
  );
}
