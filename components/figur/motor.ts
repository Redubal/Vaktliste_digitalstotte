import { gulv, oppdaterFlate, samleFlater, type Flate } from "./flater";
import { lagPynt, SPRAYFARGER, type Bokstav } from "./pynt";
import { LEDD, type LeddNavn } from "./Tegning";

// Figuren lever i vinduskoordinater med føttene i (fx, fy). Én requestAnimationFrame-løkke flytter
// den og regner ut en stilling (leddvinkler) som skrives rett på SVG-en, uten React per bilde.
// Vinkler i grader, positiv = med klokka. Figuren ser mot høyre: negativ hofte/skulder = fram,
// positivt kne = leggen bakover, negativ albue = underarmen fram, positiv lean = lener seg fram.
// Musa leses med en passiv pointermove på vinduet; figuren tar aldri imot klikk.

type Modus =
  | "star" | "gar" | "sats" | "luft" | "lander"
  | "gjesp" | "sover" | "vakner"
  | "klatrer"
  | "graver" | "sprayer" | "bryter" | "sparker";

type Verktoy = "ingen" | "spade" | "spray" | "brekk";

// Noe figuren har bestemt seg for å gjøre et annet sted på flaten: går til `fra`, så `start`.
type Mal = { fra: number; start: (naa: number) => void };

// Klatring opp en sidekant. `side` er retningen mot veggen. `flate` er blokka den klatrer opp på
// (null = klatrer opp vinduskanten et stykke og hopper ned igjen). `vindu` = veggen er vinduskanten.
type Klatring = { side: number; flate: Flate | null; vindu: boolean; topp: number };

type Stilling = {
  lean: number;
  hode: number;
  skA: number;
  alA: number;
  skB: number;
  alB: number;
  hoA: number;
  knA: number;
  hoB: number;
  knB: number;
  bob: number; // nedover i px, så føttene står på flaten når beina er bøyd
  sx: number;
  sy: number;
  rot: number; // hele figuren, rundt hofta nede; -90 = ligger med hodet bakover
  munn: number; // 0 = lukket, 1 = vidåpen
};

const TYNGDE = 1400; // px/s²
const GANGFART = 34; // px/s
const FLUKTFART = 2.8; // ganger gangfarten
const SKRITT = 22; // px per hele gangsyklus
const MAKS_HOPP = 140; // px opp
const HOPP_SIDE = 70; // px sidelengs over et mellomrom
const KLATREFART = 40; // px/s
const MAKS_KLATRING = 500; // px opp
const KANTMARG = 12; // figuren holdes så langt inne fra vinduskanten
const OPPDATER_FLATER_MS = 500;
const SKREMME_AVSTAND = 70; // px fra musa til midt på figuren
const SE_AVSTAND = 320; // px: innenfor dette følger hodet musa
const MUS_AKTIV_MS = 5000; // så lenge etter siste musebevegelse følger hodet
const BOKSTAVBREDDE = 13;

const tilfeldig = (fra: number, til: number) => fra + Math.random() * (til - fra);
const klem = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const velg = <T,>(liste: T[]) => liste[Math.floor(Math.random() * liste.length)];

const STA: Stilling = {
  lean: 0, hode: 0, skA: 6, alA: -10, skB: -4, alB: -12,
  hoA: -2, knA: 2, hoB: 3, knB: 2, bob: 0, sx: 1, sy: 1, rot: 0, munn: 0,
};

// Sammenkrøpet: lår fram, legg bak, kroppen senket så føttene blir stående.
const KROK: Stilling = {
  lean: 16, hode: 6, skA: 30, alA: -25, skB: 22, alB: -25,
  hoA: -48, knA: 85, hoB: -40, knB: 75, bob: 3.8, sx: 1, sy: 1, rot: 0, munn: 0,
};

