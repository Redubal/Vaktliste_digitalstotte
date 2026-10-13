import { gulv, oppdaterFlate, type Flate } from "./flater";

// Det figuren etterlater seg: z-er når den sover, spraymerker, jord og jordhaug, og løse bokstaver
// som brytes løs, faller, spretter og kan sparkes. Alt er egne elementer i figurlaget
// (pointer-events: none), aldri tekst i siden. Merker og bokstaver følger flaten de ligger på.

export type Bokstav = {
  el: HTMLSpanElement;
  x: number; // midt under bokstaven, i vinduskoordinater
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  pa: Flate | null; // flaten den ligger på; null = i lufta
  dx: number; // avstand fra flatens venstre kant mens den ligger, så den følger rulling
  fast: boolean; // sitter fast til brekkjernet slipper den
  slutt: number;
};

type Merke = { el: HTMLElement; anker: Element | null; dx: number; dy: number; slutt: number };
type Partikkel = { el: HTMLElement; x: number; y: number; vx: number; vy: number; g: number; slutt: number };
type Haug = { el: HTMLElement; b: number; h: number; slutt: number };

export type Pynt = ReturnType<typeof lagPynt>;

const TYNGDE = 1400;
const MAKS_BOKSTAVER = 16;
const MAKS_MERKER = 6;
const MAKS_PARTIKLER = 80;
const MAKS_HAUGER = 4;
const BOKSTAV_LEVETID = 45000;
const MERKE_LEVETID = 40000;
const HAUG_LEVETID = 30000;
const FORSVINN_MS = 1500;

export const SPRAYFARGER = ["#e6007e", "#00a19a", "#f2b800", "#ff4f1f", "#5b3fd1"];

// Tegnet i en 30×30-rute: anarki-A i ring, lyn, smilefjes med kryssøyne.
const MERKER = [
  "M15 2.5a12.5 12.5 0 1 0 0.01 0 M7.5 25 L15 4.5 L22.5 25 M9.5 18 H20.5",
  "M18 2 L8 16 H15 L11 28 L23 12 H16 Z",
  "M15 2.5a12.5 12.5 0 1 0 0.01 0 M10 10 l3.5 3.5 m0 -3.5 l-3.5 3.5 M16.5 10 l3.5 3.5 m0 -3.5 l-3.5 3.5 M9 19.5 q6 5 12 0",
];

