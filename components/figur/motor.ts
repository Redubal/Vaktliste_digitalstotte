import { gulv, oppdaterFlate, samleFlater, type Flate } from "./flater";
import { LEDD, type LeddNavn } from "./Tegning";

// Figuren lever i vinduskoordinater med føttene i (fx, fy). Én requestAnimationFrame-løkke flytter
// den og regner ut en stilling (leddvinkler) som skrives rett på SVG-en, uten React per bilde.
// Vinkler i grader, positiv = med klokka. Figuren ser mot høyre: negativ hofte/skulder = fram,
// positivt kne = leggen bakover, negativ albue = underarmen fram, positiv lean = lener seg fram.

type Modus = "star" | "gar" | "sats" | "luft" | "lander";

// Et sted figuren har bestemt seg for å komme seg opp på: går til `fra`, hopper og lander i `til`.
type Mal = { flate: Flate; fra: number; til: number };

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
};

const TYNGDE = 1400; // px/s²
const GANGFART = 34; // px/s
const SKRITT = 22; // px per hele gangsyklus
const MAKS_HOPP = 140; // px opp
const HOPP_SIDE = 70; // px sidelengs over et mellomrom
const KANTMARG = 12; // figuren holdes så langt inne fra vinduskanten
const OPPDATER_FLATER_MS = 500;

const tilfeldig = (fra: number, til: number) => fra + Math.random() * (til - fra);
const klem = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const STA: Stilling = {
  lean: 0, hode: 0, skA: 6, alA: -10, skB: -4, alB: -12,
  hoA: -2, knA: 2, hoB: 3, knB: 2, bob: 0, sx: 1, sy: 1,
};

// Sammenkrøpet: lår fram, legg bak, kroppen senket så føttene blir stående.
const KROK: Stilling = {
  lean: 16, hode: 6, skA: 30, alA: -25, skB: 22, alB: -25,
  hoA: -48, knA: 85, hoB: -40, knB: 75, bob: 3.8, sx: 1, sy: 1,
};

