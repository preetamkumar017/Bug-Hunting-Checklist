import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Command,
  Layers,
  Zap,
  Wrench,
  FileText,
  Target,
  Download,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { domains } from "../data/domains";
import type { Domain } from "../types/checklist";

interface CommandPaletteModalProps {
  open: boolean;
  onClose: () => void;
  onSelectDomain: (d: Domain) => void;
  onSelectView: (v: "checklist" | "dashboard" | "findings" | "scope") => void;
  onOpenTools: () => void;
  onOpenAnalyzer: () => void;
  onOpenWordlists: () => void;
  onOpenBurpRules: () => void;
  onOpenReportDrafter: () => void;
  onJumpToCategory: (categoryId: string) => void;
}

interface PaletteAction {
  id: string;
  category: "Navigation" | "Domains" | "Hacker Tools" | "Checklist Items";
  title: string;
  subtitle?: string;
  icon: typeof Command;
  badge?: string;
  run: () => void;
}

export function CommandPaletteModal(props: CommandPaletteModalProps) {
  if (!props.open) return null;
  return <CommandPaletteDialog {...props} />;
}

function CommandPaletteDialog({
  onClose,
  onSelectDomain,
  onSelectView,
  onOpenTools,
  onOpenAnalyzer,
  onOpenWordlists,
  onOpenBurpRules,
  onOpenReportDrafter,
  onJumpToCategory,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build list of all actions
  const actions: PaletteAction[] = useMemo(() => {
    const list: PaletteAction[] = [
      // Primary Views
      {
        id: "view-dashboard",
        category: "Navigation",
        title: "Go to Dashboard & Bounty Tracker",
        subtitle: "View audit velocity, statistics & estimated earnings",
        icon: Target,
        badge: "View",
        run: () => onSelectView("dashboard"),
      },
      {
        id: "view-checklist",
        category: "Navigation",
        title: "Go to Checklist",
        subtitle: "Main testing methodology checks and playbooks",
        icon: Layers,
        badge: "View",
        run: () => onSelectView("checklist"),
      },
      {
        id: "view-findings",
        category: "Navigation",
        title: "Go to Findings & Reports",
        subtitle: "Documented vulnerabilities and exportable markdown/HTML",
        icon: FileText,
        badge: "View",
        run: () => onSelectView("findings"),
      },
      {
        id: "view-scope",
        category: "Navigation",
        title: "Go to Scope & Asset Inventory",
        subtitle: "Manage target rules, subdomains, and hacker scratchpad",
        icon: Target,
        badge: "View",
        run: () => onSelectView("scope"),
      },

      // Tools
      {
        id: "tool-analyzer",
        category: "Hacker Tools",
        title: "Raw HTTP Request & Vulnerability Analyzer",
        subtitle: "Paste Burp/Caido request to generate cURL, Python & Nuclei scripts",
        icon: Zap,
        badge: "Tool",
        run: onOpenAnalyzer,
      },
      {
        id: "tool-wordlists",
        category: "Hacker Tools",
        title: "Payloads & Wordlists Hub",
        subtitle: "Curated SSRF, LFI, IDOR, and XSS lists ready to download for Ffuf/Burp",
        icon: Download,
        badge: "Tool",
        run: onOpenWordlists,
      },
      {
        id: "tool-drafter",
        category: "Hacker Tools",
        title: "Smart Vulnerability Report Drafter",
        subtitle: "Craft executive HackerOne / Bugcrowd submissions with impact & fix advice",
        icon: Sparkles,
        badge: "Tool",
        run: onOpenReportDrafter,
      },
      {
        id: "tool-burprules",
        category: "Hacker Tools",
        title: "Burp Suite & Caido Match/Replace Rule Generator",
        subtitle: "Auto-generate proxy header rules and JSON config imports",
        icon: Wrench,
        badge: "Tool",
        run: onOpenBurpRules,
      },
      {
        id: "tool-swissknife",
        category: "Hacker Tools",
        title: "Swiss Army Knife (CVSS, Encoders, JWT)",
        subtitle: "CVSS v4/v3, Base64/Hex/URL, JWT Inspector, WAF Mutators",
        icon: Wrench,
        badge: "Tool",
        run: onOpenTools,
      },
    ];

    // Add Domain switches
    domains.forEach((d) => {
      list.push({
        id: `domain-${d.id}`,
        category: "Domains",
        title: `Switch Domain: ${d.emoji} ${d.label}`,
        subtitle: `${d.categories.length} categories, ${d.categories.flatMap((c) => c.items).length} checks`,
        icon: Layers,
        badge: "Domain",
        run: () => {
          onSelectDomain(d.id);
          onSelectView("checklist");
        },
      });
    });

    // Add Category Search items
    domains.forEach((d) => {
      d.categories.forEach((c) => {
        list.push({
          id: `cat-${c.id}`,
          category: "Checklist Items",
          title: `${d.emoji} ${c.name}`,
          subtitle: `${c.items.length} checks in ${d.label}`,
          icon: BookOpen,
          badge: d.label,
          run: () => {
            onSelectDomain(d.id);
            onSelectView("checklist");
            setTimeout(() => onJumpToCategory(c.id), 100);
          },
        });
      });
    });

    return list;
  }, [
    onSelectDomain,
    onSelectView,
    onOpenTools,
    onOpenAnalyzer,
    onOpenWordlists,
    onOpenBurpRules,
    onOpenReportDrafter,
    onJumpToCategory,
  ]);

  // Filter actions based on query
  const filtered = useMemo(() => {
    if (!query.trim()) return actions.slice(0, 15);
    const q = query.toLowerCase();
    return actions
      .filter((a) => a.title.toLowerCase().includes(q) || a.subtitle?.toLowerCase().includes(q))
      .slice(0, 20);
  }, [actions, query]);

  // Keyboard navigation
  useEffect(() => {
    function handlePaletteKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].run();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handlePaletteKey);
    return () => window.removeEventListener("keydown", handlePaletteKey);
  }, [filtered, selectedIndex, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 pt-16 backdrop-blur-sm sm:pt-24">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, tool, domain, or category... (Press ESC to close)"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <kbd className="hidden sm:inline-block rounded border border-border bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Action Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching commands or categories found for &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                    isSelected ? "bg-emerald-500/15 text-emerald-300" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                        isSelected ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold leading-tight">{item.title}</p>
                      {item.subtitle && (
                        <p className="truncate text-[11px] text-slate-500">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    {item.badge && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-border bg-slate-950/60 px-4 py-2 text-[11px] text-slate-500">
          <span>
            Navigate with <kbd className="rounded bg-slate-900 px-1 font-mono text-slate-400">↑</kbd>{" "}
            <kbd className="rounded bg-slate-900 px-1 font-mono text-slate-400">↓</kbd>
          </span>
          <span>
            Select with <kbd className="rounded bg-slate-900 px-1 font-mono text-slate-400">Enter</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
