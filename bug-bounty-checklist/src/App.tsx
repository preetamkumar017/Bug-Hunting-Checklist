import { lazy, Suspense, useMemo, useState, useEffect, useRef } from "react";
import {
  Menu,
  Search,
  Filter,
  X,
  FolderPlus,
  Wrench,
  Zap,
  Command,
  Database,
  Sparkles,
} from "lucide-react";
import { domains } from "./data/domains";
import type { Domain, ItemStatus } from "./types/checklist";
import { Sidebar } from "./components/Sidebar";
import { CategorySection } from "./components/CategorySection";
import { FindingsView } from "./components/FindingsView";
import { ScopeView } from "./components/ScopeView";
import { DashboardView } from "./components/DashboardView";
import { ChecklistItemRow } from "./components/ChecklistItemRow";
import { AddCustomCategoryModal } from "./components/AddCustomCategoryModal";
import { CommandPaletteModal } from "./components/CommandPaletteModal";
import { useActiveProfile, useChecklistStore } from "./store/useChecklistStore";
import { effectiveCategories, effectiveCatalogue } from './lib/catalogue';
const HackerToolsModal = lazy(() => import('./components/HackerToolsModal').then(m => ({ default: m.HackerToolsModal })));
const HttpAnalyzerModal = lazy(() => import('./components/HttpAnalyzerModal').then(m => ({ default: m.HttpAnalyzerModal })));
const WordlistsModal = lazy(() => import('./components/WordlistsModal').then(m => ({ default: m.WordlistsModal })));
const DorkGeneratorModal = lazy(() => import('./components/DorkGeneratorModal').then(m => ({ default: m.DorkGeneratorModal })));
const BurpRulesModal = lazy(() => import('./components/BurpRulesModal').then(m => ({ default: m.BurpRulesModal })));
const ReportDrafterModal = lazy(() => import('./components/ReportDrafterModal').then(m => ({ default: m.ReportDrafterModal })));

type StatusFilter = "all" | ItemStatus | "critical_high";

