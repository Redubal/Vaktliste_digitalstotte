import Link from "next/link";
import { loggUt } from "@/app/innlogging/handlinger";
import { lokalModus } from "@/lib/identitet";
import { getAnsatte, type Ansatt } from "@/lib/vaktlista";
import { IdentitetsVelger } from "./IdentitetsVelger";

/** Den innloggede øverst på siden: navn, «Bytt passord» og «Logg ut». I lokal modus: «Du er»-velgeren. */
export function Konto({ jeg }: { jeg: Ansatt | null }) {
  if (lokalModus()) {
    return <IdentitetsVelger valg={getAnsatte().map(({ id, name }) => ({ id, name }))} valgtId={jeg?.id ?? null} />;
  }
  if (!jeg) return null;
  return (
    <div className="konto">
      <span className="konto-navn">{jeg.name}</span>
      <div className="konto-knapper">
        <Link className="uke-btn" href="/bytt-passord">
          Bytt passord
        </Link>
        <form action={loggUt}>
          <button className="uke-btn" type="submit">
            Logg ut
          </button>
        </form>
      </div>
    </div>
  );
}
