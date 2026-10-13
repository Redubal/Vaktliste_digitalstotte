// Flater figuren kan stå på: øvre kant av synlige blokker i siden, i vinduskoordinater, pluss
// gulvet (vinduets bunn). Leser bare plassering, aldri tekst eller verdier.

export type Flate = { el: Element | null; x1: number; x2: number; y: number };

const UTVALG = [
  ".logo-band",
  ".panel",
  ".page-header",
  "main section",
  "table",
  "thead",
  "tr",
  "li",
  "p",
  "label",
  "button",
  "input",
  "select",
  "h1",
  "h2",
  "h3",
].join(",");

const MAKS = 400;
const MIN_BREDDE = 40;
// Figuren er 40 px høy; en kant nærmere toppen enn dette gir ikke plass til hodet.
const TAKHOYDE = 44;

export function gulv(): Flate {
  return { el: null, x1: 0, x2: window.innerWidth, y: window.innerHeight };
}

function somFlate(el: Element): Flate | null {
  const r = el.getBoundingClientRect();
  if (r.width < MIN_BREDDE || r.height < 6) return null;
  if (r.top < TAKHOYDE || r.top > window.innerHeight - 4) return null;
  const x1 = Math.max(0, r.left);
  const x2 = Math.min(window.innerWidth, r.right);
  if (x2 - x1 < MIN_BREDDE) return null;
  return { el, x1, x2, y: r.top };
}

export function samleFlater(lag: Element): Flate[] {
  const ut: Flate[] = [];
  const elementer = document.querySelectorAll(UTVALG);
  for (let i = 0; i < elementer.length && ut.length < MAKS; i++) {
    const el = elementer[i];
    if (lag.contains(el) || el.closest("dialog")) continue;
    const flate = somFlate(el);
    if (flate) ut.push(flate);
  }
  ut.push(gulv());
  return ut;
}

// Ny plassering for flaten figuren står på (siden kan ha rullet). null = flaten er borte.
export function oppdaterFlate(flate: Flate): Flate | null {
  if (!flate.el) return gulv();
  if (!flate.el.isConnected) return null;
  return somFlate(flate.el);
}
