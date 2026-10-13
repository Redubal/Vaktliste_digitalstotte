// Figuren sett fra siden, vendt mot høyre, føttene i (20, 40). Hvert ledd er en <g data-ledd> som
// motoren vrir rundt sitt eget dreiepunkt: skulder (20, 14.5), albue (20, 20), hofte (20, 25),
// kne (20, 32.5), nakke (20, 14). Leddene bak tegnes litt lysere for dybde.

export const LEDD = [
  "vend",
  "skygge",
  "hele",
  "overkropp",
  "hode",
  "oye",
  "armAOver",
  "armAUnder",
  "armBOver",
  "armBUnder",
  "beinAOver",
  "beinAUnder",
  "beinBOver",
  "beinBUnder",
] as const;

export type LeddNavn = (typeof LEDD)[number];

const BAK = "#3b3b3b";
const FRAM = "#111";

function Bein({ side, farge }: { side: "A" | "B"; farge: string }) {
  return (
    <g data-ledd={`bein${side}Over`} stroke={farge}>
      <line x1="20" y1="25" x2="20" y2="32.5" />
      <g data-ledd={`bein${side}Under`}>
        <line x1="20" y1="32.5" x2="20" y2="39.2" />
        <line x1="19.6" y1="39.4" x2="23" y2="39.4" strokeWidth="2.2" />
      </g>
    </g>
  );
}

function Arm({ side, farge }: { side: "A" | "B"; farge: string }) {
  return (
    <g data-ledd={`arm${side}Over`} stroke={farge}>
      <line x1="20" y1="14.5" x2="20" y2="20" />
      <g data-ledd={`arm${side}Under`}>
        <line x1="20" y1="20" x2="20" y2="24.5" />
        <circle cx="20" cy="25" r="1.3" fill={farge} stroke="none" />
      </g>
    </g>
  );
}

export function Tegning() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40">
      <g data-ledd="vend">
        <ellipse data-ledd="skygge" cx="20.5" cy="40" rx="8" ry="1.4" fill="rgba(0,0,0,0.2)" />
        <g data-ledd="hele" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <Bein side="A" farge={BAK} />
          <g data-ledd="overkropp">
            <Arm side="A" farge={BAK} />
            <line x1="20" y1="13.5" x2="20" y2="25" stroke={FRAM} strokeWidth="3.8" />
            <g data-ledd="hode">
              <polygon
                points="16.6,7 16.9,2.2 18.4,4.6 19.6,0.8 21,4.1 22.6,1.6 23.4,6.4"
                fill={FRAM}
                stroke="none"
              />
              <circle cx="20" cy="9.3" r="4.4" fill={FRAM} stroke="none" />
              <g data-ledd="oye">
                <circle cx="22.2" cy="8.7" r="1.7" fill="#fff" stroke="none" />
                <circle cx="22.9" cy="8.8" r="0.8" fill={FRAM} stroke="none" />
              </g>
              <line x1="22.4" y1="11.7" x2="24" y2="11.3" stroke="#fff" strokeWidth="0.6" />
            </g>
            <Arm side="B" farge={FRAM} />
          </g>
          <Bein side="B" farge={FRAM} />
        </g>
      </g>
    </svg>
  );
}