export function startMotor(lag: HTMLDivElement, fig: HTMLDivElement): () => void {
  const ledd = {} as Record<LeddNavn, SVGElement>;
  for (const navn of LEDD) {
    const el = fig.querySelector<SVGElement>(`[data-ledd="${navn}"]`);
    if (!el) return () => {};
    ledd[navn] = el;
  }

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
  let modusSlutt = 0;
  let fallFart = 0;
  let planlagtHopp = { vx: 0, vy: 0 };
  let mal: Mal | null = null;

  let fase = 0; // gangsyklus i radianer
  let hodeMal = 0;
  let nesteHode = 0;
  let nesteBlunk = performance.now() + tilfeldig(2000, 5000);
  let blunkTil = 0;

  const naa0 = performance.now();
  let sistTid = naa0;
  const s: Stilling = { ...STA };

  const settModus = (m: Modus, naa: number, varighet = 0) => {
    modus = m;
    modusSlutt = naa + varighet;
  };

  const sta = (naa: number) => settModus("star", naa, tilfeldig(1200, 3500));
  const ga = (naa: number) => settModus("gar", naa, tilfeldig(2500, 7000));

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

  // En høyere flate innen hopperekkevidde fra flaten den står på: hvor den hopper fra og lander.
  const finnMal = (): Mal | null => {
    if (!under) return null;
    const a = gangbar(under);
    const kandidater: Mal[] = [];
    for (const f of flater) {
      if (!f.el || f.el === under.el) continue;
      const hoyde = fy - f.y;
      if (hoyde < 14 || hoyde > MAKS_HOPP) continue;
      const b1 = Math.max(f.x1 + 8, KANTMARG);
      const b2 = Math.min(f.x2 - 8, window.innerWidth - KANTMARG);
      if (b2 <= b1) continue;
      const o1 = Math.max(a.x1, b1);
      const o2 = Math.min(a.x2, b2);
      if (o2 > o1) {
        // Flaten ligger over: hopp fra et punkt under og land litt lenger fram.
        const til = tilfeldig(o1, o2);
        const fra = klem(til + (Math.random() < 0.5 ? -24 : 24), a.x1, a.x2);
        kandidater.push({ flate: f, fra, til });
      } else if (b1 >= a.x2 && b1 - a.x2 <= HOPP_SIDE) {
        kandidater.push({ flate: f, fra: a.x2, til: b1 });
      } else if (b2 <= a.x1 && a.x1 - b2 <= HOPP_SIDE) {
        kandidater.push({ flate: f, fra: a.x1, til: b2 });
      }
    }
    return kandidater.length ? kandidater[Math.floor(Math.random() * kandidater.length)] : null;
  };

  const hoppTil = (m: Mal, naa: number) => {
    const f = oppdaterFlate(m.flate);
    if (!f) return;
    const hoyde = Math.max(14, fy - f.y);
    const vy0 = -Math.sqrt(2 * TYNGDE * (hoyde + 22));
    const tid = (-vy0 + Math.sqrt(vy0 * vy0 - 2 * TYNGDE * hoyde)) / TYNGDE;
    planlagtHopp = { vx: (m.til - fx) / tid, vy: vy0 };
    if (Math.abs(m.til - fx) > 2) retning = m.til > fx ? 1 : -1;
    settModus("sats", naa, 200);
  };

  const vedKant = (naa: number) => {
    if (!under) return;
    const a = gangbar(under);
    const vedVinduskant =
      !under.el ||
      (retning === 1 && a.x2 >= window.innerWidth - KANTMARG) ||
      (retning === -1 && a.x1 <= KANTMARG);
    const nyttMal = finnMal();
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

  // --- Stillinger ---

  const gangStilling = (): Stilling => {
    const sa = Math.sin(fase);
    const ca = Math.cos(fase);
    const sving = (c: number) => 8 + 42 * Math.max(0, c) ** 1.4;
    return {
      lean: 5,
      hode: 2 * Math.sin(fase * 2),
      skA: 22 * sa,
      alA: -16 - 8 * Math.max(0, -sa),
      skB: -22 * sa,
      alB: -16 - 8 * Math.max(0, sa),
      hoA: -26 * sa,
      knA: sving(ca),
      hoB: 26 * sa,
      knB: sving(-ca),
      bob: 1.3 * Math.abs(sa),
      sx: 1,
      sy: 1,
    };
  };

  const luftStilling = (t: number): Stilling => {
    if (vy < 120) {
      // På vei opp: armene over hodet, knærne trukket opp.
      return {
        lean: -4, hode: -8, skA: -150, alA: -15, skB: -165, alB: -15,
        hoA: -62, knA: 95, hoB: -45, knB: 70, bob: 0, sx: 1, sy: 1,
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
    };
  };

  const malStilling = (naa: number, t: number): Stilling => {
    switch (modus) {
      case "gar":
        return gangStilling();
      case "luft":
        return luftStilling(t);
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
      default:
        return {
          ...STA,
          hode: hodeMal,
          bob: 0.25 + 0.25 * Math.sin(t * 2.2),
          skA: STA.skA + 2 * Math.sin(t * 2.2),
          skB: STA.skB + 2 * Math.sin(t * 2.2 + 1),
        };
    }
  };

  // --- Tegning ---

  const vri = (navn: LeddNavn, grader: number, x: number, y: number) =>
    ledd[navn].setAttribute("transform", `rotate(${grader.toFixed(1)} ${x} ${y})`);

  const tegn = (naa: number) => {
    fig.style.transform = `translate3d(${(fx - 20).toFixed(1)}px, ${(fy - 40).toFixed(1)}px, 0)`;
    ledd.vend.setAttribute("transform", retning === 1 ? "" : "translate(40 0) scale(-1 1)");
    ledd.skygge.setAttribute("opacity", modus === "luft" ? "0" : "1");
    ledd.hele.setAttribute(
      "transform",
      `translate(0 ${s.bob.toFixed(2)}) translate(20 40) scale(${s.sx.toFixed(3)} ${s.sy.toFixed(3)}) translate(-20 -40)`,
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
    const lukket = naa < blunkTil ? 0.12 : 1;
    ledd.oye.setAttribute("transform", `translate(0 ${(8.7 * (1 - lukket)).toFixed(2)}) scale(1 ${lukket})`);
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

    switch (modus) {
      case "gar": {
        if (!under) break;
        if (mal) {
          // På vei til hoppestedet.
          if (Math.abs(mal.fra - fx) <= GANGFART * dt + 0.5) {
            fx = mal.fra;
            hoppTil(mal, naa);
            mal = null;
            break;
          }
          retning = mal.fra > fx ? 1 : -1;
        }
        const steg = retning * GANGFART * dt;
        const a = gangbar(under);
        const kant = retning === 1 ? a.x2 : a.x1;
        if ((retning === 1 && fx + steg >= kant) || (retning === -1 && fx + steg <= kant)) {
          fx = kant;
          vedKant(naa);
        } else {
          fx += steg;
          fase += (Math.abs(steg) / SKRITT) * Math.PI * 2;
          if (!mal && Math.random() < dt * 0.15) mal = finnMal();
          if (!mal && naa > modusSlutt) sta(naa);
        }
        break;
      }
      case "star":
        if (naa > nesteHode) {
          nesteHode = naa + tilfeldig(900, 2600);
          hodeMal = [-14, -6, 0, 0, 8][Math.floor(Math.random() * 5)];
          if (Math.random() < 0.25) retning = -retning;
        }
        if (naa > modusSlutt) {
          // På gulvet vil den nesten alltid opp igjen; oppe vandrer den oftere.
          if (Math.random() < (under?.el ? 0.45 : 0.9)) mal = finnMal();
          ga(naa);
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
        if (naa > modusSlutt) sta(naa);
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

    // Glid mot målstillingen; gangen følger syklusen tettere enn resten.
    const onsket = malStilling(naa, t);
    const k = 1 - Math.exp(-dt * (modus === "gar" || modus === "luft" ? 22 : 12));
    for (const nokkel of Object.keys(s) as (keyof Stilling)[]) {
      s[nokkel] += (onsket[nokkel] - s[nokkel]) * k;
    }

    fx = klem(fx, 10, Math.max(10, window.innerWidth - 10));
    tegn(naa);
  };

  tegn(naa0);
  ramme = requestAnimationFrame(tikk);

  return () => cancelAnimationFrame(ramme);
}
