import { useState, useMemo, useEffect, useRef } from "react";
import {
  X, Copy, Check, ExternalLink, SearchCode,
  Target, ShieldAlert, Crosshair, Lightbulb, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import {
  DORK_GROUPS,
  TARGET_RECON_GROUPS,
  TARGET_FINDER_GROUPS,
  buildQuery,
  normalizeDomain,
  searchUrl,
  type DorkGroup,
  type TargetReconGroup,
  type TargetFinderGroup,
} from "@/tools/lib/dorks";
import { getDorkExplanation } from "@/tools/lib/dorkExplanation";

interface DorkGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  defaultDomain?: string;
}

const SEVERITY_STYLE: Record<string, { badge: string; accent: string }> = {
  critical: { badge: "bg-red-500/15 text-red-300 border-red-500/30",    accent: "border-l-red-500/60" },
  high:     { badge: "bg-orange-500/15 text-orange-300 border-orange-500/30", accent: "border-l-orange-500/60" },
  medium:   { badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",  accent: "border-l-amber-500/60" },
  low:      { badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",     accent: "border-l-sky-500/60" },
  info:     { badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",  accent: "border-l-slate-600/60" },
};

const ENGINE_STYLE: Record<string, string> = {
  google: "bg-violet-600 hover:bg-violet-500",
  github: "bg-slate-600 hover:bg-slate-500",
  shodan: "bg-rose-700 hover:bg-rose-600",
};

const ENGINE_LABEL = { google: "Google", github: "GitHub", shodan: "Shodan" } as const;

type Mode = "vuln" | "recon" | "finder";

function buildFinderQuery(template: string, keyword: string): string {
  return template.replace(/\{keyword\}/g, keyword.trim());
}

// ─── Expandable Dork Card with In-Depth Explanation ──────────────────────────
function DorkCard({
  query,
  what,
  severity,
  engine = "google",
  tip,
  codeColor = "text-violet-300/90",
  engineBtnClass,
  cardKey,
  onCopy,
  copiedKey,
  forceExpandExplain,
}: {
  query: string;
  what: string;
  severity: keyof typeof SEVERITY_STYLE;
  engine?: "google" | "github" | "shodan";
  tip?: string;
  codeColor?: string;
  engineBtnClass: string;
  cardKey: string;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  forceExpandExplain?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [prevForce, setPrevForce] = useState(forceExpandExplain);
  const [showExplain, setShowExplain] = useState(false);
  const sev = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.info;

  if (forceExpandExplain !== prevForce) {
    setPrevForce(forceExpandExplain);
    setShowExplain(Boolean(forceExpandExplain));
  }

  const explanation = useMemo(
    () => getDorkExplanation(query, what, severity, engine, tip),
    [query, what, severity, engine, tip]
  );

  return (
    <div className={`rounded-lg border border-border border-l-2 ${sev.accent} bg-slate-950 overflow-hidden`}>
      {/* ── Top row: severity + what + explain button ── */}
      <div className="flex items-start justify-between gap-2 px-3 pt-2.5 pb-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sev.badge}`}>
            {severity}
          </span>
          <p className="text-[11.5px] font-semibold text-slate-200 leading-snug">{what}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Explain toggle button */}
          <button
            onClick={() => setShowExplain((p) => !p)}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium transition ${
              showExplain
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10"
                : "text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 border border-slate-800"
            }`}
            title="View in-depth explanation, operators, and bug bounty hunting tips"
          >
            <Lightbulb className="h-3 w-3 text-amber-400" />
            <span className="hidden xs:inline">Explain</span>
            {showExplain ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
          {/* expand toggle (mobile query toggle) */}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-slate-300 md:hidden"
            aria-label="Toggle query code"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Query + actions ── */}
      <div className={`px-3 pb-3 ${expanded ? "block" : "hidden md:block"}`}>
        <div className="flex items-start justify-between gap-2">
          <code className={`break-all select-all font-mono text-[11px] leading-relaxed ${codeColor}`}>
            {query}
          </code>
          <div className="flex shrink-0 items-center gap-1.5 ml-2">
            <button
              onClick={() => onCopy(query, cardKey)}
              title="Copy dork"
              className="rounded p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
            >
              {copiedKey === cardKey
                ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                : <Copy className="h-3.5 w-3.5" />}
            </button>
            <a
              href={searchUrl(engine, query)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                // If user clicks with Cmd (Mac) / Ctrl (Windows) or Middle Click, browser natively opens in background tab
                if (e.metaKey || e.ctrlKey || e.button === 1) return;

                try {
                  const newWin = window.open(searchUrl(engine, query), "_blank");
                  if (newWin) {
                    e.preventDefault();
                    try {
                      newWin.blur();
                    } catch {
                      /* cross-origin ignore */
                    }
                    window.focus();
                  }
                } catch {
                  /* fallback to normal <a> target="_blank" */
                }
              }}
              title="Open search in new tab (Tip: ⌘+Click / Middle-Click opens in background without switching tabs)"
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-white transition ${engineBtnClass}`}
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">{ENGINE_LABEL[engine]}</span>
            </a>
          </div>
        </div>

        {/* ── In-depth Explanation Card ── */}
        {showExplain && (
          <div className="mt-2.5 space-y-2.5 rounded-lg border border-amber-500/25 bg-amber-950/15 p-3 text-[11px] leading-relaxed">
            {/* Header: Vulnerability Class & What it does */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  How This Dork Works
                </span>
                <span className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-amber-200/90">
                  {explanation.vulnClass}
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed font-medium">{explanation.whatItDoes}</p>
              <p className="mt-1 text-slate-400 text-[10.5px] leading-relaxed">{explanation.whyItMatters}</p>
            </div>

            {/* Syntax Breakdown / Operators */}
            {explanation.operators.length > 0 && (
              <div className="border-t border-amber-500/15 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-1.5">
                  Query Syntax Breakdown
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {explanation.operators.map((op, i) => (
                    <div key={i} className="rounded border border-slate-800/90 bg-slate-900/80 p-2 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-amber-300">{op.op}</span>
                        <span className="text-slate-400 font-medium">({op.label})</span>
                      </div>
                      <p className="mt-0.5 text-slate-400 leading-tight">{op.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hunter Action & Checklist */}
            {explanation.hunterTips.length > 0 && (
              <div className="border-t border-amber-500/15 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mb-1">
                  🎯 Bug Hunter Action & Testing Checklist
                </p>
                <ul className="space-y-1 text-[10.5px] text-slate-300">
                  {explanation.hunterTips.map((tipItem, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                      <span className="leading-tight">{tipItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tip fallback (if explain not open and tip exists) */}
        {!showExplain && tip && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-2">
            <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
            <p className="text-[10px] leading-relaxed text-amber-300/80">{tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Horizontal scrollable category tabs (used on mobile) ─────────────────────
function CategoryTabs({
  groups,
  activeId,
  onSelect,
  activeClass,
}: {
  groups: Array<{ id: string; name: string; emoji?: string; dorks: unknown[] }>;
  activeId: string;
  onSelect: (id: string) => void;
  activeClass: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // scroll active tab into view on change
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>("[data-active='true']");
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  return (
    <div
      ref={ref}
      className="flex gap-1.5 overflow-x-auto scrollbar-none px-3 py-2 md:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {groups.map((g) => (
        <button
          key={g.id}
          data-active={g.id === activeId}
          onClick={() => onSelect(g.id)}
          className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition whitespace-nowrap ${
            g.id === activeId ? activeClass : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          {g.emoji && <span>{g.emoji}</span>}
          {g.name}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DorkGeneratorModal({ open, onClose, defaultDomain }: DorkGeneratorModalProps) {
  const [mode, setMode]               = useState<Mode>("vuln");
  const [input, setInput]             = useState("");
  const [keyword, setKeyword]         = useState("");
  const [activeVuln, setActiveVuln]   = useState(DORK_GROUPS[0].id);
  const [activeRecon, setActiveRecon] = useState(TARGET_RECON_GROUPS[0].id);
  const [activeFinder, setActiveFinder] = useState(TARGET_FINDER_GROUPS[0].id);
  const [copiedKey, setCopiedKey]     = useState<string | null>(null);
  const [expandAllTips, setExpandAllTips] = useState(false);

  useEffect(() => {
    if (open && !input && defaultDomain && defaultDomain.includes(".")) {
      setInput(defaultDomain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDomain]);

  const domain      = useMemo(() => normalizeDomain(input) || "example.com", [input]);
  const vulnGroup   = DORK_GROUPS.find((g) => g.id === activeVuln)     ?? DORK_GROUPS[0];
  const reconGroup  = TARGET_RECON_GROUPS.find((g) => g.id === activeRecon)   ?? TARGET_RECON_GROUPS[0];
  const finderGroup = TARGET_FINDER_GROUPS.find((g) => g.id === activeFinder) ?? TARGET_FINDER_GROUPS[0];

  if (!open) return null;

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1200);
  }

  // ─── Dork list panel (vuln / recon) ────────────────────────────────────────
  function renderDorkList(
    group: DorkGroup | TargetReconGroup,
    buildFn: (q: string) => string,
    codeColor: string,
  ) {
    const dorks = group.dorks;
    const allQ  = dorks.map((d) => buildFn(d.query)).join("\n");
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Group header */}
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-200">{group.name}</h3>
            <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">{group.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpandAllTips((p) => !p)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                expandAllTips
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border-border bg-card text-slate-300 hover:bg-white/5"
              }`}
              title="Toggle detailed explanations for all dorks in this group"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden xs:inline">{expandAllTips ? "Collapse Explanations" : "Explain All"}</span>
              <span className="xs:hidden">{expandAllTips ? "Collapse" : "Explain All"}</span>
            </button>
            <button
              onClick={() => copy(allQ, "all")}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
            >
              {copiedKey === "all" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              Copy all ({dorks.length})
            </button>
          </div>
        </div>
        {/* Cards */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-0.5 pb-1">
          {dorks.map((d, idx) => (
            <DorkCard
              key={idx}
              query={buildFn(d.query)}
              what={d.what}
              severity={d.severity}
              engine={d.engine ?? "google"}
              tip={d.tip}
              codeColor={codeColor}
              engineBtnClass={ENGINE_STYLE[d.engine ?? "google"]}
              cardKey={`${group.id}-${idx}`}
              onCopy={copy}
              copiedKey={copiedKey}
              forceExpandExplain={expandAllTips}
            />
          ))}
        </div>
        <p className="mt-2 shrink-0 text-[10px] text-slate-600">
          {mode === "vuln"
            ? "Hits are leads only — confirm data is real and in scope before reporting. Google may CAPTCHA rapid queries."
            : "Passive OSINT only — respect privacy laws and program scope at all times."}
        </p>
      </div>
    );
  }

  // ─── Finder dork list panel ─────────────────────────────────────────────────
  function renderFinderList(group: TargetFinderGroup) {
    const dorks = group.dorks;
    const allQ  = dorks.map((d) => buildFinderQuery(d.query, keyword)).join("\n");
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-200">{group.emoji} {group.name}</h3>
            <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">{group.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpandAllTips((p) => !p)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                expandAllTips
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border-border bg-card text-slate-300 hover:bg-white/5"
              }`}
              title="Toggle detailed explanations for all dorks in this group"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden xs:inline">{expandAllTips ? "Collapse Explanations" : "Explain All"}</span>
              <span className="xs:hidden">{expandAllTips ? "Collapse" : "Explain All"}</span>
            </button>
            <button
              onClick={() => copy(allQ, "all")}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
            >
              {copiedKey === "all" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              Copy all ({dorks.length})
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto pr-0.5 pb-1">
          {dorks.map((d, idx) => (
            <DorkCard
              key={idx}
              query={buildFinderQuery(d.query, keyword)}
              what={d.what}
              severity={d.severity}
              engine={d.engine ?? "google"}
              tip={d.tip}
              codeColor="text-amber-300/90"
              engineBtnClass={ENGINE_STYLE[d.engine ?? "google"]}
              cardKey={`${group.id}-${idx}`}
              onCopy={copy}
              copiedKey={copiedKey}
              forceExpandExplain={expandAllTips}
            />
          ))}
        </div>
        <p className="mt-2 shrink-0 text-[10px] text-slate-600">
          Only hunt targets with explicit permission. Verify scope before any active testing.
        </p>
      </div>
    );
  }

  // ─── Sidebar category list (desktop) ────────────────────────────────────────
  function DesktopSidebar() {
    const items =
      mode === "vuln"   ? DORK_GROUPS.map((g) => ({ ...g, emoji: undefined })) :
      mode === "recon"  ? TARGET_RECON_GROUPS.map((g) => ({ ...g, emoji: undefined })) :
      TARGET_FINDER_GROUPS;

    const activeId = mode === "vuln" ? activeVuln : mode === "recon" ? activeRecon : activeFinder;
    const setActive = mode === "vuln" ? setActiveVuln : mode === "recon" ? setActiveRecon : setActiveFinder;
    const activeItemClass =
      mode === "vuln"   ? "bg-violet-500/15 text-violet-300" :
      mode === "recon"  ? "bg-emerald-500/15 text-emerald-300" :
      "bg-amber-500/15 text-amber-300";

    const label =
      mode === "vuln"  ? `Vuln (${DORK_GROUPS.length})` :
      mode === "recon" ? `Recon (${TARGET_RECON_GROUPS.length})` :
      `Finder (${TARGET_FINDER_GROUPS.length})`;

    return (
      <div className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-border md:bg-slate-950/40">
        <span className="px-3 pt-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {items.map((g) => (
            <button
              key={g.id}
              onClick={() => setActive(g.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                g.id === activeId ? `font-semibold ${activeItemClass}` : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span className="truncate">
                {"emoji" in g && g.emoji ? `${g.emoji} ` : ""}{g.name}
              </span>
              <span className="ml-2 shrink-0 font-mono text-[10px] text-slate-600">{g.dorks.length}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4">
      {/* Modal shell — full screen on mobile, constrained on desktop */}
      <div className="flex w-full flex-col rounded-t-2xl border border-border bg-card shadow-2xl sm:h-[88vh] sm:max-w-5xl sm:rounded-xl"
        style={{ maxHeight: "calc(100dvh - env(safe-area-inset-bottom, 0px))", height: "92dvh" }}>

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <SearchCode className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-100 sm:text-base">Dork Generator</h2>
              <p className="hidden text-[10px] text-slate-400 sm:block">
                Vulnerability dorks · Target recon · Find hunting targets
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Mode switcher ── */}
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border px-4 py-2 sm:gap-2 sm:px-5"
          style={{ scrollbarWidth: "none" }}>
          {(
            [
              { id: "vuln",   label: "Vuln Dorks",    Icon: ShieldAlert, count: DORK_GROUPS.length,          cls: "bg-violet-500/20 text-violet-300 ring-violet-500/40" },
              { id: "recon",  label: "Target Recon",  Icon: Target,      count: TARGET_RECON_GROUPS.length,  cls: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40" },
              { id: "finder", label: "Find Targets",  Icon: Crosshair,   count: TARGET_FINDER_GROUPS.length, cls: "bg-amber-500/20 text-amber-300 ring-amber-500/40" },
            ] as const
          ).map(({ id, label, Icon, count, cls }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition sm:text-xs ${
                mode === id ? `${cls} ring-1` : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline sm:inline">{label}</span>
              <span className="inline xs:hidden sm:hidden">{label.split(" ")[0]}</span>
              <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${mode === id ? "" : "bg-white/5"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Input bar ── */}
        <div className="shrink-0 border-b border-border px-4 py-2.5 sm:px-5 sm:py-3">
          {mode === "finder" ? (
            <>
              <label className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>
                  Sector / Keyword
                  <span className="ml-1 font-normal normal-case text-slate-600">— optional, leave blank for generic</span>
                </span>
                <span className="font-normal normal-case text-slate-500 hidden sm:inline">
                  Tip: Hold <kbd className="rounded border border-slate-700 bg-slate-900 px-1 py-0.2 font-mono text-[9px] text-slate-300">⌘</kbd> / Middle-click to open in background
                </span>
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="fintech · healthcare · crypto · saas · gaming"
                className="w-full rounded-md border border-amber-500/20 bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </>
          ) : (
            <>
              <label className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>{mode === "vuln" ? "Target domain" : "Company name or domain"}</span>
                <span className="font-normal normal-case text-slate-500 hidden sm:inline">
                  Tip: Hold <kbd className="rounded border border-slate-700 bg-slate-900 px-1 py-0.2 font-mono text-[9px] text-slate-300">⌘</kbd> / Middle-click to open in background
                </span>
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === "vuln" ? "example.com" : "acmecorp  or  example.com"}
                className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-violet-500"
              />
            </>
          )}
        </div>

        {/* ── Mobile: horizontal category tab strip ── */}
        {mode === "vuln" && (
          <CategoryTabs
            groups={DORK_GROUPS}
            activeId={activeVuln}
            onSelect={setActiveVuln}
            activeClass="bg-violet-500/20 text-violet-300"
          />
        )}
        {mode === "recon" && (
          <CategoryTabs
            groups={TARGET_RECON_GROUPS}
            activeId={activeRecon}
            onSelect={setActiveRecon}
            activeClass="bg-emerald-500/20 text-emerald-300"
          />
        )}
        {mode === "finder" && (
          <CategoryTabs
            groups={TARGET_FINDER_GROUPS.map((g) => ({ ...g }))}
            activeId={activeFinder}
            onSelect={setActiveFinder}
            activeClass="bg-amber-500/20 text-amber-300"
          />
        )}

        {/* ── Body: desktop sidebar + dork list ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <DesktopSidebar />

          {/* Dork list panel */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
            {mode === "vuln"   && renderDorkList(vulnGroup,  (q) => buildQuery(q, domain), "text-violet-300/90")}
            {mode === "recon"  && renderDorkList(reconGroup, (q) => buildQuery(q, domain), "text-emerald-300/90")}
            {mode === "finder" && renderFinderList(finderGroup)}
          </div>
        </div>
      </div>
    </div>
  );
}
