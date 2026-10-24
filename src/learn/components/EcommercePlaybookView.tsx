import { useState, useMemo } from "react";
import {
  ShoppingBag,
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
  TrendingUp,
  Tag,
  CreditCard,
} from "lucide-react";
import {
  ECOMMERCE_VULN_CLASSES,
  ECOMMERCE_METHODOLOGY_PHASES,
  ECOMMERCE_TOOLS_STASH,
  ECOMMERCE_REPORT_TEMPLATES,
} from "@/learn/data/ecommerceData";
import { type Lang, LEARN_LANGS, localize } from "@/learn/data/types";
import {
  useTargetContext,
  interpolateTargetVars,
} from "@/shared/store/useTargetContext";

interface EcommercePlaybookViewProps {
  onPractice?: (categoryId: string) => void;
  onNavigateToChecklist?: () => void;
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

type TabMode = "vulnerabilities" | "methodology" | "tools" | "reports";

export function EcommercePlaybookView({
  onPractice: _onPractice,
  onNavigateToChecklist: _onNavigateToChecklist,
}: EcommercePlaybookViewProps) {
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
  const [expandedCard, setExpandedCard] = useState<string | null>(
    ECOMMERCE_VULN_CLASSES[0]?.id || null
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Target context for auto-interpolation in report templates and commands
  const targetDomain = useTargetContext((s) => s.targetDomain);
  const subdomain = useTargetContext((s) => s.subdomain);
  const originIp = useTargetContext((s) => s.originIp);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const filteredVulns = useMemo(() => {
    if (!searchQuery.trim()) return ECOMMERCE_VULN_CLASSES;
    const q = searchQuery.toLowerCase();
    return ECOMMERCE_VULN_CLASSES.filter((v) => {
      const title = localize(v.title, lang).toLowerCase();
      const summary = localize(v.summary, lang).toLowerCase();
      const cwe = v.cwe.toLowerCase();
      return title.includes(q) || summary.includes(q) || cwe.includes(q);
    });
  }, [searchQuery, lang]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                E-Commerce & Retail Security
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                P1 Bounties: $2,500 – $20,000+
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              🛒 E-Commerce & Retail Security Playbook
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-400 leading-relaxed">
              Price manipulation, negative quantity cart overflows, coupon race conditions, payment gateway webhook forgery, and in-flight shipping address hijacking across modern online stores.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-slate-950/80 p-1">
            {LEARN_LANGS.map((item) => (
              <button
                key={item.id}
                onClick={() => setLang(item.id)}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                  lang === item.id
                    ? "bg-amber-500 text-black shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick KPI stats banner */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Average P1 Payout
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-emerald-300">
              $3,000 – $15,000
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              Top Bug Probability
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-amber-300">
              Coupon Race & Negative Qty
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <CreditCard className="h-3.5 w-3.5 text-cyan-400" />
              Primary Attack Surface
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-cyan-300">
              Checkout & Webhooks
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Triage Priority
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-rose-300">
              Critical Business Logic
            </p>
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
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>High-Yield Vulnerabilities ({ECOMMERCE_VULN_CLASSES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("methodology")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "methodology"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>5-Phase Methodology</span>
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "tools"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Scripts & Burp Rules ({ECOMMERCE_TOOLS_STASH.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "reports"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>P1/P2 Report Templates ({ECOMMERCE_REPORT_TEMPLATES.length})</span>
          </button>
        </div>

        {activeTab === "vulnerabilities" && (
          <div className="relative min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter e-commerce bugs..."
              className="w-full rounded-lg border border-border bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* ── TAB 1: VULNERABILITIES ── */}
      {activeTab === "vulnerabilities" && (
        <div className="space-y-4">
          {filteredVulns.map((vuln) => {
            const isExpanded = expandedCard === vuln.id;
            return (
              <div
                key={vuln.id}
                className="overflow-hidden rounded-xl border border-border bg-card/60 transition hover:border-slate-700"
              >
                <div
                  onClick={() => setExpandedCard(isExpanded ? null : vuln.id)}
                  className="flex cursor-pointer items-start justify-between gap-4 p-4 sm:p-5"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          vuln.severity === "critical"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {vuln.severity}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                        {vuln.cwe}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-400">
                        💰 {vuln.bountyRange}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-white sm:text-lg">
                      {localize(vuln.title, lang)}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {localize(vuln.summary, lang)}
                    </p>
                  </div>
                  <div className="shrink-0 p-1 text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {/* Expanded Card Details */}
                {isExpanded && (
                  <div className="space-y-5 border-t border-border/70 bg-slate-950/40 p-4 sm:p-6">
                    {/* Real-World Scenarios */}
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                        <Sparkles className="h-4 w-4" />
                        Real-World Attack Scenarios ({vuln.scenarios.length})
                      </h4>
                      <div className="space-y-3">
                        {vuln.scenarios.map((scen, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3.5 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-200">
                                📌 {localize(scen.title, lang)}
                              </span>
                              <span className="text-[10px] font-semibold text-rose-400">
                                {localize(scen.impact, lang)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {localize(scen.description, lang)}
                            </p>

                            {/* Request / Response Samples */}
                            {scen.requestSample && (
                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span className="font-mono text-cyan-400">
                                    Tampered Request
                                  </span>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        scen.requestSample!,
                                        `req-${vuln.id}-${idx}`
                                      )
                                    }
                                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                                  >
                                    {copiedKey === `req-${vuln.id}-${idx}` ? (
                                      <Check className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <pre className="overflow-x-auto rounded-md border border-slate-800 bg-black/50 p-2.5 font-mono text-[11px] text-amber-200/90 whitespace-pre-wrap select-all">
                                  {scen.requestSample}
                                </pre>
                              </div>
                            )}

                            {scen.responseSample && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-mono text-emerald-400">
                                  Vulnerable Server Response
                                </div>
                                <pre className="overflow-x-auto rounded-md border border-slate-800 bg-black/40 p-2.5 font-mono text-[11px] text-emerald-300/90 whitespace-pre-wrap select-all">
                                  {scen.responseSample}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step-by-Step Testing Recipe */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        🎯 Step-by-Step Testing Recipe
                      </h4>
                      <ol className="space-y-1.5 text-xs text-slate-300">
                        {vuln.testingRecipe.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-amber-400">
                              {i + 1}
                            </span>
                            <span>{localize(rec, lang)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Hunter Pro Tip */}
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">
                          Bounty Pro-Tip:{" "}
                        </span>
                        <span>{localize(vuln.hunterProTip, lang)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: METHODOLOGY ── */}
      {activeTab === "methodology" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-slate-900/40 p-4 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-amber-400">
              E-Commerce Attack Strategy:
            </span>{" "}
            Follow this 5-phase systematic audit to cover the full shopping cycle from product selection, cart pricing, promo codes, gateway webhooks, all the way to returns and refunds.
          </div>

          <div className="space-y-4">
            {ECOMMERCE_METHODOLOGY_PHASES.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-xs font-bold text-amber-400 border border-amber-500/20">
                    P{phase.phase}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {localize(phase.title, lang)}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {localize(phase.objective, lang)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pl-9">
                  {phase.steps.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-300"
                    >
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{localize(st, lang)}</span>
                    </div>
                  ))}
                </div>

                {phase.commandsOrPayloads && (
                  <div className="pl-9 pt-1">
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-black/60 p-2.5 font-mono text-xs text-cyan-300 select-all">
                      {phase.commandsOrPayloads.join("\n")}
                    </pre>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 pl-9 pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Key Targets:
                  </span>
                  {phase.keyTargets.map((kt, i) => (
                    <span
                      key={i}
                      className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                    >
                      {kt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: TOOLS & SCRIPTS ── */}
      {activeTab === "tools" && (
        <div className="space-y-4">
          {ECOMMERCE_TOOLS_STASH.map((tool) => (
            <div
              key={tool.id}
              className="rounded-xl border border-border bg-card p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {localize(tool.title, lang)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {localize(tool.description, lang)}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(tool.code, tool.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  {copiedKey === tool.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied Code</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-lg border border-slate-800 bg-black/70 p-3">
                <pre className="overflow-x-auto font-mono text-xs text-amber-200/90 whitespace-pre-wrap select-all">
                  {tool.code}
                </pre>
              </div>

              <div className="text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">How to use: </span>
                <span>{localize(tool.howToUse, lang)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 4: REPORT TEMPLATES ── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 text-xs text-cyan-200/90">
            <span className="font-bold text-cyan-300">
              Auto-Interpolated Reports:
            </span>{" "}
            These bug bounty reports automatically replace placeholders with your current live target domain (
            <span className="font-mono text-white font-bold">
              {targetDomain || "target.com"}
            </span>
            ). Ready to paste directly into HackerOne or Bugcrowd.
          </div>

          <div className="space-y-4">
            {ECOMMERCE_REPORT_TEMPLATES.map((tmpl) => {
              const interpolatedReport = interpolateTargetVars(
                tmpl.reportMarkdown,
                { targetDomain, subdomain, originIp }
              );

              return (
                <div
                  key={tmpl.id}
                  className="rounded-xl border border-border bg-card p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            tmpl.severity === "critical"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {tmpl.severity.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {tmpl.cvss}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">
                        {localize(tmpl.title, lang)}
                      </h3>
                    </div>

                    <button
                      onClick={() =>
                        copyToClipboard(interpolatedReport, `report-${tmpl.id}`)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                    >
                      {copiedKey === `report-${tmpl.id}` ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied Report</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Report Markdown</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-black/60 p-3 scrollbar-thin">
                    <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap select-all">
                      {interpolatedReport}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
