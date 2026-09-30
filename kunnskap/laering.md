# Læringslogg

## 2026-09-30 (avslutning Fase 1 og 2) — Admin verifisert

**Evaluering av forrige økts punkter:**
- `[historikk-omskriving-push-først]` ikke utløst (ingen historikk skrevet om) — videreføres, git-valget ligger fortsatt åpent
- `[rammen-først]` ikke utløst (ingen datamodell planlagt) — videreføres, Fase 3 kan utløse det

**Nye punkter:**
- `[status-i-undermappe]` Finner `fase-start` ikke `kunnskap/STATUS.md`, let i undermapper (`*/kunnskap/STATUS.md`) og si hvor den ligger, før `nytt-prosjekt` foreslås. Belegg: økten ble åpnet i rotkatalogen, `fase-start` foreslo oppsett, brukeren kalte `nytt-prosjekt`, og prosjektet lå ferdig i `app/`. Oppsettet ble stoppet før noe ble skrevet.

**Fasesnitt:** Fase 1 og 2 fikk plass i én økt uten `/compact`. «Admin fungerer ikke» var en `brukere.json` som ikke var lagret i editoren; ingen kodeendring.

Issue til pakkerepoet: godkjent av bruker, men ikke opprettet (`gh` er ikke installert på maskinen). Tekst: «fase-start bør lete i undermapper (`*/kunnskap/STATUS.md`) før den foreslår nytt oppsett».

## 2026-09-30 (kveldsøkt) — Admin planlagt, Fase 2 skrevet

**Evaluering av forrige økts punkter:**
- `[dev-server-først]` fulgt (porten ble sjekket med `netstat` før noe ble startet) — strykes som innarbeidet
- `[persondata-i-plan]` fulgt (planen sier at `data/` og sikkerhetskopiene står utenfor git, og Claude leste aldri `data/`) — strykes som innarbeidet
- `[lange-edits-via-fil]` fulgt (all kode skrevet med Write/Edit) — strykes som innarbeidet

**Nye punkter:**
- `[historikk-omskriving-push-først]` Før historikk skrives om, avklar at den nye kan sendes ut. Belegg: `filter-branch` kjørte, men force-pushen ble blokkert, så lokal og GitHub spriker 6/6 og vanlig push avvises.
- `[rammen-først]` Når brukeren nevner Excel som kilde, spør om Excel fortsatt er fasit før datamodellen planlegges. Belegg: hele første planutkast og designoppdraget bygde på at Excel var fasit; bruker måtte rette det to ganger.

**Fasesnitt:** økten fikk plass uten `/compact`, men rommet planlegging, historikkrydding og ikke-verifisert kode. Fase 2 er liten nok. Planen er snittet i seks små faser, se `plan.md`.

Issue til pakkerepoet: ikke aktuelt.

## 2026-09-30 (senere økt) — Fase 1, data og layout

**Evaluering av forrige økts punkter:**
- `[celle-på-td]` fulgt (månedsvisningen la stilen på `span`/`div` inni `td`/`th`) — strykes som innarbeidet
- `[dev-server-først]` ikke utløst (ingen dev-server startet) — videreføres, Fase 2 kan utløse det
- `[persondata-i-plan]` ikke utløst (ingen nytt register, bare omstrukturering av eksisterende, `data/` fortsatt ignorert) — videreføres, Fase 3 kan utløse det

**Nye punkter:**
- `[lange-edits-via-fil]` Lange kodeendringer gjøres med Write/Edit, ikke som `node -e` med sitert kode i Bash. Belegg: en slik kommando med enkeltanførselstegn i innholdet ga «unexpected EOF» og ingenting ble kjørt; det kostet en ekstra runde.

**Fasesnitt:** økten fikk plass uten `/compact`. Snittet holder.

Issue til pakkerepoet: ikke aktuelt.

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
