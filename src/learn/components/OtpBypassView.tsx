import { useState, useMemo } from "react";
import {
  KeyRound,
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
  Layers,
  Lock,
} from "lucide-react";
import {
  OTP_TECHNIQUES,
  OTP_METHODOLOGY_PHASES,
  OTP_TOOLS_STASH,
  OTP_REPORT_TEMPLATES,
} from "@/learn/data/otpBypassData";
import { type Lang, LEARN_LANGS, localize } from "@/learn/data/types";

interface OtpBypassViewProps {
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

type TabMode = "techniques" | "methodology" | "lab" | "reports";

export function OtpBypassView({ onPractice }: OtpBypassViewProps) {
  const [lang, setLangState] = useState<Lang>(loadLang);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const [activeTab, setActiveTab] = useState<TabMode>("techniques");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(OTP_TECHNIQUES[0].id);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyCode(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  }

  // Filtered techniques based on search
  const filteredTechniques = useMemo(() => {
    if (!searchQuery.trim()) return OTP_TECHNIQUES;
    const q = searchQuery.toLowerCase();
    return OTP_TECHNIQUES.filter((tech) => {
      const titleMatch = localize(tech.title, lang).toLowerCase().includes(q);
      const summaryMatch = localize(tech.summary, lang).toLowerCase().includes(q);
      const scenariosMatch = tech.scenarios.some(
        (s) =>
          localize(s.title, lang).toLowerCase().includes(q) ||
          localize(s.description, lang).toLowerCase().includes(q)
      );
      return titleMatch || summaryMatch || scenariosMatch;
    });
  }, [searchQuery, lang]);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-card to-card p-6 shadow-2xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <KeyRound className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>2FA, OTP & Rate-Limit Bypass Playbook</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
              🔐 2FA, OTP & Rate-Limit Bypass Field Guide
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Real-world methods to bypass Two-Factor Authentication, manipulate client-side status responses, spoof anti-brute-force IP headers, and exploit single-packet race conditions.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-slate-900/80 p-1 self-start sm:self-auto">
            {LEARN_LANGS.map((item) => (
              <button
                key={item.id}
                onClick={() => setLang(item.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  lang === item.id
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/80 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Zap className="h-4 w-4" /> 5 Core Bypasses
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Response tampering, IP rotation, race conditions & state bypasses
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold">
              <Layers className="h-4 w-4" /> 5-Phase Methodology
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Flow Discovery → Tampering → IP Spoofing → Race → Enforcement
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
              <Terminal className="h-4 w-4" /> Automation Tool Stash
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Python IP rotator & Turbo Intruder H2 single-packet script
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4" /> P1 Report Templates
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Ready-to-submit HackerOne & Bugcrowd markdown drafts
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("techniques")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "techniques"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Techniques & Bypasses ({filteredTechniques.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("methodology")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "methodology"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>5-Phase Methodology</span>
          </button>

          <button
            onClick={() => setActiveTab("lab")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "lab"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Scripts & Tools Stash</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "reports"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Bounty Reports</span>
          </button>
        </div>

        {/* Filter Input for Techniques */}
        {activeTab === "techniques" && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search response tampering, IP spoof, race..."
              className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* ─── TAB 1: TECHNIQUES & BYPASSES ───────────────────────────────────── */}
      {activeTab === "techniques" && (
        <div className="space-y-4">
          {filteredTechniques.map((tech) => {
            const isExpanded = expandedCard === tech.id;
            return (
              <div
                key={tech.id}
                className="overflow-hidden rounded-xl border border-border bg-card transition hover:border-border/90"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedCard(isExpanded ? null : tech.id)}
                  className="flex cursor-pointer items-start justify-between gap-4 p-5 hover:bg-white/[0.02]"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {tech.category.replace("_", " ")}
                      </span>
                      <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                        {tech.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <TrendingUp className="h-3 w-3" />
                        {tech.successRate}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-100">
                      {localize(tech.title, lang)}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                      {localize(tech.summary, lang)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    aria-label={isExpanded ? "Collapse card" : "Expand card"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border/80 bg-slate-950/40 p-5 space-y-6">
                    {/* Hunter Pro Tip Banner */}
                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-200">
                      <Sparkles className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-300">Hunter Field Secret: </span>
                        {localize(tech.hunterProTip, lang)}
                      </div>
                    </div>

                    {/* Attack Scenarios */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-emerald-400" /> Real-World Attack Scenarios
                      </h3>
                      <div className="space-y-4">
                        {tech.scenarios.map((sc, sIdx) => (
                          <div
                            key={sIdx}
                            className="rounded-lg border border-border/80 bg-card p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs font-bold text-slate-200">
                                #{sIdx + 1}: {localize(sc.title, lang)}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-mono">Scenario</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {localize(sc.description, lang)}
                            </p>

                            {/* Command or Raw HTTP */}
                            {sc.commandOrRequest && (
                              <div className="relative">
                                <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-t-lg border-b border-border/60">
                                  <span className="text-[10px] font-mono text-slate-400">
                                    Attack Request / PoC
                                  </span>
                                  <button
                                    onClick={() =>
                                      copyCode(
                                        `sc-req-${tech.id}-${sIdx}`,
                                        sc.commandOrRequest!
                                      )
                                    }
                                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400"
                                  >
                                    {copiedKey === `sc-req-${tech.id}-${sIdx}` ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="overflow-x-auto rounded-b-lg bg-slate-950 p-3 text-[11px] font-mono text-emerald-300/90 leading-normal border border-t-0 border-border/60">
                                  {sc.commandOrRequest}
                                </pre>
                              </div>
                            )}

                            {/* Response sample */}
                            {sc.responseSample && (
                              <div className="relative">
                                <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-t-lg border-b border-border/60">
                                  <span className="text-[10px] font-mono text-emerald-400">
                                    Manipulated Server Response (Bypass Result)
                                  </span>
                                  <button
                                    onClick={() =>
                                      copyCode(
                                        `sc-res-${tech.id}-${sIdx}`,
                                        sc.responseSample!
                                      )
                                    }
                                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400"
                                  >
                                    {copiedKey === `sc-res-${tech.id}-${sIdx}` ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="overflow-x-auto rounded-b-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 leading-normal border border-t-0 border-border/60">
                                  {sc.responseSample}
                                </pre>
                              </div>
                            )}

                            <div className="rounded border border-red-500/20 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                              <span className="font-bold text-red-400">Impact: </span>
                              {localize(sc.impact, lang)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step-by-Step Recipe */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> Execution Recipe
                      </h3>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 bg-card p-3 rounded-lg border border-border/70">
                        {tech.stepByStepRecipe.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {localize(step, lang)}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Burp & Tool Rules */}
                    {tech.burpOrToolRule.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5 text-purple-400" /> Automation & Tool Commands
                        </h3>
                        <div className="space-y-1.5">
                          {tech.burpOrToolRule.map((rule, rIdx) => (
                            <div
                              key={rIdx}
                              className="flex items-center justify-between rounded bg-slate-900 px-3 py-2 text-xs font-mono text-slate-300 border border-border/70"
                            >
                              <span className="truncate">{rule}</span>
                              <button
                                onClick={() => copyCode(`rule-${tech.id}-${rIdx}`, rule)}
                                className="ml-2 text-slate-400 hover:text-emerald-400 shrink-0"
                              >
                                {copiedKey === `rule-${tech.id}-${rIdx}` ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Practice Jump */}
                    {onPractice && (
                      <div className="pt-2">
                        <button
                          onClick={() => onPractice("auth")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                        >
                          <span>Practice Authentication Checks on Target</span>
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

      {/* ─── TAB 2: 5-PHASE METHODOLOGY ─────────────────────────────────────── */}
      {activeTab === "methodology" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-xs text-emerald-200">
            <span className="font-bold text-emerald-300">Methodology Blueprint: </span>
            Execute this comprehensive 5-phase testing protocol on all 2FA, OTP, and password reset workflows. Start with response manipulation, followed by anti-brute-force headers, and finish with single-packet concurrency testing.
          </div>

          <div className="space-y-4">
            {OTP_METHODOLOGY_PHASES.map((phase) => (
              <div
                key={phase.phase}
                className="overflow-hidden rounded-xl border border-border bg-card p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black text-xs">
                      {phase.phase}
                    </span>
                    <h2 className="text-sm font-bold text-slate-100">
                      {localize(phase.title, lang)}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Methodology Step</span>
                </div>

                <p className="text-xs text-slate-400 font-medium">
                  🎯 <span className="text-slate-300">Objective: </span>
                  {localize(phase.objective, lang)}
                </p>

                {/* Steps */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Actionable Procedures
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {phase.steps.map((st, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{localize(st, lang)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Commands */}
                {phase.commandsOrPayloads && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Key Commands & Headers
                    </h4>
                    {phase.commandsOrPayloads.map((cmd, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-center justify-between rounded bg-slate-950 px-3 py-2 text-xs font-mono text-emerald-300 border border-border/60"
                      >
                        <span className="truncate">{cmd}</span>
                        <button
                          onClick={() => copyCode(`phase-cmd-${phase.phase}-${cIdx}`, cmd)}
                          className="ml-2 text-slate-400 hover:text-emerald-400 shrink-0"
                        >
                          {copiedKey === `phase-cmd-${phase.phase}-${cIdx}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Target checklist tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">Key Focus:</span>
                  {phase.keyTargets.map((kt, kIdx) => (
                    <span
                      key={kIdx}
                      className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700"
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

      {/* ─── TAB 3: TOOLS & SCRIPTS STASH ───────────────────────────────────── */}
      {activeTab === "lab" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              2FA & OTP Automation Scripts Stash
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Ready-to-use tools to automate OTP brute forcing with IP header rotation and execute concurrent single-packet race condition attacks.
            </p>
          </div>

          <div className="space-y-6">
            {OTP_TOOLS_STASH.map((tool) => (
              <div
                key={tool.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-border bg-slate-900/80 px-4 py-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">
                      {localize(tool.title, lang)}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {localize(tool.description, lang)}
                    </p>
                  </div>
                  <button
                    onClick={() => copyCode(tool.id, tool.code)}
                    className="flex items-center gap-1.5 rounded border border-border bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-emerald-400 transition"
                  >
                    {copiedKey === tool.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="overflow-x-auto bg-slate-950 p-4 text-xs font-mono text-emerald-300 leading-relaxed max-h-96">
                  {tool.code}
                </pre>

                <div className="border-t border-border/80 bg-slate-900/50 px-4 py-2 text-[11px] text-slate-400 flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-slate-300">How to use: </strong>
                    {localize(tool.howToUse, lang)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: BOUNTY REPORTS ─────────────────────────────────────────── */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-400" />
              Pre-Drafted Vulnerability Disclosure Reports
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Formatted according to HackerOne, Bugcrowd, and Intigriti triage standards. Replace placeholders like <code className="text-emerald-300 font-mono">{"{TARGET_DOMAIN}"}</code> and <code className="text-emerald-300 font-mono">{"{VICTIM_USER_ID}"}</code> with your verified proof of concept.
            </p>
          </div>

          <div className="space-y-6">
            {OTP_REPORT_TEMPLATES.map((report) => (
              <div
                key={report.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-slate-900/80 px-4 py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                        {report.severity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {report.cvss}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • {report.vulnType}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-200">
                      {localize(report.title, lang)}
                    </h3>
                  </div>

                  <button
                    onClick={() => copyCode(report.id, report.reportMarkdown)}
                    className="flex items-center gap-1.5 rounded border border-border bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-emerald-400 transition"
                  >
                    {copiedKey === report.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied Markdown!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Report</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-950 p-4">
                  <pre className="overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap max-h-96">
                    {report.reportMarkdown}
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
