import type { Svar } from "@/lib/domene";

export function Feil({ svar }: { svar: Svar | null }) {
  if (!svar || svar.ok) return null;
  return (
    <p className="admin-feil" role="alert">
      {svar.melding}
    </p>
  );
}

export function Bruk({ antall }: { antall: number }) {
  return (
    <span className="admin-bruk">
      {antall === 0 ? "Ikke i bruk" : `Brukes av ${antall} ${antall === 1 ? "person" : "personer"}`}
    </span>
  );
}
