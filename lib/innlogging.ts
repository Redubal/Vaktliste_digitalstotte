import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { OKT_COOKIE } from "./identitet";
import { database } from "./tilkobling";

/**
 * Pålogging med e-post og passord (Fase 45). Mellomløsning til Entra SSO (Fase 32–33).
 * Begrunnelser og kjente svakheter: `kunnskap/sikkerhet.md`, «Fase 45».
 */

/**
 * Passordet alle starter med og må bytte ved første innlogging. Fra miljøvariabelen
 * `STARTPASSORD` (`.env.local`), så det ikke ligger i git. Mangler den, kan ingen logge inn
 * første gang; de som har byttet passord, kan fortsatt.
 */
function startpassord(): string | null {
  const verdi = process.env.STARTPASSORD;
  return verdi ? verdi : null;
}

export const MIN_PASSORDLENGDE = 10;
const MAKS_PASSORDLENGDE = 200;
/** Gale forsøk på rad før kontoen får pause. */
export const MAKS_FEIL = 5;
const PAUSE_MS = 5 * 60_000;
const OKT_VARIGHET_MS = 7 * 24 * 3_600_000;

// scrypt: N = 2^15, r = 8 bruker 32 MiB per hash, akkurat over Node sin standardgrense.
const SCRYPT_N = 32_768;
const NOKKEL_LENGDE = 64;

function scryptNokkel(hemmelighet: string, salt: Buffer, n: number): Promise<Buffer> {
  return new Promise((ok, feil) =>
    scrypt(hemmelighet.normalize("NFC"), salt, NOKKEL_LENGDE, { N: n, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) =>
      e ? feil(e) : ok(k),
    ),
  );
}

async function lagHash(hemmelighet: string): Promise<string> {
  const salt = randomBytes(16);
  const nokkel = await scryptNokkel(hemmelighet, salt, SCRYPT_N);
  return `scrypt$${SCRYPT_N}$${salt.toString("base64")}$${nokkel.toString("base64")}`;
}

async function stemmer(hemmelighet: string, lagret: string): Promise<boolean> {
  const [navn, n, salt, hash] = lagret.split("$");
  if (navn !== "scrypt" || !n || !salt || !hash) return false;
  const forventet = Buffer.from(hash, "base64");
  const nokkel = await scryptNokkel(hemmelighet, Buffer.from(salt, "base64"), Number(n));
  return nokkel.length === forventet.length && timingSafeEqual(nokkel, forventet);
}

// --- Gale forsøk ---

export type Utfall = { ok: true; maaBytte: boolean } | { ok: false; melding: string };

const FEIL_INNLOGGING = { ok: false, melding: "Feil e-post eller passord." } as const satisfies Utfall;

function pause(sperretTil: number): Utfall {
  const minutter = Math.max(1, Math.ceil((sperretTil - Date.now()) / 60_000));
  return {
    ok: false,
    melding: `For mange gale forsøk. Vent ${minutter} ${minutter === 1 ? "minutt" : "minutter"} og prøv igjen.`,
  };
}

type InnloggingRad = { passordHash: string; maaBytte: number; feilForsok: number; sperretTil: string | null };

function hentRad(brukerId: string): InnloggingRad | undefined {
  return database()
    .prepare("SELECT passordHash, maaBytte, feilForsok, sperretTil FROM innlogging WHERE brukerId = ?")
    .get(brukerId) as unknown as InnloggingRad | undefined;
}

/**
 * Sjekker passordet til en kjent bruker og teller gale forsøk. Forsøket telles FØR passordet
 * sjekkes: ellers kan mange samtidige forsøk slippe forbi telleren mens scrypt regner.
 */
