import { useState, useMemo } from "react";
import {
  CreditCard,
  Zap,
  ShieldAlert,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  FileText,
  Lightbulb,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Lock,
} from "lucide-react";
import {
  FINTECH_VULN_CLASSES,
  FINTECH_METHODOLOGY_PHASES,
  FINTECH_TOOLS_STASH,
  FINTECH_REPORT_TEMPLATES,
} from "@/learn/data/fintechData";
import { type Lang, LEARN_LANGS, localize } from "@/learn/data/types";

interface FintechPlaybookViewProps {
  onPractice?: (categoryId: string) => void;
}

const LANG_KEY = "learn.lang";
function loadLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "en" || v === "simple" || v === "hi") return v;
  } catch {
    /* ignore */
  }
  return "en";
}

type TabMode = "vulnerabilities" | "methodology" | "lab" | "mobile" | "reports";

export function FintechPlaybookView({ onPractice }: FintechPlaybookViewProps) {
  const [lang, setLangState] = useState<Lang>(loadLang);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };
  const [activeTab, setActiveTab] = useState<TabMode>("vulnerabilities");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(FINTECH_VULN_CLASSES[0].id);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const filteredVulns = useMemo(() => {
    if (!searchQuery.trim()) return FINTECH_VULN_CLASSES;
    const q = searchQuery.toLowerCase();
    return FINTECH_VULN_CLASSES.filter((v) => {
      const title = localize(v.title, lang).toLowerCase();
      const summary = localize(v.summary, lang).toLowerCase();
      const cwe = v.cwe.toLowerCase();
      return title.includes(q) || summary.includes(q) || cwe.includes(q);
    });
  }, [searchQuery, lang]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                <CreditCard className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                Sector Masterclass
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                P1 Bounties: $2,500 – $25,000+
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              🏦 Fintech Bug Hunting Playbook
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-400 leading-relaxed">
              High-yield attack methodologies, business logic exploits, race conditions, and payment gateway flaws tailored for banking, wallet, and financial technology targets.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex rounded-lg border border-border bg-slate-950 p-1">
            {LEARN_LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  lang === l.id ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {l.short}
              </button>
            ))}
          </div>
        </div>

        {/* Quick KPI stats row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-cyan-500/15 pt-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Average P1 Payout
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-emerald-300">$5,000 – $15,000</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Top Bug Probability
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-amber-300">Race & Amount Tampering</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Lock className="h-3.5 w-3.5 text-cyan-400" />
              Primary Attack Surface
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-cyan-300">Payment APIs & Wallets</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Triage Priority
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-rose-300">Critical / High Severity</p>
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("vulnerabilities")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "vulnerabilities"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>High-Yield Vulnerabilities ({FINTECH_VULN_CLASSES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("methodology")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "methodology"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>48-Hour Fast Methodology</span>
          </button>
          <button
            onClick={() => setActiveTab("lab")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "lab"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Turbo Intruder & Tools</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "reports"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>P1 Report Drafts ({FINTECH_REPORT_TEMPLATES.length})</span>
          </button>
        </div>

        {/* Search */}
        {activeTab === "vulnerabilities" && (
          <div className="relative min-w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fintech attack vectors..."
              className="w-full rounded-lg border border-border bg-slate-950 py-1 pl-8 pr-3 text-xs text-slate-200 outline-none focus:border-cyan-500"
            />
          </div>
        )}
      </div>

      {/* ── Tab Content 1: High-Yield Vulnerabilities ── */}
      {activeTab === "vulnerabilities" && (
        <div className="space-y-4">
          {filteredVulns.map((vuln) => {
            const isExpanded = expandedCard === vuln.id;
            return (
              <div
                key={vuln.id}
                className="overflow-hidden rounded-xl border border-border bg-slate-950 transition hover:border-slate-800"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedCard(isExpanded ? null : vuln.id)}
                  className="flex cursor-pointer items-start justify-between gap-3 p-4 hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300">
                        {vuln.severity}
                      </span>
                      <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                        {vuln.bountyRange}
                      </span>
                      <span className="text-[10.5px] font-mono text-slate-500">
                        {vuln.cwe}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-100 sm:text-lg">
                      {localize(vuln.title, lang)}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {localize(vuln.summary, lang)}
                    </p>
                  </div>

                  <button className="rounded p-1 text-slate-500 hover:text-slate-300 shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border bg-slate-900/40 p-4 space-y-5">
                    {/* Real-World Scenarios */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2.5 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Real-World Attack Scenarios
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {vuln.scenarios.map((sc, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-2"
                          >
                            <div className="font-bold text-slate-200">
                              {idx + 1}. {localize(sc.title, lang)}
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">
                              {localize(sc.description, lang)}
                            </p>
                            {sc.requestSample && (
                              <div className="relative rounded border border-slate-800 bg-slate-900/90 p-2 font-mono text-[10px] text-cyan-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(sc.requestSample!, `req-${vuln.id}-${idx}`);
                                  }}
                                  className="absolute top-1.5 right-1.5 rounded p-1 text-slate-500 hover:text-emerald-400"
                                  title="Copy raw request"
                                >
                                  {copiedKey === `req-${vuln.id}-${idx}` ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                                <pre className="overflow-x-auto whitespace-pre-wrap">{sc.requestSample}</pre>
                              </div>
                            )}
                            <div className="rounded bg-rose-500/10 border border-rose-500/20 p-1.5 text-[10.5px] text-rose-300">
                              <strong>Impact:</strong> {localize(sc.impact, lang)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step-by-Step Testing Recipe */}
                    <div className="border-t border-slate-800/80 pt-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        Step-by-Step Testing Recipe
                      </h3>
                      <ol className="space-y-1.5 text-xs text-slate-300">
                        {vuln.testingRecipe.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{localize(step, lang)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Pro Hunter Advice */}
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5">
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-300">Pro Hunter Secret & Safe Harbor:</p>
                        <p className="text-[11.5px] text-amber-200/80 leading-relaxed mt-0.5">
                          {localize(vuln.hunterProTip, lang)}
                        </p>
                      </div>
                    </div>

                    {/* Practice button */}
                    {onPractice && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => onPractice("business_logic")}
                          className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                        >
                          <span>Practice in Checklist</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab Content 2: 48-Hour Fast Methodology ── */}
      {activeTab === "methodology" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h2 className="text-base font-bold text-slate-200 mb-1">
              🎯 Fast-Track Methodology: Zero to P1 in 48 Hours
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fintech applications are complex distributed systems. Following this systematic 5-phase methodology ensures you hit high-impact business logic before automated scanners even finish subdomain discovery.
            </p>
          </div>

          <div className="space-y-4">
            {FINTECH_METHODOLOGY_PHASES.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-xl border border-border bg-slate-950 p-5 space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-xs font-bold text-cyan-400">
                    P{phase.phase}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">
                      Phase {phase.phase}: {localize(phase.title, lang)}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {localize(phase.objective, lang)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Action Checklist
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {phase.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                          <span>{localize(step, lang)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      High-Yield Target Endpoints
                    </p>
                    <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                      {phase.keyTargets.map((kt, idx) => (
                        <li key={idx} className="truncate rounded bg-slate-950 px-2 py-1 border border-slate-800/60">
                          {kt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Content 3: Turbo Intruder & Tools ── */}
      {activeTab === "lab" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h2 className="text-base font-bold text-slate-200 mb-1">
              ⚡ Fintech Attack Lab & Automation Scripts
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Production-ready scripts for Burp Suite Turbo Intruder and Frida. Use these tools to automate race conditions and mobile app SSL interception in under 2 minutes.
            </p>
          </div>

          <div className="space-y-4">
            {FINTECH_TOOLS_STASH.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl border border-border bg-slate-950 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">
                      {localize(tool.title, lang)}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {localize(tool.description, lang)}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(tool.code, tool.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
                  >
                    {copiedKey === tool.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-lg border border-slate-800 bg-slate-900/90 p-3 font-mono text-[11px] text-cyan-300">
                  <pre className="overflow-x-auto whitespace-pre">{tool.code}</pre>
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-200/90 flex items-center gap-2">
                  <Terminal className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Usage:</strong> {localize(tool.howToUse, lang)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Content 4: P1 Report Drafts ── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h2 className="text-base font-bold text-slate-200 mb-1">
              📝 High-Impact P1 Report Drafts
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standardized HackerOne / Bugcrowd report markdown templates with pre-calculated CVSS scores. Fill in your target endpoints to submit immediately.
            </p>
          </div>

          <div className="space-y-4">
            {FINTECH_REPORT_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-xl border border-border bg-slate-950 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">
                        {tpl.severity}
                      </span>
                      <span className="text-xs font-mono text-cyan-300">
                        CVSS: {tpl.cvss}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200">
                      {localize(tpl.title, lang)}
                    </h3>
                  </div>
                  <button
                    onClick={() => copyToClipboard(tpl.reportMarkdown, tpl.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    {copiedKey === tpl.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied Markdown!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Report</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-lg border border-slate-800 bg-slate-900/90 p-4 font-mono text-[11px] text-slate-300">
                  <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {tpl.reportMarkdown}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