export function lagPynt(lag: HTMLElement) {
  const rot = document.createElement("div");
  rot.className = "figur-pynt";
  // Først i laget, så figuren tegnes foran det den lager.
  lag.insertBefore(rot, lag.firstChild);

  const bokstaver: Bokstav[] = [];
  const merker: Merke[] = [];
  const partikler: Partikkel[] = [];
  const hauger: Haug[] = [];

  const nytt = <K extends keyof HTMLElementTagNameMap>(tag: K, klasse: string) => {
    const el = document.createElement(tag);
    el.className = klasse;
    rot.appendChild(el);
    return el;
  };

  const forsvinn = (el: HTMLElement) => {
    el.classList.add("figur-forsvinn");
    window.setTimeout(() => el.remove(), FORSVINN_MS);
  };

  const plasser = (el: HTMLElement, x: number, y: number, grader = 0) => {
    el.style.transform =
      `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` + (grader ? ` rotate(${grader.toFixed(1)}deg)` : "");
  };

  const partikkel = (
    klasse: string, x: number, y: number, vx: number, vy: number, g: number, levetid: number, farge?: string,
  ) => {
    if (partikler.length >= MAKS_PARTIKLER) partikler.shift()?.el.remove();
    const el = nytt("div", klasse);
    if (farge) el.style.background = farge;
    partikler.push({ el, x, y, vx, vy, g, slutt: performance.now() + levetid });
    plasser(el, x, y);
  };

  const tegnBokstav = (b: Bokstav) => plasser(b.el, b.x - 6, b.y - 16, b.rot);

  const settStorrelse = (h: Haug) => {
    h.el.style.width = `${h.b}px`;
    h.el.style.height = `${h.h}px`;
  };

  const oppdaterBokstav = (b: Bokstav, dt: number, flater: Flate[]) => {
    if (b.pa) {
      const f = oppdaterFlate(b.pa);
      if (!f) {
        b.pa = null;
        b.vy = 0;
      } else {
        b.pa = f;
        if (b.vx !== 0) {
          // Glir langs flaten og bremser.
          b.dx += b.vx * dt;
          b.rot += b.vx * dt * 2;
          b.vx *= Math.exp(-dt * 1.6);
          if (Math.abs(b.vx) < 6) b.vx = 0;
        }
        b.x = f.x1 + b.dx;
        b.y = f.y;
        if (b.x < f.x1 - 2 || b.x > f.x2 + 2) {
          // Over kanten.
          b.pa = null;
          b.vy = 0;
          b.vrot = (b.vx >= 0 ? 1 : -1) * 260;
        } else if (b.vx === 0) {
          // Legg seg på en side.
          const mal = Math.round(b.rot / 90) * 90;
          b.rot += (mal - b.rot) * Math.min(1, dt * 10);
        }
      }
    }
    if (!b.pa) {
      b.vy += TYNGDE * dt;
      let nx = b.x + b.vx * dt;
      const ny = b.y + b.vy * dt;
      if (nx < 6 || nx > window.innerWidth - 6) {
        nx = Math.max(6, Math.min(window.innerWidth - 6, nx));
        b.vx = -b.vx * 0.5;
      }
      b.rot += b.vrot * dt;
      let treff: Flate | null = null;
      if (b.vy > 0) {
        for (const f of flater) {
          if (nx < f.x1 || nx > f.x2 || f.y < b.y || f.y > ny) continue;
          if (!treff || f.y < treff.y) treff = f;
        }
        if (!treff && ny >= window.innerHeight) treff = gulv();
      }
      b.x = nx;
      if (treff) {
        b.y = treff.y;
        if (b.vy > 170) {
          // Sprett.
          b.vy = -b.vy * 0.42;
          b.vx *= 0.6;
          b.vrot *= 0.5;
        } else {
          b.pa = treff;
          b.dx = b.x - treff.x1;
          b.vy = 0;
          b.vx *= 0.3;
        }
      } else {
        b.y = ny;
      }
    }
    tegnBokstav(b);
  };

  return {
    zz(x: number, y: number, stor: boolean) {
      const el = nytt("span", "figur-z");
      el.textContent = stor ? "Z" : "z";
      el.style.left = `${x.toFixed(1)}px`;
      el.style.top = `${y.toFixed(1)}px`;
      el.addEventListener("animationend", () => el.remove());
    },

    prikk(x: number, y: number, vx: number, vy: number, farge: string) {
      partikkel("figur-prikk", x, y, vx, vy, 0, 260, farge);
    },

    jord(x: number, y: number, vx: number, vy: number) {
      partikkel("figur-jord", x, y, vx, vy, TYNGDE, 1600);
    },

    // Et spraymerke med midtpunkt (x, y). Ligger det på en blokk, følger det blokka ved rulling.
    merke(x: number, y: number, anker: Element | null, farge: string) {
      if (merker.length >= MAKS_MERKER) {
        const gammel = merker.shift();
        if (gammel) forsvinn(gammel.el);
      }
      const el = nytt("div", "figur-merke");
      const d = MERKER[Math.floor(Math.random() * MERKER.length)];
      el.innerHTML = `<svg viewBox="0 0 30 30" width="30" height="30"><path d="${d}" pathLength="1" stroke="${farge}"/></svg>`;
      let dx = x;
      let dy = y;
      if (anker) {
        const r = anker.getBoundingClientRect();
        dx = x - r.left;
        dy = y - r.top;
      }
      merker.push({ el, anker, dx, dy, slutt: performance.now() + MERKE_LEVETID });
      plasser(el, x - 15, y - 15);
    },

    // En jordhaug på gulvet (vinduets bunn) som vokser for hver spadetak.
    haug(x: number) {
      if (hauger.length >= MAKS_HAUGER) {
        const gammel = hauger.shift();
        if (gammel) forsvinn(gammel.el);
      }
      const h: Haug = { el: nytt("div", "figur-haug"), b: 6, h: 3, slutt: performance.now() + HAUG_LEVETID };
      h.el.style.left = `${x.toFixed(1)}px`;
      settStorrelse(h);
      hauger.push(h);
      return {
        vokse() {
          h.b = Math.min(34, h.b + 5);
          h.h = Math.min(13, h.h + 2);
          settStorrelse(h);
        },
      };
    },

    // Bokstaver som sitter fast på flaten `pa`, én per x.
    leggBokstaver(tegn: string[], xs: number[], pa: Flate): Bokstav[] {
      const ut: Bokstav[] = [];
      tegn.forEach((t, i) => {
        if (bokstaver.length >= MAKS_BOKSTAVER) {
          const gammel = bokstaver.findIndex((b) => !b.fast);
          if (gammel >= 0) forsvinn(bokstaver.splice(gammel, 1)[0].el);
        }
        const b: Bokstav = {
          el: nytt("span", "figur-bokstav"),
          x: xs[i], y: pa.y, vx: 0, vy: 0, rot: 0, vrot: 0,
          pa, dx: xs[i] - pa.x1, fast: true,
          slutt: performance.now() + BOKSTAV_LEVETID,
        };
        b.el.textContent = t;
        bokstaver.push(b);
        ut.push(b);
        tegnBokstav(b);
      });
      return ut;
    },

    // En løs bokstav som ligger i ro på samme blokk (eller gulvet) nær x.
    bokstavNaer(el: Element | null, x: number, avstand: number): Bokstav | null {
      let best: Bokstav | null = null;
      for (const b of bokstaver) {
        if (!b.pa || b.fast || b.vx !== 0 || b.pa.el !== el) continue;
        const d = Math.abs(b.x - x);
        if (d < avstand && (!best || d < Math.abs(best.x - x))) best = b;
      }
      return best;
    },

    finnes: (b: Bokstav) => bokstaver.includes(b),

    // Brekkjernet: bokstaven løsner og glir mot kanten.
    slipp(b: Bokstav, vx: number) {
      b.fast = false;
      b.vx = vx;
    },

    spark(b: Bokstav, vx: number, vy: number) {
      b.fast = false;
      b.pa = null;
      b.vx = vx;
      b.vy = vy;
      b.vrot = (vx >= 0 ? 1 : -1) * 720;
    },

    oppdater(dt: number, naa: number, flater: Flate[]) {
      for (let i = partikler.length - 1; i >= 0; i--) {
        const p = partikler[i];
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (naa > p.slutt || p.y > window.innerHeight + 8) {
          p.el.remove();
          partikler.splice(i, 1);
        } else {
          plasser(p.el, p.x, p.y);
        }
      }

      for (let i = merker.length - 1; i >= 0; i--) {
        const m = merker[i];
        if (naa > m.slutt || (m.anker && !m.anker.isConnected)) {
          forsvinn(m.el);
          merker.splice(i, 1);
        } else if (m.anker) {
          const r = m.anker.getBoundingClientRect();
          plasser(m.el, r.left + m.dx - 15, r.top + m.dy - 15);
        }
      }

      for (let i = hauger.length - 1; i >= 0; i--) {
        if (naa > hauger[i].slutt) forsvinn(hauger.splice(i, 1)[0].el);
      }

      for (let i = bokstaver.length - 1; i >= 0; i--) {
        const b = bokstaver[i];
        if (naa > b.slutt && !b.fast) {
          forsvinn(b.el);
          bokstaver.splice(i, 1);
        } else {
          oppdaterBokstav(b, dt, flater);
        }
      }
    },

    fjern() {
      rot.remove();
    },
  };
}
