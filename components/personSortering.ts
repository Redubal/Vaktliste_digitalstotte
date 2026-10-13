import type { Sortering } from "@/lib/sortering";
import type { Ansatt } from "@/lib/vaktlista";

/** Kolonnene Ukeplan og Måned kan sorteres på: personen i første kolonne. */
export const PERSON_KOLONNER = ["navn", "rolle"] as const;

/** Uten `?sorter=` i adressen: navn stigende, som i Ansatte-listene. */
export const STANDARD_PERSON_SORTERING: Sortering = { kolonne: "navn", retning: "stigende" };

export const PERSON_VERDIER: Record<string, (rad: { person: Ansatt }) => string> = {
  navn: (rad) => rad.person.name,
  rolle: (rad) => rad.person.role,
};
