import { useState, useMemo } from "react";
import {
  ShieldAlert,
  Zap,
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
  KeyRound,
  Layers,
  LockOpen,
} from "lucide-react";
import {
  FORBIDDEN_TECHNIQUES,
  FORBIDDEN_METHODOLOGY_PHASES,
  FORBIDDEN_TOOLS_STASH,
  FORBIDDEN_REPORT_TEMPLATES,
} from "@/learn/data/forbiddenBypassData";
import { type Lang, LEARN_LANGS, localize } from "@/learn/data/types";

interface ForbiddenBypassViewProps {
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

export function ForbiddenBypassView({ onPractice }: ForbiddenBypassViewProps) {
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
  const [expandedCard, setExpandedCard] = useState<string | null>(FORBIDDEN_TECHNIQUES[0].id);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const filteredTechniques = useMemo(() => {
    if (!searchQuery.trim()) return FORBIDDEN_TECHNIQUES;
    const q = searchQuery.toLowerCase();
    return FORBIDDEN_TECHNIQUES.filter((tech) => {
      const title = localize(tech.title, lang).toLowerCase();
      const summary = localize(tech.summary, lang).toLowerCase();
      const category = tech.category.toLowerCase();
      return title.includes(q) || summary.includes(q) || category.includes(q);
    });
  }, [searchQuery, lang]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/25 bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 p-6 shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-12 h-48 w-48 rounded-full bg-red-500/10 blur-2xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
              <LockOpen className="h-3.5 w-3.5 text-rose-400" />
              <span>403 Forbidden & Access Control Buster</span>
              <span className="rounded-full bg-rose-400/20 px-1.5 py-0.2 text-[10px] text-rose-200">
                P1 / P2 Breaker
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              🚪 403 Forbidden & Access Control Bypass Playbook
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-400 leading-relaxed">
              Break past 403 Forbidden and 401 Unauthorized screens on administrative dashboards, internal APIs, and Spring Boot Actuators via Header Injections, Matrix Semicolon Traversal, and Verb Tampering.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex rounded-lg border border-border bg-slate-950 p-1">
            {LEARN_LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  lang === l.id ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {l.short}
              </button>
            ))}
          </div>
        </div>