async function sjekkPassord(brukerId: string, oppgitt: string): Promise<Utfall> {
  const db = database();
  if (!hentRad(brukerId)) {
    const start = startpassord();
    if (!start) {
      console.error("STARTPASSORD mangler i miljøet; første innlogging er ikke mulig.");
      return { ok: false, melding: "Innloggingen er ikke satt opp ennå. Si fra til en administrator." };
    }
    db.prepare(
      `INSERT OR IGNORE INTO innlogging (brukerId, passordHash, maaBytte, feilForsok, sperretTil, endret)
       VALUES (?, ?, 1, 0, NULL, ?)`,
    ).run(brukerId, await lagHash(start), new Date().toISOString());
  }
  // Under en pause telles ikke forsøk. Når pausen er over, begynner telleren på nytt (1) og pausen
  // fjernes, uansett hva som sto i telleren: ellers sperres kontoen igjen ved første forsøk.
  // `sperretTil` er ISO-tid, så tekstsammenligning er tidssammenligning.
  const nå = new Date().toISOString();
  const talt = db
    .prepare(
      `UPDATE innlogging
       SET feilForsok = CASE WHEN sperretTil > ?1 THEN feilForsok
                             WHEN sperretTil IS NOT NULL THEN 1
                             ELSE feilForsok + 1 END,
           sperretTil = CASE WHEN sperretTil > ?1 THEN sperretTil ELSE NULL END
       WHERE brukerId = ?2 RETURNING feilForsok, sperretTil`,
    )
    .get(nå, brukerId) as unknown as { feilForsok: number; sperretTil: string | null };
  const sperret = talt.sperretTil ? Date.parse(talt.sperretTil) : 0;
  if (sperret > Date.now()) return pause(sperret);
  if (talt.feilForsok > MAKS_FEIL) return sperr(brukerId);

  const rad = hentRad(brukerId);
  if (rad && (await stemmer(oppgitt, rad.passordHash))) {
    db.prepare("UPDATE innlogging SET feilForsok = 0, sperretTil = NULL WHERE brukerId = ?").run(brukerId);
    return { ok: true, maaBytte: rad.maaBytte === 1 };
  }
  return talt.feilForsok >= MAKS_FEIL ? sperr(brukerId) : FEIL_INNLOGGING;
}

function sperr(brukerId: string): Utfall {
  const til = Date.now() + PAUSE_MS;
  database()
    .prepare("UPDATE innlogging SET feilForsok = 0, sperretTil = ? WHERE brukerId = ?")
    .run(new Date(til).toISOString(), brukerId);
  return pause(til);
}

// Adresser som ikke finnes, får samme svar og samme pause som ekte kontoer, så skjemaet ikke
// avslører hvem som har konto. Holdes i minnet: de er ikke kontoer, og tømmes ved omstart.
const g = globalThis as { ukjenteForsok?: Map<string, { feil: number; sperretTil: number }> };
const ukjente = (g.ukjenteForsok ??= new Map());
let attrapp: Promise<string> | null = null;

async function sjekkUkjent(epost: string, oppgitt: string): Promise<Utfall> {
  const nå = Date.now();
  const t = ukjente.get(epost) ?? { feil: 0, sperretTil: 0 };
  if (t.sperretTil > nå) return pause(t.sperretTil);
  t.feil += 1;
  ukjente.set(epost, t);
  // Like lang regnetid som for en ekte konto.
  await stemmer(oppgitt, await (attrapp ??= lagHash(randomBytes(16).toString("hex"))));
  if (t.feil < MAKS_FEIL) return FEIL_INNLOGGING;
  t.feil = 0;
  t.sperretTil = Date.now() + PAUSE_MS;
  return pause(t.sperretTil);
}

/** `brukerId` er `null` når e-posten ikke hører til en aktiv ansatt. `epost` er i små bokstaver. */
export function provInnlogging(brukerId: string | null, epost: string, oppgitt: string): Promise<Utfall> {
  if (oppgitt.length > MAKS_PASSORDLENGDE) return Promise.resolve(FEIL_INNLOGGING);
  return brukerId ? sjekkPassord(brukerId, oppgitt) : sjekkUkjent(epost, oppgitt);
}

