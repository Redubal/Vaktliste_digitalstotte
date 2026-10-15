import Link from "next/link";
import { redirect } from "next/navigation";
import { loggUt } from "@/app/innlogging/handlinger";
import { ByttPassordSkjema } from "@/components/ByttPassordSkjema";
import { lokalModus } from "@/lib/identitet";
import { lesOkt, MIN_PASSORDLENGDE } from "@/lib/innlogging";

export const dynamic = "force-dynamic";

export default async function ByttPassordSide() {
  if (lokalModus()) redirect("/");
  const økt = await lesOkt();
  if (!økt) redirect("/logg-inn");

  return (
    <main className="page-shell">
      <section className="panel innlogging-side">
        <p className="eyebrow">Digital Støtte - Vaktlista</p>
        <h1>Bytt passord</h1>
        {økt.maaBytte ? (
          <p className="vedlikehold-tekst">Du logget inn med startpassordet. Velg ditt eget før du går videre.</p>
        ) : null}
        <ByttPassordSkjema minLengde={MIN_PASSORDLENGDE} />
        <div className="konto-knapper">
          {økt.maaBytte ? null : (
            <Link className="uke-btn" href="/">
              Avbryt
            </Link>
          )}
          <form action={loggUt}>
            <button className="uke-btn" type="submit">
              Logg ut
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
