import { useState, useMemo } from "react";
import {
  Bug,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  X,
  Target,
  Wrench,
  FolderPlus,
  LayoutDashboard,
  Zap,
  Command,
  Sparkles,
  Settings,
  Database,
  Search,
  ArrowDownAZ,
} from "lucide-react";
import { domains } from "../data/domains";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import { effectiveCategories, effectiveCatalogue } from '../lib/catalogue';
import { MAX_IMPORT_BYTES, parseProfileImport } from '../lib/profileValidation';
import { domainProgress, categoryProgress } from "../lib/progress";
import type { Domain } from "../types/checklist";
import { ProfileSwitcher } from "./ProfileSwitcher";

export function Sidebar({
  activeDomain,
  onSelectDomain,
  view,
  onSelectView,
  onOpenTools,
  onOpenAnalyzer,
  onOpenWordlists,
  onOpenDorks,
  onOpenBurpRules,
  onOpenReportDrafter,
  onOpenCommandPalette,
  onOpenAddCategory,
  onJumpToCategory,
  open,
  onClose,
}: {
  activeDomain: Domain;
  onSelectDomain: (d: Domain) => void;
  view: "checklist" | "dashboard" | "findings" | "scope";
  onSelectView: (v: "checklist" | "dashboard" | "findings" | "scope") => void;
  onOpenTools: () => void;
  onOpenAnalyzer?: () => void;
  onOpenWordlists?: () => void;
  onOpenDorks?: () => void;
  onOpenBurpRules?: () => void;
  onOpenReportDrafter?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAddCategory: () => void;
  onJumpToCategory?: (categoryId: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const profile = useActiveProfile();
  const resetActiveProfile = useChecklistStore((s) => s.resetActiveProfile);
  const deleteProfile = useChecklistStore((s) => s.deleteProfile);
  const profiles = useChecklistStore((s) => s.profiles);

  const [sortAlphabetical, setSortAlphabetical] = useState(true);
  const [showSubCategories, setShowSubCategories] = useState(true);

  // Domains sorted alphabetically (A-Z) by default
  const displayedDomains = useMemo(() => {
    if (!sortAlphabetical) return domains;
    return [...domains].sort((a, b) => a.label.localeCompare(b.label));
  }, [sortAlphabetical]);

  // Active domain sub-categories, sorted alphabetically (A-Z)
  const activeSubCategories = useMemo(() => {
    const curDomain = domains.find((d) => d.id === activeDomain);
    if (!curDomain) return [];
    const all = effectiveCategories(curDomain, profile);
    return [...all].sort((a, b) => a.name.localeCompare(b.name));
  }, [activeDomain, profile]);

  function handleDeleteProfile() {
    if (!profile) return;
    const confirmed = confirm(
      `Delete target profile "${profile.name}"?\n\nThis permanently removes its checklist progress, scope, and findings from this browser (localStorage).\n\nType OK to confirm.`
    );
    if (!confirmed) return;
    if (prompt(`Type the profile name ("${profile.name}") to confirm deletion:`) === profile.name) {
      deleteProfile(profile.id);
    } else {
      alert("Name didn't match — profile not deleted.");
    }
  }

  const allItems = effectiveCatalogue(profile).flatMap(d => d.categories.flatMap(c => c.items));
  const totalItems = allItems.length;

  const totalDone = profile
    ? allItems.filter(
        (item) => ['clean', 'vulnerable'].includes(profile.itemStates[item.id]?.status)
      ).length
    : 0;

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
    if (file.size > MAX_IMPORT_BYTES) { alert('Import exceeds the 3 MB limit'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseProfileImport(reader.result as string);
        useChecklistStore.getState().importProfile(parsed);
        alert('Profile imported. Conflicting IDs are imported as a separate copy.');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to import profile');
      }
    };
    reader.onerror = () => alert('Unable to read import file');
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
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Bug className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-slate-100">Bug Bounty Checklist</p>
            <p className="text-[11px] text-slate-400">
              {totalDone} / {totalItems} completed
            </p>
          </div>
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden lg:flex items-center gap-1 rounded border border-border bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition"
              title="Open Command Palette (Cmd+K)"
            >
              <Command className="h-3 w-3" />K
            </button>
          )}
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
              onSelectView("dashboard");
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
              view === "dashboard"
                ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" /> 📊 Dashboard
          </button>
          <button
            onClick={() => {
              onSelectView("checklist");
              onClose();
            }}
            className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
              view === "checklist"
                ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            ✅ Checklist
          </button>
          <button
            onClick={() => {
              onSelectView("findings");
              onClose();
            }}
            className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
              view === "findings"
                ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            🐞 Findings ({profile?.findings.length ?? 0})
          </button>
          <button
            onClick={() => {
              onSelectView("scope");
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
              view === "scope"
                ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Target className="h-4 w-4" /> Scope &amp; Assets
          </button>
          {onOpenAnalyzer && (
            <button
              onClick={() => {
                onOpenAnalyzer();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-emerald-400 transition"
            >
              <Zap className="h-4 w-4 text-emerald-400" /> HTTP Analyzer ⚡
            </button>
          )}
          {onOpenWordlists && (
            <button
              onClick={() => {
                onOpenWordlists();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-sky-400 transition"
            >
              <Database className="h-4 w-4 text-sky-400" /> Payloads &amp; Wordlists 🗂️
            </button>
          )}
          {onOpenDorks && (
            <button
              onClick={() => {
                onOpenDorks();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-violet-400 transition"
            >
              <Search className="h-4 w-4 text-violet-400" /> Google Dorks 🔎
            </button>
          )}
          {onOpenReportDrafter && (
            <button
              onClick={() => {
                onOpenReportDrafter();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-emerald-400 transition"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" /> Report Drafter ✍️
            </button>
          )}
          {onOpenBurpRules && (
            <button
              onClick={() => {
                onOpenBurpRules();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-amber-400 transition"
            >
              <Settings className="h-4 w-4 text-amber-400" /> Burp / Caido Rules 🎯
            </button>
          )}
          <button
            onClick={() => {
              onOpenTools();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
          >
            <Wrench className="h-4 w-4 text-amber-400" /> Swiss Army Knife 🛠️
          </button>
        </nav>

        <div className="my-1 h-px bg-border" />

        <div className="mb-2 mt-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Categories ({domains.length})
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSortAlphabetical((s) => !s)}
              title={
                sortAlphabetical
                  ? "Sorted Alphabetically (A-Z). Click for original methodology order."
                  : "Click to sort categories alphabetically (A-Z)."
              }
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition ${
                sortAlphabetical
                  ? "bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowDownAZ className="h-3 w-3" />
              <span>A-Z</span>
            </button>
            <button
              onClick={onOpenAddCategory}
              title="Create Custom Category"
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
            >
              <FolderPlus className="h-3 w-3" /> + Custom
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {displayedDomains.map((d) => {
            const { done, total } = profile ? domainProgress(d, profile) : { done: 0, total: 0 };
            const isActive = view === "checklist" && activeDomain === d.id;

            return (
              <div key={d.id} className="space-y-0.5">
                <button
                  onClick={() => {
                    onSelectView("checklist");
                    onSelectDomain(d.id);
                    if (activeDomain === d.id) {
                      setShowSubCategories((prev) => !prev);
                    } else {
                      setShowSubCategories(true);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-white/10 text-slate-100 font-medium"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span>{d.emoji}</span>
                    <span className="truncate">{d.label}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500">
                      {done}/{total}
                    </span>
                    {isActive && (
                      <span className="text-[10px] text-slate-400">
                        {showSubCategories ? "▴" : "▾"}
                      </span>
                    )}
                  </div>
                </button>

                {/* Sub-categories under active domain (Alphabetically sorted) */}
                {isActive && showSubCategories && activeSubCategories.length > 0 && (
                  <div className="ml-3 my-1 space-y-0.5 border-l border-slate-700/60 pl-2">
                    {activeSubCategories.map((cat) => {
                      const catProg = profile
                        ? categoryProgress(cat, profile)
                        : { done: 0, total: cat.items.length };
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (onJumpToCategory) {
                              onJumpToCategory(cat.id);
                            } else {
                              requestAnimationFrame(() => {
                                document
                                  .getElementById(cat.id)
                                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                              });
                            }
                            onClose();
                          }}
                          className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-emerald-400 transition group"
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <span className="text-[11px]">{cat.emoji || "📋"}</span>
                            <span className="truncate group-hover:text-emerald-300">
                              {cat.name}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">
                            {catProg.done}/{catProg.total}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-auto space-y-1 pt-4">
          <button
            onClick={exportJson}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" /> Export profile (JSON)
          </button>
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200">
            <Upload className="h-3.5 w-3.5" /> Import profile
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
          <button
            onClick={handleDeleteProfile}
            disabled={!profile}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-500 hover:bg-red-950/40 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete profile permanently
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-600">
          {Object.keys(profiles).length} profile(s) · offline &amp; encrypted locally
        </p>
      </aside>
    </>
  );
}
