import { useMemo, useState } from "react";
import { Menu, Search } from "lucide-react";
import { domains } from "./data/domains";
import type { Domain } from "./types/checklist";
import { Sidebar } from "./components/Sidebar";
import { CategorySection } from "./components/CategorySection";
import { SuggestionsPanel } from "./components/SuggestionsPanel";
import { FindingsView } from "./components/FindingsView";
import { ChecklistItemRow } from "./components/ChecklistItemRow";

export default function App() {
  const [activeDomain, setActiveDomain] = useState<Domain>("web");
  const [view, setView] = useState<"checklist" | "findings">("checklist");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const domain = domains.find((d) => d.id === activeDomain)!;

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return domains.flatMap((d) =>
      d.categories.flatMap((c) =>
        c.items
          .filter((i) => i.text.toLowerCase().includes(q) || i.how.toLowerCase().includes(q))
          .map((item) => ({ item, category: c, domain: d }))
      )
    );
  }, [query]);

  function jumpToCategory(categoryId: string) {
    setView("checklist");
    setQuery("");
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
        onSelectDomain={setActiveDomain}
        view={view}
        onSelectView={setView}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="shrink-0 rounded-md p-1 text-slate-300 hover:text-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="truncate text-sm font-bold text-slate-100">
          {domain.emoji} {domain.label} Checklist
        </p>
      </header>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all checklist items..."
              className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-slate-500"
            />
          </div>

          {view === "findings" ? (
            <FindingsView />
          ) : searchResults ? (
            <div>
              <p className="mb-3 text-xs text-slate-500">{searchResults.length} result(s)</p>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {searchResults.map(({ item, category, domain: d }) => (
                  <ChecklistItemRow key={item.id} item={item} category={category} domain={d} />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="mb-1 text-xl font-bold text-slate-100">
                {domain.emoji} {domain.label} Checklist
              </h1>
              <p className="mb-4 text-sm text-slate-500">
                Ordered to follow a real testing flow — recon first, advanced checks last.
              </p>

              <SuggestionsPanel onJumpToCategory={jumpToCategory} />

              {domain.categories.map((category, idx) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  domain={domain}
                  defaultOpen={idx === 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
