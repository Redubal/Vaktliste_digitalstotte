import fs from "node:fs";
import path from "node:path";
import {
  SYNK_AVSENDER,
  anvendSynk,
  beskrivSynk,
  sjekkKildePersoner,
  synkErForfalt,
  synkHarEndringer,
  type KildePerson,
  type SynkInnstillinger,
} from "./domene";
import { skrivEndringer } from "./endringslogg";
import { endreVaktliste, lesVaktliste } from "./lager";

const DATA_DIR = path.resolve(process.cwd(), "data");
const TESTFIL = path.join(DATA_DIR, "entra-test.json");
// Egen fil, ikke i vaktliste.json: en synk uten endringer skal ikke gi ny revisjon og sikkerhetskopi.
const STATUSFIL = path.join(DATA_DIR, "synkstatus.json");

/** Hvor personene kommer fra. Feiler med en `Error` som har en melding som kan vises i Admin. */
export type SynkKilde = { navn: string; hentPersoner: () => Promise<KildePerson[]> };

/** Oppdiktede personer i `data/entra-test.json`, med feltnavnene Microsoft Graph gir (`id`, `givenName` …). */
export const testkilde: SynkKilde = {
  navn: "Testfil (data/entra-test.json)",
  async hentPersoner() {
    if (!fs.existsSync(TESTFIL)) {
      throw new Error("Fant ikke data/entra-test.json. Kopier scripts/entra-test.eksempel.json dit.");
    }
    let rå: unknown;
    try {
      rå = JSON.parse(fs.readFileSync(TESTFIL, "utf8"));
    } catch {
      throw new Error("data/entra-test.json er ikke gyldig JSON.");
    }
    const sjekket = sjekkKildePersoner(rå);
    if ("feil" in sjekket) throw new Error(sjekket.feil);
    return sjekket;
  },
};

/** Kilden synken bruker. Microsoft Graph kommer i Fase 32. */
export function aktivKilde(): SynkKilde {
  return testkilde;
}

export type SynkStatus = {
  /** ISO-tid for siste kjøring, vellykket eller ikke. Styrer når neste automatiske kjøring skjer. */
  sistForsøk: string | null;
  sistOk: string | null;
  ok: boolean | null;
  melding: string | null;
};

export function lesSynkStatus(): SynkStatus {
  const tom: SynkStatus = { sistForsøk: null, sistOk: null, ok: null, melding: null };
  if (!fs.existsSync(STATUSFIL)) return tom;
  try {
    return { ...tom, ...(JSON.parse(fs.readFileSync(STATUSFIL, "utf8")) as Partial<SynkStatus>) };
  } catch {
    return tom;
  }
}

function skrivSynkStatus(s: SynkStatus) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATUSFIL, JSON.stringify(s, null, 2) + "\n", "utf8");
}

/** Én linje i endringsloggen per kjøring. Endringene i personer har egne linjer fra `endreVaktliste`. */
function loggKjøring(tid: string, startetAv: string, kilde: SynkKilde, ok: boolean, melding: string) {
  try {
    skrivEndringer([
      {
        tid,
        endretAvId: SYNK_AVSENDER,
        endretAv: "Synk av ansatte",
        handling: "kjørt",
        tabell: "synk",
        radId: "synk",
        rad: ok ? "vellykket" : "feilet",
        felt: [
          { felt: "Startet av", gammel: null, ny: startetAv },
          { felt: "Kilde", gammel: null, ny: kilde.navn },
          { felt: "Utfall", gammel: null, ny: melding },
        ],
      },
    ]);
  } catch (e) {
    console.error("Skriving til endringsloggen feilet", e);
  }
}

async function synk(kilde: SynkKilde, startetAv: string): Promise<SynkStatus> {
  const tid = new Date().toISOString();
  const forrige = lesSynkStatus();
  let ok: boolean;
  let melding: string;
  try {
    const personer = await kilde.hentPersoner();
    // Fra her er alt synkront, så ingen annen lagring kommer mellom lesingen og `endreVaktliste`.
    const v = lesVaktliste();
    const resultat = anvendSynk(structuredClone(v), personer, tid);
    if (synkHarEndringer(resultat)) {
      const feil = endreVaktliste({ forventetRevisjon: v.revisjon, endretAv: SYNK_AVSENDER }, (ny) => {
        anvendSynk(ny, personer, tid);
        return null;
      });
      if (feil) throw new Error(feil);
    }
    ok = true;
    melding = beskrivSynk(resultat, personer.length);
  } catch (e) {
    console.error("Synk av ansatte feilet", e);
    ok = false;
    melding = e instanceof Error ? e.message : "Ukjent feil.";
  }
  const status: SynkStatus = { sistForsøk: tid, sistOk: ok ? tid : forrige.sistOk, ok, melding };
  skrivSynkStatus(status);
  loggKjøring(tid, startetAv, kilde, ok, melding);
  return status;
}

// To sidevisninger samtidig skal ikke starte to synker; den andre venter på den første.
let pågår: Promise<SynkStatus> | null = null;

/**
 * Kjører synken nå («Synk nå», eller når den er forfalt). `startetAv` står i loggen: navnet på
 * administratoren, eller «automatisk». Går en synk allerede, ventes det på den.
 */
export function kjørSynk(startetAv: string): Promise<SynkStatus> {
  pågår ??= synk(aktivKilde(), startetAv).finally(() => {
    pågår = null;
  });
  return pågår;
}

/** Kalles etter hver sidevisning: kjører synken bare når et planlagt tidspunkt er passert. */
export async function synkHvisForfalt(innstillinger: SynkInnstillinger): Promise<void> {
  if (!synkErForfalt(innstillinger, lesSynkStatus().sistForsøk, new Date())) return;
  await kjørSynk("automatisk");
}
