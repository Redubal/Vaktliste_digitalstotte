"use client";

import { useState, type ReactNode } from "react";

export type TabDefinition = {
  id: string;
  label: string;
  content: ReactNode;
};

export function Tabs({ tabs, initialTabId }: { tabs: TabDefinition[]; initialTabId?: string }) {
  const [active, setActive] = useState(initialTabId ?? tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="tabs">
      <div className="tabs-strip" role="tablist" aria-label="Innhold">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            className={t.id === active ? "tab-btn tab-btn--active" : "tab-btn"}
            onClick={() => {
              setActive(t.id);
              // Fanen huskes i adressen, så en oppdatering ikke hopper tilbake til første fane.
              const url = new URL(window.location.href);
              url.searchParams.set("fane", t.id);
              window.history.replaceState(null, "", url);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="tab-panel">
        {activeTab?.content}
      </div>
    </div>
  );
}