export function startMotor(lag: HTMLDivElement, fig: HTMLDivElement): () => void {
  const ledd = {} as Record<LeddNavn, SVGElement>;
  for (const navn of LEDD) {
    const el = fig.querySelector<SVGElement>(`[data-ledd="${navn}"]`);
    if (!el) return () => {};
    ledd[navn] = el;
  }

  const pynt = lagPynt(lag);
  let flater = samleFlater(lag);
  let sistOppdatert = performance.now();
  let dialogApen = false;

  // Figuren faller inn fra toppen et tilfeldig sted.
  let fx = tilfeldig(40, Math.max(41, window.innerWidth - 40));
  let fy = 0;
  let vx = 0;
  let vy = 0;
  let retning = Math.random() < 0.5 ? 1 : -1;
  let modus: Modus = "luft";
  let under: Flate | null = null;
  let modusStart = 0;
  let modusSlutt = 0;
  let fallFart = 0;
  let planlagtHopp = { vx: 0, vy: 0 };
  let mal: Mal | null = null;
  let klatring: Klatring | null = null;

  let fase = 0; // gang- og klatresyklus i radianer
  let hodeMal = 0;
  let nesteHode = 0;
  let nesteBlunk = performance.now() + tilfeldig(2000, 5000);
  let blunkTil = 0;

  const naa0 = performance.now();
  let sistTid = naa0;
  const s: Stilling = { ...STA };

  // Søvn og pønk: første gang etter et halvt minutt / noen sekunder, så sjeldnere.
  let nesteSovn = naa0 + tilfeldig(20000, 32000);
  let nestePonk = naa0 + tilfeldig(6000, 10000);
  let skalSove = false;
  let nesteZ = 0;
  let zStor = false;

  // Musa.
  let musX = -1e4;
  let musY = -1e4;
  let musTid = -1e9;
  let fluktTil = 0;
  let nesteSnu = 0;
  let blikk: number | null = null;

  // Pågående pønk.
  let verktoy: Verktoy = "ingen";
  let visVerktoy: Verktoy = "ingen";
  let sprayFarge = SPRAYFARGER[0];
  let sprayMal = { x: 0, y: 0 };
  let haug: { vokse(): void } | null = null;
  let gravSyklus = 0;
  let brekk: { side: number; bokstaver: Bokstav[]; neste: number } | null = null;
  let sparkB: Bokstav | null = null;
  let sparkGjort = false;

  const vedMus = (e: PointerEvent) => {
    musX = e.clientX;
    musY = e.clientY;
    musTid = performance.now();
  };
  const musUte = (e: PointerEvent) => {
    if (!e.relatedTarget) musTid = -1e9;
  };
  window.addEventListener("pointermove", vedMus, { passive: true });
  document.addEventListener("pointerout", musUte, { passive: true });

  const settModus = (m: Modus, naa: number, varighet = 0) => {
    modus = m;
    modusStart = naa;
    modusSlutt = naa + varighet;
  };

  const sta = (naa: number) => settModus("star", naa, tilfeldig(1200, 3500));
  const ga = (naa: number) => settModus("gar", naa, tilfeldig(2500, 7000));
  const flykter = (naa: number) => naa < fluktTil;

  const snu = (naa: number) => {
    retning = -retning;
    settModus("star", naa, tilfeldig(400, 1200));
  };

  const gaUtfor = () => {
    // Forbi kanten først, ellers lander den på samme flate igjen.
    if (under) fx = retning === 1 ? under.x2 + 3 : under.x1 - 3;
    under = null;
    mal = null;
    vx = retning * GANGFART * 1.4;
    vy = -60;
    modus = "luft";
  };

  // Gangbar del av flaten den står på: kantene, men aldri utenfor vinduet.
  const gangbar = (f: Flate) => ({
    x1: Math.max(f.x1 + 6, KANTMARG),
    x2: Math.min(f.x2 - 6, window.innerWidth - KANTMARG),
  });

  // --- Hopp ---

  const hoppTil = (flate: Flate, til: number, naa: number) => {
    const f = oppdaterFlate(flate);
    if (!f) return;
    const hoyde = Math.max(14, fy - f.y);
    const vy0 = -Math.sqrt(2 * TYNGDE * (hoyde + 22));
    const tid = (-vy0 + Math.sqrt(vy0 * vy0 - 2 * TYNGDE * hoyde)) / TYNGDE;
    planlagtHopp = { vx: (til - fx) / tid, vy: vy0 };
    if (Math.abs(til - fx) > 2) retning = til > fx ? 1 : -1;
    settModus("sats", naa, 200);
  };

  // Høyere flater innen hopperekkevidde fra flaten den står på: hvor den hopper fra og lander.
  const hoppMal = (): Mal[] => {
    if (!under) return [];
    const a = gangbar(under);
    const ut: Mal[] = [];
    for (const f of flater) {
      if (!f.el || f.el === under.el) continue;
      const hoyde = fy - f.y;
      if (hoyde < 14 || hoyde > MAKS_HOPP) continue;
      const b1 = Math.max(f.x1 + 8, KANTMARG);
      const b2 = Math.min(f.x2 - 8, window.innerWidth - KANTMARG);
      if (b2 <= b1) continue;
      const o1 = Math.max(a.x1, b1);
      const o2 = Math.min(a.x2, b2);
      let fra: number | null = null;
      let til = 0;
      if (o2 > o1) {
        // Flaten ligger over: hopp fra et punkt under og land litt lenger fram.
        til = tilfeldig(o1, o2);
        fra = klem(til + (Math.random() < 0.5 ? -24 : 24), a.x1, a.x2);
      } else if (b1 >= a.x2 && b1 - a.x2 <= HOPP_SIDE) {
        fra = a.x2;
        til = b1;
      } else if (b2 <= a.x1 && a.x1 - b2 <= HOPP_SIDE) {
        fra = a.x1;
        til = b2;
      }
      if (fra !== null) {
        const t = til;
        ut.push({ fra, start: (naa) => hoppTil(f, t, naa) });
      }
    }
    return ut;
  };

  // --- Klatring ---

  const veggX = (k: Klatring) => {
    if (k.vindu) return k.side === 1 ? window.innerWidth - 10 : 10;
    const f = k.flate as Flate;
    return k.side === 1 ? f.x1 - 6 : f.x2 + 6;
  };

  // Hvor den lander oppå blokka når den har klatret til toppen.
  const landX = (k: Klatring, f: Flate) => {
    if (k.vindu) return k.side === 1 ? f.x2 - 14 : f.x1 + 14;
    return k.side === 1 ? f.x1 + 12 : f.x2 - 12;
  };

  const klatre = (naa: number, k: Klatring) => {
    klatring = k;
    retning = k.side;
    under = null;
    mal = null;
    fx = veggX(k);
    settModus("klatrer", naa);
  };

  // Sidekanter på blokker som når ned til føttene og står innen rekkevidde på flaten.
  const veggMal = (): Mal[] => {
    if (!under) return [];
    const a = gangbar(under);
    const ut: Mal[] = [];
    for (const f of flater) {
      if (!f.el || f.el === under.el) continue;
      const hoyde = fy - f.y;
      if (hoyde < 30 || hoyde > MAKS_KLATRING || f.y2 < fy - 24) continue;
      const venstre = f.x1 - 6;
      if (venstre > a.x1 + 8 && venstre <= a.x2) {
        ut.push({ fra: venstre, start: (naa) => klatre(naa, { side: 1, flate: f, vindu: false, topp: f.y }) });
      }
      const hoyre = f.x2 + 6;
      if (hoyre < a.x2 - 8 && hoyre >= a.x1) {
        ut.push({ fra: hoyre, start: (naa) => klatre(naa, { side: -1, flate: f, vindu: false, topp: f.y }) });
      }
    }
    return ut;
  };

  // Opp vinduskanten: til en blokk som ligger inntil kanten, ellers et stykke opp og ned igjen.
  const klatreVindu = (naa: number) => {
    if (fy < 160) return false;
    const side = retning;
    const kandidater = flater.filter(
      (f) =>
        f.el &&
        fy - f.y >= 30 &&
        fy - f.y <= MAKS_KLATRING &&
        f.x2 - f.x1 >= 60 &&
        (side === 1 ? f.x2 >= window.innerWidth - 40 : f.x1 <= 40),
    );
    const f = kandidater.length ? velg(kandidater) : null;
    const topp = f ? f.y : fy - tilfeldig(70, Math.min(260, fy - 80));
    klatre(naa, { side, flate: f, vindu: true, topp });
    return true;
  };

  const velgMal = (): Mal | null => {
    const kandidater = [...hoppMal(), ...veggMal()];
    return kandidater.length ? velg(kandidater) : null;
  };

  const vedKant = (naa: number) => {
    if (!under) return;
    const a = gangbar(under);
    const vedVinduskant =
      !under.el ||
      (retning === 1 && a.x2 >= window.innerWidth - KANTMARG) ||
      (retning === -1 && a.x1 <= KANTMARG);
    if (vedVinduskant && !flykter(naa) && Math.random() < 0.45 && klatreVindu(naa)) return;
    const nyttMal = velgMal();
    const valg = Math.random();
    if (nyttMal && (vedVinduskant || valg < 0.5)) mal = nyttMal;
    else if (vedVinduskant || valg > 0.85) snu(naa);
    else gaUtfor();
  };

  const landPa = (f: Flate, naa: number) => {
    under = f;
    mal = null;
    fy = f.y;
    fallFart = vy;
    vx = 0;
    vy = 0;
    settModus("lander", naa, fallFart > 600 ? 380 : 220);
  };

  // --- Søvn ---

  const gjesp = (naa: number, sove: boolean) => {
    skalSove = sove;
    settModus("gjesp", naa, 2300);
  };

  // --- Pønk ---

  const avbrytPonk = () => {
    verktoy = "ingen";
    haug = null;
    if (brekk) for (const b of brekk.bokstaver) b.fast = false;
    brekk = null;
    sparkB = null;
  };

  // Hånda (eller tuppen av det den holder, `lengde` px forbi hånda) i vinduskoordinater.
  const fremreHand = (lengde: number) => {
    const r = Math.PI / 180;
    const dreid = (x: number, y: number, g: number) => [
      x * Math.cos(g * r) - y * Math.sin(g * r),
      x * Math.sin(g * r) + y * Math.cos(g * r),
    ];
    const [skx, sky] = dreid(0, -10.5, s.lean); // skulderen fra hofta (20, 25)
    const [ox, oy] = dreid(0, 5.5, s.lean + s.skB);
    const [ux, uy] = dreid(0, 5 + lengde, s.lean + s.skB + s.alB);
    return { x: fx + (skx + ox + ux) * retning, y: fy - 15 + sky + oy + uy + s.bob };
  };

  const spray = (naa: number) => {
    if (!under) return false;
    let mx = fx + retning * 30;
    if (mx < 20 || mx > window.innerWidth - 20) {
      retning = -retning;
      mx = fx + retning * 30;
    }
    sprayFarge = velg(SPRAYFARGER);
    sprayMal = { x: mx, y: fy - 26 };
    pynt.merke(sprayMal.x, sprayMal.y, under.el, sprayFarge);
    verktoy = "spray";
    settModus("sprayer", naa, 2300);
    return true;
  };

  // Spaden brukes bare på gulvet (vinduets bunn).
  const grav = (naa: number) => {
    if (!under || under.el) return false;
    let hx = fx - retning * 22;
    if (hx < 20 || hx > window.innerWidth - 20) {
      retning = -retning;
      hx = fx - retning * 22;
    }
    haug = pynt.haug(hx);
    gravSyklus = 0;
    verktoy = "spade";
    settModus("graver", naa, 4000);
    return true;
  };

  // Bokstavene P-U-N-K legges ved en kant av blokka og brytes løs én og én mot kanten.
  const bryt = (naa: number, side: number) => {
    if (!under) return;
    const kant = side === 1 ? under.x2 : under.x1;
    const tegn = side === 1 ? ["K", "N", "U", "P"] : ["P", "U", "N", "K"];
    const xs = tegn.map((_, i) => kant - side * (8 + BOKSTAVBREDDE * i));
    retning = side;
    brekk = { side, bokstaver: pynt.leggBokstaver(tegn, xs, under), neste: naa + 700 };
    verktoy = "brekk";
    settModus("bryter", naa, 700 + 4 * 650 + 300);
  };

  const brekkMal = (): Mal | null => {
    if (!under?.el) return null;
    const f = under;
    const a = gangbar(f);
    const sider = [1, -1].filter((side) => {
      const kant = side === 1 ? f.x2 : f.x1;
      if (kant < 20 || kant > window.innerWidth - 20) return false;
      const fra = kant - side * (8 + BOKSTAVBREDDE * 4 + 12);
      return fra >= a.x1 && fra <= a.x2;
    });
    if (!sider.length) return null;
    const side = velg(sider);
    const kant = side === 1 ? f.x2 : f.x1;
    return { fra: kant - side * (8 + BOKSTAVBREDDE * 4 + 12), start: (naa) => bryt(naa, side) };
  };

  const spark = (naa: number, b: Bokstav) => {
    retning = b.x >= fx ? 1 : -1;
    sparkB = b;
    sparkGjort = false;
    settModus("sparker", naa, 500);
  };

  const sparkMal = (b: Bokstav): Mal | null => {
    if (!under) return null;
    const a = gangbar(under);
    const side = b.x >= fx ? 1 : -1;
    return { fra: klem(b.x - side * 11, a.x1, a.x2), start: (naa) => spark(naa, b) };
  };

  const startPonk = (naa: number) => {
    if (!under) return false;
    nestePonk = naa + tilfeldig(8000, 16000);
    const valg: { vekt: number; gjor: () => boolean }[] = [{ vekt: 1, gjor: () => spray(naa) }];
    if (!under.el) valg.push({ vekt: 1.5, gjor: () => grav(naa) });
    // Brekkjern og spark skjer et annet sted på flaten: gå dit først.
    const gaTil = (m: Mal) => () => {
      mal = m;
      ga(naa);
      return true;
    };
    const kant = brekkMal();
    if (kant) valg.push({ vekt: 1.5, gjor: gaTil(kant) });
    const b = pynt.bokstavNaer(under.el, fx, 160);
    const tilSpark = b && sparkMal(b);
    if (tilSpark) valg.push({ vekt: 2, gjor: gaTil(tilSpark) });
    let r = Math.random() * valg.reduce((sum, v) => sum + v.vekt, 0);
    for (const v of valg) {
      r -= v.vekt;
      if (r <= 0) return v.gjor();
    }
    return valg[0].gjor();
  };

  // --- Musa ---

  const skremt = (naa: number) => {
    avbrytPonk();
    if (modus === "klatrer" && klatring) {
      // Slipper taket og faller ned fra veggen.
      retning = -klatring.side;
      vx = retning * 90;
      vy = -150;
    } else {
      retning = musX > fx ? -1 : 1;
      vx = retning * 30;
      vy = -360;
    }
    under = null;
    mal = null;
    klatring = null;
    modus = "luft";
    fluktTil = naa + 2600;
    nesteSovn = Math.max(nesteSovn, naa + 20000);
  };

  const KAN_SKREMMES: Modus[] = [
    "star", "gar", "gjesp", "sover", "vakner", "klatrer", "graver", "sprayer", "bryter", "sparker",
  ];

  const sjekkMus = (naa: number) => {
    blikk = null;
    if (naa - musTid > MUS_AKTIV_MS) return;
    const dx = musX - fx;
    const dy = musY - (fy - 20);
    if (naa - musTid < 250 && !flykter(naa) && KAN_SKREMMES.includes(modus) && Math.hypot(dx, dy) < SKREMME_AVSTAND) {
      skremt(naa);
      return;
    }
    if (modus !== "star" && modus !== "gar") return;
    const hx = (musX - fx) * retning;
    const hy = musY - (fy - 31);
    if (Math.hypot(hx, hy) > SE_AVSTAND) return;
    if (hx < -10) {
      // Bak seg: snur seg mot musa når den står.
      if (modus === "star" && naa > nesteSnu) {
        retning = -retning;
        nesteSnu = naa + 1200;
      }
      return;
    }
    blikk = klem((Math.atan2(hy, Math.max(hx, 1)) * 180) / Math.PI, -35, 35);
  };

  // --- Stillinger ---

  const gangStilling = (fart: number): Stilling => {
    const sa = Math.sin(fase);
    const ca = Math.cos(fase);
    const m = fart > 1 ? 1.35 : 1;
    const sving = (c: number) => 8 + 42 * m * Math.max(0, c) ** 1.4;
    return {
      lean: fart > 1 ? 14 : 5,
      hode: blikk ?? 2 * Math.sin(fase * 2),
      skA: 22 * m * sa,
      alA: -16 - 8 * Math.max(0, -sa),
      skB: -22 * m * sa,
      alB: -16 - 8 * Math.max(0, sa),
      hoA: -26 * m * sa,
      knA: sving(ca),
      hoB: 26 * m * sa,
      knB: sving(-ca),
      bob: 1.3 * Math.abs(sa),
      sx: 1,
      sy: 1,
      rot: 0,
      munn: fart > 1 ? 0.7 : 0,
    };
  };

  const luftStilling = (t: number, naa: number): Stilling => {
    const munn = flykter(naa) ? 0.8 : 0;
    if (vy < 120) {
      // På vei opp: armene over hodet, knærne trukket opp.
      return {
        lean: -4, hode: -8, skA: -150, alA: -15, skB: -165, alB: -15,
        hoA: -62, knA: 95, hoB: -45, knB: 70, bob: 0, sx: 1, sy: 1, rot: 0, munn,
      };
    }
    // Faller: armene viftende over hodet, beina sparker.
    return {
      lean: -6,
      hode: -12,
      skA: -135 + 28 * Math.sin(t * 17),
      alA: -30 + 15 * Math.sin(t * 13),
      skB: -115 + 28 * Math.sin(t * 17 + 2.1),
      alB: -35,
      hoA: -28 + 18 * Math.sin(t * 12),
      knA: 45,
      hoB: 18 - 18 * Math.sin(t * 12),
      knB: 25,
      bob: 0,
      sx: 1,
      sy: 1,
      rot: 0,
      munn,
    };
  };

  const malStilling = (naa: number, t: number): Stilling => {
    const e = naa - modusStart;
    switch (modus) {
      case "gar":
        return gangStilling(flykter(naa) ? FLUKTFART : 1);
      case "luft":
        return luftStilling(t, naa);
      case "sats":
        return { ...KROK, skA: 40, skB: 32 };
      case "lander": {
        const hardt = fallFart > 600;
        return {
          ...KROK,
          skA: -55,
          alA: -30,
          skB: -45,
          alB: -30,
          sx: hardt ? 1.16 : 1.07,
          sy: hardt ? 0.84 : 0.94,
        };
      }
      case "gjesp":
        // Strekker armene over hodet med åpen munn.
        return {
          ...STA, lean: -8, hode: -22, skA: -165, alA: -10, skB: -172, alB: -8,
          sy: 1.04, munn: e > 300 && e < 1900 ? 1 : 0,
        };
      case "sover":
        // Ligger på siden med knærne trukket opp og puster.
        return {
          lean: 10, hode: 14, skA: 30, alA: -70, skB: 20, alB: -80,
          hoA: -60, knA: 90, hoB: -50, knB: 85, bob: 0,
          sx: 1 + 0.04 * Math.sin(t * 1.8), sy: 1, rot: -90, munn: 0,
        };
      case "vakner":
        return { ...STA, hode: -10 };
      case "klatrer": {
        const c = Math.sin(fase);
        return {
          lean: 0, hode: -18,
          skA: -155 + 25 * c, alA: -15, skB: -155 - 25 * c, alB: -15,
          hoA: -50 - 22 * c, knA: 75, hoB: -50 + 22 * c, knB: 75,
          bob: 0, sx: 1, sy: 1, rot: 0, munn: 0,
        };
      }
      case "graver": {
        // Spaden ned i bakken, så opp og jorda bakover over skulderen.
        const ned = (e % 800) / 800 < 0.5;
        return {
          ...KROK,
          lean: ned ? 28 : 8, hode: 10,
          skA: ned ? -20 : -70, alA: -25, skB: ned ? -12 : -80, alB: -15,
          hoA: -30, knA: 40, hoB: 10, knB: 15, bob: 1.5,
        };
      }
      case "sprayer":
        return {
          ...STA, lean: -2, hode: -4,
          skA: 15, alA: -20, skB: -92 + 4 * Math.sin(t * 25), alB: -4,
        };
      case "bryter": {
        const v = 15 * Math.sin(t * 9);
        return {
          ...KROK, lean: 18, hode: 12,
          skA: -30 + v, alA: -20, skB: -38 + v, alB: -25,
          hoA: -40, knA: 60, hoB: -10, knB: 30, bob: 2.4,
        };
      }
      case "sparker": {
        const fram = e > 120 && e < 380;
        return {
          ...STA,
          lean: fram ? -10 : 6,
          skA: fram ? 40 : -10,
          skB: fram ? -45 : 20,
          hoA: 4,
          knA: 6,
          hoB: fram ? -80 : 25,
          knB: fram ? 8 : 40,
        };
      }
      default:
        return {
          ...STA,
          hode: blikk ?? hodeMal,
          bob: 0.25 + 0.25 * Math.sin(t * 2.2),
          skA: STA.skA + 2 * Math.sin(t * 2.2),
          skB: STA.skB + 2 * Math.sin(t * 2.2 + 1),
        };
    }
  };

  // Hvor fort stillingen glir mot målet: rask i bevegelse, langsom når den legger seg.
  const glid = () => {
    switch (modus) {
      case "gar":
      case "luft":
      case "klatrer":
      case "sparker":
        return 22;
      case "sover":
        return 3.5;
      case "vakner":
        return 6;
      default:
        return 12;
    }
  };

  // --- Tegning ---

  const vri = (navn: LeddNavn, grader: number, x: number, y: number) =>
    ledd[navn].setAttribute("transform", `rotate(${grader.toFixed(1)} ${x} ${y})`);

  const tegn = (naa: number) => {
    fig.style.transform = `translate3d(${(fx - 20).toFixed(1)}px, ${(fy - 40).toFixed(1)}px, 0)`;
    ledd.vend.setAttribute("transform", retning === 1 ? "" : "translate(40 0) scale(-1 1)");
    ledd.skygge.setAttribute("opacity", modus === "luft" || modus === "klatrer" ? "0" : "1");
    ledd.hele.setAttribute(
      "transform",
      `translate(0 ${s.bob.toFixed(2)}) rotate(${s.rot.toFixed(1)} 20 35.5) ` +
        `translate(20 40) scale(${s.sx.toFixed(3)} ${s.sy.toFixed(3)}) translate(-20 -40)`,
    );
    vri("overkropp", s.lean, 20, 25);
    vri("hode", s.hode, 20, 14);
    vri("armAOver", s.skA, 20, 14.5);
    vri("armAUnder", s.alA, 20, 20);
    vri("armBOver", s.skB, 20, 14.5);
    vri("armBUnder", s.alB, 20, 20);
    vri("beinAOver", s.hoA, 20, 25);
    vri("beinAUnder", s.knA, 20, 32.5);
    vri("beinBOver", s.hoB, 20, 25);
    vri("beinBUnder", s.knB, 20, 32.5);
    const sover = modus === "sover" || modus === "gjesp" || (modus === "vakner" && naa < modusStart + 450);
    const lukket = sover || naa < blunkTil ? 0.12 : 1;
    ledd.oye.setAttribute("transform", `translate(0 ${(8.7 * (1 - lukket)).toFixed(2)}) scale(1 ${lukket})`);
    const m = Math.max(0.01, s.munn);
    ledd.munn.setAttribute("opacity", s.munn > 0.05 ? "1" : "0");
    ledd.munn.setAttribute("transform", `translate(23 12.2) scale(${m.toFixed(2)}) translate(-23 -12.2)`);
    if (verktoy !== visVerktoy) {
      for (const v of ["spade", "spray", "brekk"] as const) {
        ledd[v].setAttribute("display", v === verktoy ? "inline" : "none");
      }
      visVerktoy = verktoy;
    }
  };

  // --- Løkka ---

  let ramme = 0;

  const tikk = (naa: number) => {
    ramme = requestAnimationFrame(tikk);
    if (document.hidden) {
      sistTid = naa;
      return;
    }
    const dt = Math.min(0.05, (naa - sistTid) / 1000);
    sistTid = naa;
    const t = (naa - naa0) / 1000;

    if (naa - sistOppdatert > OPPDATER_FLATER_MS) {
      sistOppdatert = naa;
      dialogApen = document.querySelector("dialog[open]") !== null;
      lag.style.visibility = dialogApen ? "hidden" : "visible";
      if (!dialogApen) flater = samleFlater(lag);
    }
    if (dialogApen) return;

    // Står den på noe, følg flaten (rulling) eller fall hvis den er borte.
    if (modus !== "luft" && under) {
      const ny = oppdaterFlate(under);
      if (!ny || fx < ny.x1 - 4 || fx > ny.x2 + 4) {
        avbrytPonk();
        under = null;
        mal = null;
        vx = modus === "gar" ? retning * GANGFART : 0;
        vy = 0;
        modus = "luft";
      } else {
        under = ny;
        fy = ny.y;
      }
    }

    sjekkMus(naa);

    switch (modus) {
      case "gar": {
        if (!under) break;
        const fart = GANGFART * (flykter(naa) ? FLUKTFART : 1);
        if (mal) {
          // På vei til der den skal gjøre noe.
          if (Math.abs(mal.fra - fx) <= fart * dt + 0.5) {
            fx = mal.fra;
            const m = mal;
            mal = null;
            m.start(naa);
            break;
          }
          retning = mal.fra > fx ? 1 : -1;
        }
        const steg = retning * fart * dt;
        const a = gangbar(under);
        const kant = retning === 1 ? a.x2 : a.x1;
        if ((retning === 1 && fx + steg >= kant) || (retning === -1 && fx + steg <= kant)) {
          fx = kant;
          vedKant(naa);
        } else {
          fx += steg;
          fase += (Math.abs(steg) / SKRITT) * Math.PI * 2;
          if (!mal && !flykter(naa) && Math.random() < dt * 0.15) mal = velgMal();
          if (!mal && naa > modusSlutt) sta(naa);
        }
        break;
      }
      case "star":
        if (naa > nesteHode) {
          nesteHode = naa + tilfeldig(900, 2600);
          hodeMal = [-14, -6, 0, 0, 8][Math.floor(Math.random() * 5)];
          if (blikk === null && Math.random() < 0.25) retning = -retning;
        }
        if (naa > modusSlutt) {
          if (under && naa > nesteSovn) {
            gjesp(naa, true);
            break;
          }
          if (under && naa > nestePonk && startPonk(naa)) break;
          if (under && Math.random() < 0.08) {
            gjesp(naa, false);
            break;
          }
          // På gulvet vil den nesten alltid opp igjen; oppe vandrer den oftere.
          if (Math.random() < (under?.el ? 0.45 : 0.9)) mal = velgMal();
          ga(naa);
        }
        break;
      case "gjesp":
        if (naa > modusSlutt) {
          if (skalSove) {
            settModus("sover", naa, tilfeldig(10000, 16000));
            nesteSovn = naa + tilfeldig(60000, 90000);
            nesteZ = naa + 900;
          } else {
            sta(naa);
          }
        }
        break;
      case "sover":
        if (naa > nesteZ) {
          // Hodet ligger bak føttene når den sover.
          pynt.zz(fx - retning * 24, fy - 18, zStor);
          zStor = !zStor;
          nesteZ = naa + 900;
        }
        if (naa > modusSlutt) settModus("vakner", naa, 900);
        break;
      case "vakner":
        if (naa > modusSlutt) sta(naa);
        break;
      case "klatrer": {
        const k = klatring;
        if (!k) {
          modus = "luft";
          break;
        }
        if (k.flate) {
          const ny = oppdaterFlate(k.flate);
          if (!ny) {
            // Blokka er borte: faller ned.
            klatring = null;
            vx = -k.side * 40;
            vy = 0;
            modus = "luft";
            break;
          }
          if (!k.vindu) fy += ny.y - k.flate.y; // siden rullet: følg veggen
          k.flate = ny;
          k.topp = ny.y;
        }
        fx = veggX(k);
        fy -= KLATREFART * dt;
        fase += dt * 7;
        if (fy <= k.topp) {
          fy = k.topp;
          klatring = null;
          if (k.flate) {
            // Et lite hopp innover og ned på blokka.
            const til = landX(k, k.flate);
            vx = (til - fx) / 0.286;
            vy = -200;
            retning = til >= fx ? 1 : -1;
          } else {
            retning = -k.side;
            vx = retning * 90;
            vy = -220;
          }
          modus = "luft";
        }
        break;
      }
      case "graver": {
        const e = naa - modusStart;
        const syklus = Math.floor(e / 800);
        if ((e % 800) / 800 >= 0.5 && syklus >= gravSyklus) {
          gravSyklus = syklus + 1;
          for (let i = 0; i < 5; i++) {
            pynt.jord(fx + retning * 14, fy - 3, -retning * tilfeldig(50, 150), -tilfeldig(220, 360));
          }
          haug?.vokse();
        }
        if (naa > modusSlutt) {
          avbrytPonk();
          sta(naa);
        }
        break;
      }
      case "sprayer":
        if (naa - modusStart > 250 && Math.random() < 0.7) {
          const p = fremreHand(5.5);
          pynt.prikk(
            p.x, p.y,
            (sprayMal.x - p.x) / 0.25 + tilfeldig(-40, 40),
            (sprayMal.y - p.y) / 0.25 + tilfeldig(-40, 40),
            sprayFarge,
          );
        }
        if (naa > modusSlutt) {
          avbrytPonk();
          sta(naa);
        }
        break;
      case "bryter":
        if (brekk && naa > brekk.neste) {
          const b = brekk.bokstaver.shift();
          if (b) pynt.slipp(b, brekk.side * tilfeldig(140, 180));
          brekk.neste = naa + 650;
        }
        if (naa > modusSlutt) {
          avbrytPonk();
          sta(naa);
        }
        break;
      case "sparker":
        if (!sparkGjort && naa - modusStart > 170) {
          sparkGjort = true;
          const b = sparkB;
          if (b && pynt.finnes(b) && b.pa && Math.abs(b.x - fx) < 24) {
            pynt.spark(b, retning * tilfeldig(170, 260), -tilfeldig(260, 400));
          }
        }
        if (naa > modusSlutt) {
          avbrytPonk();
          sta(naa);
        }
        break;
      case "sats":
        if (naa > modusSlutt) {
          under = null;
          vx = planlagtHopp.vx;
          vy = planlagtHopp.vy;
          retning = vx >= 0 ? 1 : -1;
          modus = "luft";
        }
        break;
      case "lander":
        if (naa > modusSlutt) {
          if (flykter(naa)) {
            // Løper vekk fra musa.
            retning = musX > fx ? -1 : 1;
            settModus("gar", naa, fluktTil - naa);
          } else {
            sta(naa);
          }
        }
        break;
      case "luft": {
        vy += TYNGDE * dt;
        let nx = fx + vx * dt;
        const ny = fy + vy * dt;
        if (nx < 10 || nx > window.innerWidth - 10) {
          nx = klem(nx, 10, window.innerWidth - 10);
          vx = -vx * 0.3;
        }
        if (vy > 0) {
          let treff: Flate | null = null;
          for (const f of flater) {
            if (nx < f.x1 || nx > f.x2 || f.y < fy || f.y > ny) continue;
            if (!treff || f.y < treff.y) treff = f;
          }
          if (!treff && ny >= window.innerHeight) treff = gulv();
          if (treff) {
            fx = nx;
            landPa(treff, naa);
            break;
          }
        }
        fx = nx;
        fy = ny;
        break;
      }
    }

    if (naa > nesteBlunk) {
      blunkTil = naa + 130;
      nesteBlunk = naa + tilfeldig(2200, 5500);
    }

    // Glid mot målstillingen.
    const onsket = malStilling(naa, t);
    const k = 1 - Math.exp(-dt * glid());
    for (const nokkel of Object.keys(s) as (keyof Stilling)[]) {
      s[nokkel] += (onsket[nokkel] - s[nokkel]) * k;
    }

    fx = klem(fx, 10, Math.max(10, window.innerWidth - 10));
    pynt.oppdater(dt, naa, flater);
    tegn(naa);
  };

  tegn(naa0);
  ramme = requestAnimationFrame(tikk);

  return () => {
    cancelAnimationFrame(ramme);
    window.removeEventListener("pointermove", vedMus);
    document.removeEventListener("pointerout", musUte);
    pynt.fjern();
  };
}
