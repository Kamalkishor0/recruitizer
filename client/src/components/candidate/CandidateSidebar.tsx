"use client";

import { useState } from "react";

export type CandidateTab = "jobs" | "interviews" | "results";

type CandidateSidebarProps = {
  activeTab: CandidateTab;
  onTabChange: (tab: CandidateTab) => void;
};

type NavItem = {
  key: CandidateTab;
  label: string;
  description: string;
  accent: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "jobs",
    label: "Jobs",
    description: "Roles posted by recruiters (landing)",
    accent: "from-emerald-400/80 to-teal-500/80",
  },
  {
    key: "interviews",
    label: "Interviews",
    description: "Scheduled and in-progress interviews",
    accent: "from-indigo-400/80 to-blue-500/80",
  },
  {
    key: "results",
    label: "Results",
    description: "Outcomes for completed interviews",
    accent: "from-amber-300/80 to-orange-500/80",
  },
];

const baseButtonClasses =
  "group relative flex w-full items-center gap-3 rounded-xl text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`h-4 w-4 text-slate-200 transition-transform ${collapsed ? "" : "rotate-180"}`}
    >
      <path
        d="M10 7l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={2}
      />
    </svg>
  );
}

function Badge({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${accent} text-sm font-semibold uppercase text-white shadow-inner shadow-black/20 ring-1 ring-white/10`}
    >
      {label}
    </span>
  );
}

export default function CandidateSidebar({ activeTab, onTabChange }: CandidateSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex min-h-[520px] flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-xl shadow-indigo-500/10 backdrop-blur transition-[width] duration-200 ${collapsed ? "w-[4.25rem]" : "w-[17rem]"}`}
    >
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-1`}>
        {!collapsed && (
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-200">Candidate</p>
            <p className="text-base font-semibold text-white">Dashboard</p>
          </div>
        )}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((prev) => !prev)}
          className={`flex items-center justify-center text-slate-100 transition ${
            collapsed
              ? "h-8 w-8 rounded-md border border-white/20 bg-transparent hover:border-white/40"
              : "h-9 w-9 rounded-xl border border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/15"
          }`}
        >
          <Chevron collapsed={collapsed} />
        </button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={isActive}
              title={collapsed ? item.label : undefined}
              onClick={() => onTabChange(item.key)}
              className={`${baseButtonClasses} ${
                collapsed ? "justify-center px-1 py-1" : "justify-start px-3 py-2"
              } ${isActive ? "border border-white/15 bg-white/10 text-white" : "text-slate-200 hover:border-white/10 hover:bg-white/5"}`}
            >
              <Badge label={item.label.slice(0, 1)} accent={item.accent} />
              {!collapsed && (
                <span className="flex flex-col text-left">
                  <span className="leading-none">{item.label}</span>
                  <span className="text-[12px] font-normal text-slate-300/90">{item.description}</span>
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
