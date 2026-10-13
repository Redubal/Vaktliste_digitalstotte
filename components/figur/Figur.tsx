"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { startMotor } from "./motor";
import { Tegning } from "./Tegning";

const NOKKEL = "figur-av";
const lyttere = new Set<() => void>();

function lesAv(): boolean {
  try {
    return window.localStorage.getItem(NOKKEL) === "1";
  } catch {
    return false;
  }
}

function abonner(fn: () => void) {
  lyttere.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    lyttere.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

function settAv(av: boolean) {
  try {
    window.localStorage.setItem(NOKKEL, av ? "1" : "0");
  } catch {
    // Uten lagring gjelder valget bare til siden lastes på nytt.
  }
  lyttere.forEach((fn) => fn());
}

export function Figur() {
  // Serveren antar «av», så figuren ikke blinker inn og ut før nettleseren har lest valget.
  const av = useSyncExternalStore(abonner, lesAv, () => true);
  const lagRef = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (av || !lagRef.current || !figRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return startMotor(lagRef.current, figRef.current);
  }, [av]);

  return (
    <>
      <button
        type="button"
        className="figur-bryter"
        aria-pressed={!av}
        onClick={() => settAv(!av)}
      >
        Figur: {av ? "av" : "på"}
      </button>
      {!av && (
        <div className="figur-lag" ref={lagRef} aria-hidden="true">
          <div className="figur-fig" ref={figRef}>
            <Tegning />
          </div>
        </div>
      )}
    </>
  );
}