/** Bytter passord. Gir feilmeldingen, eller `null` når passordet er byttet og økten fornyet. */
export async function byttPassord(brukerId: string, gammelt: string, nytt: string, gjenta: string): Promise<string | null> {
  if (nytt !== gjenta) return "De to nye passordene er ikke like.";
  if (nytt.length < MIN_PASSORDLENGDE) return `Det nye passordet må ha minst ${MIN_PASSORDLENGDE} tegn.`;
  if (nytt.length > MAKS_PASSORDLENGDE) return `Det nye passordet kan ha høyst ${MAKS_PASSORDLENGDE} tegn.`;
  if (nytt === startpassord() || nytt === gammelt) return "Velg et passord du ikke har brukt her før.";

  const sjekket = await sjekkPassord(brukerId, gammelt);
  if (!sjekket.ok) {
    return sjekket.melding === FEIL_INNLOGGING.melding ? "Nåværende passord er feil." : sjekket.melding;
  }

  const db = database();
  db.prepare("UPDATE innlogging SET passordHash = ?, maaBytte = 0, endret = ? WHERE brukerId = ?").run(
    await lagHash(nytt),
    new Date().toISOString(),
    brukerId,
  );
  // Alle andre økter for personen logges ut; denne får en ny økt-id.
  db.prepare("DELETE FROM okt WHERE brukerId = ?").run(brukerId);
  await opprettOkt(brukerId);
  return null;
}

// --- Økter ---

/** Databasen lagrer bare SHA-256 av økt-id-en, så en kopi av databasen ikke gir innlogging. */
const hashAv = (oktId: string) => createHash("sha256").update(oktId).digest("hex");

/** Lager en økt og setter kapselen. Bare fra en serverhandling: kapsler kan ikke settes under rendering. */
export async function opprettOkt(brukerId: string): Promise<void> {
  const oktId = randomBytes(32).toString("base64url");
  const nå = new Date();
  const utloper = new Date(nå.getTime() + OKT_VARIGHET_MS);
  const db = database();
  db.prepare("DELETE FROM okt WHERE utloper < ?").run(nå.toISOString());
  db.prepare("INSERT INTO okt (tokenHash, brukerId, opprettet, utloper) VALUES (?, ?, ?, ?)").run(
    hashAv(oktId),
    brukerId,
    nå.toISOString(),
    utloper.toISOString(),
  );
  (await cookies()).set(OKT_COOKIE, oktId, {
    httpOnly: true,
    sameSite: "lax",
    // `localhost` regnes som sikker også over http, så dette virker i `next start` og Docker lokalt.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: utloper,
  });
}

export async function avsluttOkt(): Promise<void> {
  const kapsler = await cookies();
  const oktId = kapsler.get(OKT_COOKIE)?.value;
  if (oktId) database().prepare("DELETE FROM okt WHERE tokenHash = ?").run(hashAv(oktId));
  kapsler.delete(OKT_COOKIE);
}

/** Økten i kapselen, sjekket mot databasen. Én gang per rendering (`cache`). */
export const lesOkt = cache(async (): Promise<{ brukerId: string; maaBytte: boolean } | null> => {
  const oktId = (await cookies()).get(OKT_COOKIE)?.value;
  if (!oktId) return null;
  const rad = database()
    .prepare(
      `SELECT o.brukerId, o.utloper, i.maaBytte FROM okt o
       JOIN innlogging i ON i.brukerId = o.brukerId WHERE o.tokenHash = ?`,
    )
    .get(hashAv(oktId)) as unknown as { brukerId: string; utloper: string; maaBytte: number } | undefined;
  if (!rad || Date.parse(rad.utloper) <= Date.now()) return null;
  return { brukerId: rad.brukerId, maaBytte: rad.maaBytte === 1 };
});
