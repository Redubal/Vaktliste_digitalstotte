# Læringslogg

## 2026-09-30 — Fase 1, delvis verifisering

**Evaluering av forrige økts punkter:**
- `[dev-server-først]` ikke utløst (bruker kjørte serveren selv) — videreføres, Fase 2 kan utløse det
- `[persondata-i-plan]` ikke utløst (ingen ny import planlagt) — videreføres, Fase 3 kan utløse det

**Nye punkter:**
- `[celle-på-td]` Aldri `display: flex/block` på `td`/`tr`/`th`; legg stilen på en `div` inni. Belegg: `.celle` på `<td>` stablet hele uka i én kolonne; tsc, lint og build så ingenting, bare brukeren så det i nettleseren.

**Fasesnitt:** Fase 1 fikk plass i én økt, rettelsen kom i en kort oppfølging. Snittet holder.

Issue til pakkerepoet: ikke aktuelt.

## 2026-09-30 — etter Fase 1

Ingen tidligere punkter å evaluere (første faseslutt).

**Fasesnitt:** Fase 1 fikk plass i én økt uten `/compact`. Snittet holder.

**Nye punkter:**
- `[dev-server-først]` Sjekk om en dev-server alt kjører (`localhost:3000`, `.next/dev/lock`) før `npm run dev`. Belegg: start på port 3210 feilet med «Another next dev server is already running».
- `[persondata-i-plan]` Når en plan importerer fra Excel/registre, skal planen ta stilling til `.gitignore` for uttrekket. Belegg: Fase 1-planen nevnte JSON-filer med navn/e-post/sykefravær uten ignore-regel; fanget først i fase-slutt.

Issue til pakkerepoet: ikke aktuelt.
