import { useMemo, useState, useEffect, useRef } from "react";
import { Menu, Search, Filter, X, FolderPlus, Wrench } from "lucide-react";
import { domains } from "./data/domains";
import type { Domain, ItemStatus } from "./types/checklist";
import { Sidebar } from "./components/Sidebar";
import { CategorySection } from "./components/CategorySection";
import { SuggestionsPanel } from "./components/SuggestionsPanel";
import { FindingsView } from "./components/FindingsView";
import { ScopeView } from "./components/ScopeView";
import { ChecklistItemRow } from "./components/ChecklistItemRow";
import { HackerToolsModal } from "./components/HackerToolsModal";
import { AddCustomCategoryModal } from "./components/AddCustomCategoryModal";
import { useActiveProfile } from "./store/useChecklistStore";

type StatusFilter = "all" | ItemStatus | "critical_high";

export default function App() {
  const [activeDomain, setActiveDomain] = useState<Domain>("web");
  const [view, setView] = useState<"checklist" | "findings" | "scope">("checklist");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profile = useActiveProfile();

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
    const customCats = (profile?.customCategories || []).filter(
      (c) => c.domainId === activeDomain || !c.domainId
    );
    return [...domain.categories, ...customCats];
  }, [domain.categories, profile?.customCategories, activeDomain]);

  // Search Results across all domains & custom categories
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    const standardMatches = domains.flatMap((d) =>
      d.categories.flatMap((c) =>
        c.items
          .filter((i) => i.text.toLowerCase().includes(q) || i.how.toLowerCase().includes(q))
          .map((item) => ({ item, category: c, domain: d }))
      )
    );
    const customMatches = (profile?.customCategories || []).flatMap((c) =>
      c.items
        .filter((i) => i.text.toLowerCase().includes(q) || i.how.toLowerCase().includes(q))
        .map((item) => ({ item, category: c, domain: domains.find((d) => d.id === c.domainId) || domain }))
    );
    return [...standardMatches, ...customMatches];
  }, [query, profile?.customCategories, domain]);

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
    for (const d of domains) {
      if (d.categories.some((c) => c.id === categoryId)) {
        setActiveDomain(d.id);
        break;
      }
    }
    requestAnimationFrame(() => {
      document.getElementById(categoryId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="min-h-screen bg-background text-slate-200 lg:flex">
      <Sidebar
        activeDomain={activeDomain}
        onSelectDomain={(d) => {
          setActiveDomain(d);
          setStatusFilter("all");
        }}
        view={view}
        onSelectView={setView}
        onOpenTools={() => setToolsOpen(true)}
        onOpenAddCategory={() => setAddCatOpen(true)}
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

        <button
          onClick={() => setToolsOpen(true)}
          className="flex items-center gap-1 rounded border border-border bg-slate-800 px-2 py-1 text-xs text-amber-300 hover:bg-slate-700"
        >
          <Wrench className="h-3 w-3" /> Tools
        </button>
      </header>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          {/* Search bar */}
          <div className="relative mb-5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across all checks & payloads... (Press '/' to focus)"
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-8 text-sm text-slate-200 outline-none focus:border-emerald-500"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setToolsOpen(true)}
              title="Open Swiss Army Knife Tools"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-emerald-400"
            >
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span>Tools</span>
            </button>
          </div>

          {view === "findings" ? (
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

              {statusFilter === "all" && (
                <SuggestionsPanel onJumpToCategory={jumpToCategory} />
              )}

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
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Swiss Army Knife Modal */}
      <HackerToolsModal open={toolsOpen} onClose={() => setToolsOpen(false)} />

      {/* Add Custom Category Modal */}
      <AddCustomCategoryModal
        activeDomain={activeDomain}
        open={addCatOpen}
        onClose={() => setAddCatOpen(false)}
      />
    </div>
  );
}