        {/* Quick KPI stats row */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <KeyRound className="h-3.5 w-3.5 text-rose-400" />
              Primary Vectors
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-rose-300">Headers & Matrix Traversal</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Bypass Success Rate
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-emerald-300">45% – 60% on Restricted Routes</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Target Surface
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-amber-300">Admin Panels & Actuators</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Triage Severity
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold text-rose-300">P1 / P2 Broken Access Control</p>
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("techniques")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "techniques"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <LockOpen className="h-4 w-4" />
            <span>403 Bypasses & Vectors ({FORBIDDEN_TECHNIQUES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("methodology")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "methodology"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>5-Phase Hunting Roadmap</span>
          </button>
          <button
            onClick={() => setActiveTab("lab")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "lab"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Attack Lab & Scripts</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "reports"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>P1 Report Drafts ({FORBIDDEN_REPORT_TEMPLATES.length})</span>
          </button>
        </div>

        {/* Search */}
        {activeTab === "techniques" && (
          <div className="relative min-w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 403 bypass vectors..."
              className="w-full rounded-lg border border-border bg-slate-950 py-1 pl-8 pr-3 text-xs text-slate-200 outline-none focus:border-rose-500"
            />
          </div>
        )}
      </div>

      {/* ── Tab Content 1: Bypasses & Vectors ── */}
      {activeTab === "techniques" && (
        <div className="space-y-4">
          {filteredTechniques.map((tech) => {
            const isExpanded = expandedCard === tech.id;
            return (
              <div
                key={tech.id}
                className="overflow-hidden rounded-xl border border-border bg-slate-950 transition hover:border-slate-800"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedCard(isExpanded ? null : tech.id)}
                  className="flex cursor-pointer items-start justify-between gap-3 p-4 hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-300">
                        {tech.category.replace("_", " ")}
                      </span>
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {tech.successRate}
                      </span>
                      <span className="text-[10.5px] font-mono text-slate-500 uppercase">
                        Difficulty: {tech.difficulty}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-100 sm:text-lg">
                      {localize(tech.title, lang)}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {localize(tech.summary, lang)}
                    </p>
                  </div>

                  <button className="rounded p-1 text-slate-500 hover:text-slate-300 shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="border-t border-border/80 bg-slate-900/30 p-4 sm:p-5 space-y-6">
                    {/* Hunter Pro Tip Box */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1.5">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span>Hunter Pro Tip (Fast Bounty Multiplier):</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {localize(tech.hunterProTip, lang)}
                      </p>
                    </div>

                    {/* Real-World Attack Scenarios */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-rose-400" />
                        Attack Scenarios & PoC Requests ({tech.scenarios.length})
                      </h3>

                      <div className="grid gap-4 lg:grid-cols-2">
                        {tech.scenarios.map((sc, sidx) => (
                          <div
                            key={sidx}
                            className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-slate-200">
                                {localize(sc.title, lang)}
                              </h4>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {localize(sc.description, lang)}
                              </p>

                              {/* Command / Request sample */}
                              {sc.commandOrRequest && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                                    <span>PoC HTTP Request / Command</span>
                                    <button
                                      onClick={() => copyToClipboard(sc.commandOrRequest!, `cmd-${tech.id}-${sidx}`)}
                                      className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:text-white"
                                    >
                                      {copiedKey === `cmd-${tech.id}-${sidx}` ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                      Copy
                                    </button>
                                  </div>
                                  <pre className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900 p-2.5 font-mono text-[11px] text-rose-300 leading-tight max-h-48 overflow-y-auto">
                                    {sc.commandOrRequest}
                                  </pre>
                                </div>
                              )}

                              {sc.responseSample && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                                    <span>Server Response (200 OK Bypass)</span>
                                  </div>
                                  <pre className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-300 leading-tight max-h-36 overflow-y-auto">
                                    {sc.responseSample}
                                  </pre>
                                </div>
                              )}
                            </div>

                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-2.5 text-[11px] text-emerald-300 mt-2">
                              <span className="font-bold">Impact: </span>
                              {localize(sc.impact, lang)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step-by-Step Recipe */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Step-by-Step Testing Recipe
                      </h3>
                      <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                        {tech.stepByStepRecipe.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-300">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{localize(step, lang)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Burp & Tool Setup */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                        Burp Suite Filters & Tool Rules
                      </h3>
                      <ul className="space-y-1 rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-400">
                        {tech.burpOrToolRule.map((rule, ridx) => (
                          <li key={ridx} className="flex items-start gap-2">
                            <span className="text-rose-400">▹</span>
                            <span className="leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Bottom CTA to practice */}
                    {onPractice && (
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => onPractice("bac")}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/50"
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

      {/* ── Tab Content 2: 5-Phase Systematic Methodology ── */}
      {activeTab === "methodology" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-slate-950 p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              403 Forbidden Penetration 5-Phase Systematic Roadmap
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-3xl">
              When encountering a 403 Forbidden response on high-value paths, don't move on. 403 means the resource exists! Follow this 5-phase roadmap to methodically break past perimeter access control blocks and unmask internal tools.
            </p>
          </div>

          <div className="relative space-y-6 border-l-2 border-rose-500/30 pl-6 ml-3">
            {FORBIDDEN_METHODOLOGY_PHASES.map((phase) => (
              <div key={phase.phase} className="relative space-y-3">
                {/* Timeline node */}
                <div className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-rose-500 bg-slate-950 text-xs font-bold text-rose-300">
                  {phase.phase}
                </div>

                <div className="rounded-xl border border-border bg-slate-950 p-5 space-y-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-100">
                      {localize(phase.title, lang)}
                    </h3>
                    <p className="mt-1 text-xs text-rose-300 font-medium">
                      🎯 {localize(phase.objective, lang)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Execution Steps:
                    </span>
                    <div className="space-y-2">
                      {phase.steps.map((step, sidx) => (
                        <div key={sidx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400">
                            {sidx + 1}
                          </span>
                          <span className="leading-relaxed">{localize(step, lang)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {phase.commandsOrPayloads && phase.commandsOrPayloads.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Terminal Commands / Fuzzing One-Liners</span>
                        <button
                          onClick={() => copyToClipboard(phase.commandsOrPayloads!.join("\n"), `cmd-403-p${phase.phase}`)}
                          className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:text-white"
                        >
                          {copiedKey === `cmd-403-p${phase.phase}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy Script
                        </button>
                      </div>
                      <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-300 leading-relaxed">
                        {phase.commandsOrPayloads.join("\n")}
                      </pre>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500">Key High-Value Targets:</span>
                    {phase.keyTargets.map((kt, kidx) => (
                      <span
                        key={kidx}
                        className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 font-mono text-[11px] text-rose-300"
                      >
                        {kt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Content 3: Attack Lab & Scripts ── */}
      {activeTab === "lab" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-slate-950 p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="h-5 w-5 text-rose-400" />
              ⚡ 403 Forbidden Attack Lab & Automation Tools
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-3xl">
              Drop-in bash and Python scripts designed to test 40+ bypass techniques against any 403 URL, configure Burp Suite to inject localhost headers automatically, and dump Spring Boot Actuator secrets.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {FORBIDDEN_TOOLS_STASH.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl border border-border bg-slate-950 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300">
                      {tool.category.replace("_", " ")}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">
                      {tool.language}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">
                    {localize(tool.title, lang)}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {localize(tool.description, lang)}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Code / Automation Snippet</span>
                      <button
                        onClick={() => copyToClipboard(tool.code, tool.id)}
                        className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:text-white"
                      >
                        {copiedKey === tool.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy Code
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-[11px] text-rose-300 leading-relaxed max-h-56 overflow-y-auto">
                      <code>{tool.code}</code>
                    </pre>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300 mb-1">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    <span>How to use this tool:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    {localize(tool.howToUse, lang)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Content 4: Report Templates ── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-slate-950 p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              Battle-Tested P1/P2 403 Bypass Bug Reports
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-3xl">
              HackerOne and Bugcrowd accepted report templates showing how breaking 403 access control leads to Critical Broken Object & Function Level Authorization.
            </p>
          </div>

          <div className="space-y-4">
            {FORBIDDEN_REPORT_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-xl border border-border bg-slate-950 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase">
                        {tpl.severity}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {tpl.vulnType}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">
                      {localize(tpl.title, lang)}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-[11px] text-rose-300">
                      {tpl.cvss.split("/")[0]} (Score: 9.1)
                    </span>
                    <button
                      onClick={() => copyToClipboard(tpl.reportMarkdown, `tpl-${tpl.id}`)}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition"
                    >
                      {copiedKey === `tpl-${tpl.id}` ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy Markdown Report
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900/90 p-4 font-mono text-xs text-slate-300 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
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
