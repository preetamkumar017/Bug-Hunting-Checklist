import { Bug, Download, Upload, RotateCcw, X } from "lucide-react";
import { domains } from "../data/domains";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import { domainProgress } from "../lib/progress";
import type { Domain } from "../types/checklist";
import { ProfileSwitcher } from "./ProfileSwitcher";

export function Sidebar({
  activeDomain,
  onSelectDomain,
  view,
  onSelectView,
  open,
  onClose,
}: {
  activeDomain: Domain;
  onSelectDomain: (d: Domain) => void;
  view: "checklist" | "findings" | "claude-log";
  onSelectView: (v: "checklist" | "findings" | "claude-log") => void;
  open: boolean;
  onClose: () => void;
}) {
  const profile = useActiveProfile();
  const resetActiveProfile = useChecklistStore((s) => s.resetActiveProfile);
  const profiles = useChecklistStore((s) => s.profiles);

  const totalDone = profile
    ? Object.values(profile.itemStates).filter(
        (st) => st.status === "clean" || st.status === "vulnerable" || st.status === "blocked"
      ).length
    : 0;
  const totalItems = domains.flatMap((d) => d.categories.flatMap((c) => c.items)).length;

  function exportJson() {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, "_")}_checklist_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        useChecklistStore.getState().importProfile(parsed);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 -translate-x-full flex-col overflow-y-auto border-r border-border bg-card p-4 transition-transform duration-200 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background">
          <Bug className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">Bug Bounty Checklist</p>
          <p className="text-[11px] text-slate-500">
            {totalDone} / {totalItems} completed
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-200 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <ProfileSwitcher />

      <div className="my-3 h-px bg-border" />

      <nav className="mb-3 space-y-1">
        <button
          onClick={() => {
            onSelectView("checklist");
            onClose();
          }}
          className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
            view === "checklist" ? "bg-white/10 text-slate-100" : "text-slate-400 hover:bg-white/5"
          }`}
        >
          ✅ Checklist
        </button>
        <button
          onClick={() => {
            onSelectView("findings");
            onClose();
          }}
          className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
            view === "findings" ? "bg-white/10 text-slate-100" : "text-slate-400 hover:bg-white/5"
          }`}
        >
          🐞 Findings ({profile?.findings.length ?? 0})
        </button>
        <button
          onClick={() => {
            onSelectView("claude-log");
            onClose();
          }}
          className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
            view === "claude-log" ? "bg-white/10 text-slate-100" : "text-slate-400 hover:bg-white/5"
          }`}
        >
          🤖 Claude Log
        </button>
      </nav>

      <div className="my-1 h-px bg-border" />

      <p className="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Domains
      </p>
      <div className="space-y-1">
        {domains.map((d) => {
          const { done, total } = profile ? domainProgress(d, profile) : { done: 0, total: 0 };
          return (
            <button
              key={d.id}
              onClick={() => {
                onSelectView("checklist");
                onSelectDomain(d.id);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                view === "checklist" && activeDomain === d.id
                  ? "bg-white/10 text-slate-100"
                  : "text-slate-400 hover:bg-white/5"
              }`}
            >
              <span>
                {d.emoji} {d.label}
              </span>
              <span className="text-[11px] text-slate-500">
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto space-y-1 pt-4">
        <button
          onClick={exportJson}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/5"
        >
          <Download className="h-3.5 w-3.5" /> Export progress (JSON)
        </button>
        <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/5">
          <Upload className="h-3.5 w-3.5" /> Import progress
          <input type="file" accept="application/json" onChange={importJson} className="hidden" />
        </label>
        <button
          onClick={() => {
            if (confirm("Reset all progress for this profile?")) resetActiveProfile();
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-400/80 hover:bg-red-950/30"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset profile
        </button>
      </div>
      <p className="mt-3 text-center text-[10px] text-slate-600">
        {Object.keys(profiles).length} profile(s) · data stored locally
      </p>
      </aside>
    </>
  );
}