export default function App() {
  const [activeDomain, setActiveDomain] = useState<Domain>("web");
  const [view, setView] = useState<"checklist" | "dashboard" | "findings" | "scope">("checklist");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [wordlistsOpen, setWordlistsOpen] = useState(false);
  const [dorksOpen, setDorksOpen] = useState(false);
  const [burpRulesOpen, setBurpRulesOpen] = useState(false);
  const [reportDrafterOpen, setReportDrafterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profile = useActiveProfile();
  const storageError = useChecklistStore(s => s.storageError);
  const storageWarning = useChecklistStore(s => s.storageWarning);
  const [jump, setJump] = useState<{ id: string; sequence: number } | null>(null);

  // Keyboard shortcut listener: Cmd/Ctrl+K for Command Palette, / for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (document.querySelector('dialog[open]') || (document.activeElement as HTMLElement | null)?.closest('[role="dialog"]')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (query) setQuery("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query]);

  const domain = domains.find((d) => d.id === activeDomain)!;

  // Merge built-in domain categories with user custom categories for this domain
  const mergedCategories = useMemo(() => {
    return effectiveCategories(domain, profile);
  }, [domain, profile]);

  // Search Results across all domains & custom categories
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    return effectiveCatalogue(profile).flatMap((d) =>
      d.categories.flatMap((c) =>
        c.items
          .filter((i) => [i.text, i.how, c.name, c.description, ...(i.payloads ?? []), ...(i.payloadNotes ?? []), ...(i.methods ?? []).flatMap(method => [method.title, method.scenario, method.tips, ...method.steps, ...(method.payloads ?? [])]), profile?.itemStates[i.id]?.note].some(text => text?.toLowerCase().includes(q)))
          .map((item) => ({ item, category: c, domain: d }))
      )
    );
  }, [query, profile]);

  // Filtered categories based on StatusFilter
  const filteredCategories = useMemo(() => {
    if (statusFilter === "all") return mergedCategories;

    const itemStates = profile?.itemStates || {};

    return mergedCategories
      .map((cat) => {
        const filteredItems = cat.items.filter((item) => {
          const state = itemStates[item.id]?.status || "not_tested";
          if (statusFilter === "critical_high") {
            return item.severity === "critical" || item.severity === "high";
          }
          return state === statusFilter;
        });
        return { ...cat, items: filteredItems };
      })
      .filter((cat) => cat.items.length > 0);
  }, [mergedCategories, statusFilter, profile?.itemStates]);

  // Compute status filter item counts for active domain
  const filterCounts = useMemo(() => {
    const states = profile?.itemStates || {};
    const allItems = mergedCategories.flatMap((c) => c.items);
    let clean = 0;
    let vulnerable = 0;
    let blocked = 0;
    let notTested = 0;
    let critHigh = 0;

    for (const item of allItems) {
      const st = states[item.id]?.status || "not_tested";
      if (st === "clean") clean++;
      else if (st === "vulnerable") vulnerable++;
      else if (st === "blocked") blocked++;
      else notTested++;

      if (item.severity === "critical" || item.severity === "high") {
        critHigh++;
      }
    }

    return {
      all: allItems.length,
      not_tested: notTested,
      clean,
      vulnerable,
      blocked,
      critical_high: critHigh,
    };
  }, [mergedCategories, profile?.itemStates]);

  function jumpToCategory(categoryId: string) {
    setView("checklist");
    setQuery("");
    setStatusFilter("all");
    for (const d of effectiveCatalogue(profile)) {
      if (d.categories.some((c) => c.id === categoryId)) {
        setActiveDomain(d.id);
        break;
      }
    }
    setJump(previous => ({ id: categoryId, sequence: (previous?.sequence ?? 0) + 1 }));
  }

  return (
    <div className="min-h-screen bg-background text-slate-200 lg:flex">
      <Sidebar
        key={`sidebar:${profile?.id ?? 'no-profile'}`}
        activeDomain={activeDomain}
        onSelectDomain={(d) => {
          setActiveDomain(d);
          setStatusFilter("all");
        }}
        view={view}
        onSelectView={setView}
        onOpenTools={() => setToolsOpen(true)}
        onOpenAnalyzer={() => setAnalyzerOpen(true)}
        onOpenWordlists={() => setWordlistsOpen(true)}
        onOpenDorks={() => setDorksOpen(true)}
        onOpenBurpRules={() => setBurpRulesOpen(true)}
        onOpenReportDrafter={() => setReportDrafterOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenAddCategory={() => setAddCatOpen(true)}
        onJumpToCategory={jumpToCategory}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 rounded-md p-1 text-slate-300 hover:text-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="truncate text-sm font-bold text-slate-100">
            {domain.emoji} {domain.label}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            title="Open Command Palette"
            className="flex items-center gap-1 rounded border border-purple-500/40 bg-purple-950/30 px-2 py-1 text-xs text-purple-300 hover:bg-purple-900/40"
          >
            <Command className="h-3 w-3" /> ⌘K
          </button>
          <button
            onClick={() => setAnalyzerOpen(true)}
            title="Open Raw HTTP Request Analyzer"
            className="flex items-center gap-1 rounded border border-border bg-slate-800 px-2 py-1 text-xs text-emerald-300 hover:bg-slate-700"
          >
            <Zap className="h-3 w-3" />
          </button>
          <button
            onClick={() => setToolsOpen(true)}
            className="flex items-center gap-1 rounded border border-border bg-slate-800 px-2 py-1 text-xs text-amber-300 hover:bg-slate-700"
          >
            <Wrench className="h-3 w-3" />
          </button>
        </div>
      </header>

      <main key={`content:${profile?.id ?? 'no-profile'}`} className="min-w-0 flex-1 overflow-y-auto">
        {storageError && <p role="alert" className="bg-red-950 p-4 text-red-200">Changes were not saved: {storageError}</p>}
        {storageWarning && <p role="status" className="bg-amber-950 p-4 text-amber-200">{storageWarning}</p>}
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          {/* Search bar & Action triggers */}
          <div className="relative mb-5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                ref={searchInputRef}
                aria-label="Search checks, payloads, notes and categories"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across all checks & payloads... (Press '/' to search)"
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-14 text-sm text-slate-200 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                title="Spotlight Command Palette (⌘K / Ctrl+K)"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded border border-border bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              >
                <Command className="h-3 w-3 text-purple-400" />
                <span>⌘K</span>
              </button>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-12 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setWordlistsOpen(true)}
              title="Curated Fuzzing Wordlists & Payloads"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-950/20 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-900/30 hover:text-blue-200"
            >
              <Database className="h-3.5 w-3.5 text-blue-400" />
              <span>Wordlists</span>
            </button>

            <button
              onClick={() => setDorksOpen(true)}
              title="Google Dork Generator"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-950/20 px-3 py-2 text-xs font-medium text-violet-300 hover:bg-violet-900/30 hover:text-violet-200"
            >
              <Search className="h-3.5 w-3.5 text-violet-400" />
              <span>Dorks</span>
            </button>

            <button
              onClick={() => setReportDrafterOpen(true)}
              title="Smart Vulnerability Report Drafter"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-900/30 hover:text-amber-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Report Drafter</span>
            </button>

            <button
              onClick={() => setAnalyzerOpen(true)}
              title="Open Raw HTTP Request & Vulnerability Analyzer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-900/30 hover:text-emerald-200"
            >
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span>HTTP Analyzer</span>
            </button>

            <button
              onClick={() => setToolsOpen(true)}
              title="Open Swiss Army Knife Tools"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-emerald-400"
            >
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span>Tools</span>
            </button>
          </div>

          {view === "dashboard" ? (
            <DashboardView onSelectDomain={setActiveDomain} onSelectView={setView} />
          ) : view === "findings" ? (
            <FindingsView />
          ) : view === "scope" ? (
            <ScopeView />
          ) : searchResults ? (
            <div>
              <p className="mb-3 text-xs text-slate-500">{searchResults.length} result(s) found</p>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {searchResults.map(({ item, category, domain: d }) => (
                  <ChecklistItemRow key={item.id} item={item} category={category} domain={d} />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-100">
                    {domain.emoji} {domain.label} Checklist
                  </h1>
                  <p className="text-xs text-slate-400">
                    Ordered by methodology flow — recon → auth → injection → business logic → advanced.
                  </p>
                  <p className="mt-1 text-xs text-amber-300">Checklist badges are testing priorities, not confirmed finding severity. “Clean” means no issue found in the recorded test only; blocked checks are not verified.</p>
                </div>
                <button
                  onClick={() => setAddCatOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/20"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  + Custom Category
                </button>
              </div>

              {/* Status Filter Pill Bar */}
              <div className="mb-5 flex flex-wrap items-center gap-1.5 rounded-lg border border-border/70 bg-card p-1.5">
                <span className="px-2 text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Filter:
                </span>
                {[
                  { id: "all", label: `All (${filterCounts.all})` },
                  { id: "not_tested", label: `Untested (${filterCounts.not_tested})` },
                  { id: "clean", label: `Clean (${filterCounts.clean})` },
                  { id: "vulnerable", label: `Vulnerable (${filterCounts.vulnerable})` },
                  { id: "blocked", label: `Blocked (${filterCounts.blocked})` },
                  {
                    id: "critical_high",
                    label: `Critical / High (${filterCounts.critical_high})`,
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id as StatusFilter)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      statusFilter === f.id
                        ? f.id === "vulnerable"
                          ? "bg-red-500/20 text-red-300 font-semibold"
                          : f.id === "clean"
                          ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                          : "bg-white/10 text-slate-100 font-semibold"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {filteredCategories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-slate-400">
                  No checks match the current filter &quot;{statusFilter}&quot;.
                </div>
              ) : (
                filteredCategories.map((category, idx) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    domain={domain}
                    index={idx + 1}
                    defaultOpen={idx === 0 || statusFilter !== "all"}
                    jumpSequence={jump?.id === category.id ? jump.sequence : undefined}
                    filtered={statusFilter !== 'all'}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Swiss Army Knife Modal */}
      <Suspense key={`tools:${profile?.id ?? 'no-profile'}`} fallback={<p role="status">Loading tools…</p>}>
      {toolsOpen && <HackerToolsModal open={toolsOpen} onClose={() => setToolsOpen(false)} />}

      {/* Raw HTTP Request & Attack Vector Analyzer */}
      {analyzerOpen && <HttpAnalyzerModal
        open={analyzerOpen}
        onClose={() => setAnalyzerOpen(false)}
        onNavigateToCategory={jumpToCategory}
      />}

      {/* Add Custom Category Modal */}
      {addCatOpen && <AddCustomCategoryModal
        activeDomain={activeDomain}
        open={addCatOpen}
        onClose={() => setAddCatOpen(false)}
      />}

      {/* Spotlight Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPaletteModal
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectDomain={setActiveDomain}
        onSelectView={setView}
        onOpenTools={() => setToolsOpen(true)}
        onOpenAnalyzer={() => setAnalyzerOpen(true)}
        onOpenWordlists={() => setWordlistsOpen(true)}
        onOpenBurpRules={() => setBurpRulesOpen(true)}
        onOpenReportDrafter={() => setReportDrafterOpen(true)}
        onJumpToCategory={jumpToCategory}
      />

      {/* Curated Wordlists & Fuzzing Hub Modal */}
      {wordlistsOpen && <WordlistsModal
        open={wordlistsOpen}
        onClose={() => setWordlistsOpen(false)}
      />}

      {dorksOpen && <DorkGeneratorModal
        open={dorksOpen}
        onClose={() => setDorksOpen(false)}
        defaultDomain={profile?.name}
      />}

      {/* Burp Suite & Caido Match/Replace Rule Generator Modal */}
      {burpRulesOpen && <BurpRulesModal
        open={burpRulesOpen}
        onClose={() => setBurpRulesOpen(false)}
      />}

      {/* Smart Vulnerability Report Drafter Modal */}
      {reportDrafterOpen && <ReportDrafterModal
        open={reportDrafterOpen}
        onClose={() => setReportDrafterOpen(false)}
      />}
      </Suspense>
    </div>
  );
}
