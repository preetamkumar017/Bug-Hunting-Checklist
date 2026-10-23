import { useState, useMemo } from "react";
import {
  KeyRound,
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
  Globe,
  UserCheck,
} from "lucide-react";
import {
  OAUTH_TECHNIQUES,
  OAUTH_METHODOLOGY_PHASES,
  OAUTH_TOOLS_STASH,
  OAUTH_REPORT_TEMPLATES,
} from "@/learn/data/oauthPlaybookData";
import { type Lang, LEARN_LANGS, localize } from "@/learn/data/types";

interface OAuthPlaybookViewProps {
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

export function OAuthPlaybookView({ onPractice }: OAuthPlaybookViewProps) {
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
  const [expandedCard, setExpandedCard] = useState<string | null>(OAUTH_TECHNIQUES[0].id);
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
    if (!searchQuery.trim()) return OAUTH_TECHNIQUES;
    const q = searchQuery.toLowerCase();
    return OAUTH_TECHNIQUES.filter((tech) => {
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
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-card to-card p-6 shadow-2xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
              <KeyRound className="h-3.5 w-3.5 animate-pulse text-sky-400" />
              <span>Pre-Account Takeover & OAuth 2.0 / SSO Vulnerabilities</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
              🔑 Pre-Account Takeover & OAuth SSO Field Guide
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Weaponize unverified email registration to backdoor accounts before victims sign up, exploit missing state parameters in social account linking, and leak authorization codes via redirect_uri poisoning.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 backdrop-blur-sm self-start sm:self-center">
            {LEARN_LANGS.map((item) => (
              <button
                key={item.id}
                onClick={() => setLang(item.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  lang === item.id
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/30 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
              <UserCheck className="h-3.5 w-3.5" />
              Pre-ATO Vulnerability
            </div>
            <p className="mt-1 text-lg font-bold text-slate-200">Silent Backdoor</p>
            <p className="text-[11px] text-slate-400">Unverified email auto-linking</p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" />
              OAuth Linking CSRF
            </div>
            <p className="mt-1 text-lg font-bold text-slate-200">Missing state</p>
            <p className="text-[11px] text-slate-400">Forces attacker Google ID link</p>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
              <Globe className="h-3.5 w-3.5" />
              Redirect URI Poisoning
            </div>
            <p className="mt-1 text-lg font-bold text-slate-200">Code Exfiltration</p>
            <p className="text-[11px] text-slate-400">Wildcards & path traversal</p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              Bounty Payout Tier
            </div>
            <p className="mt-1 text-lg font-bold text-slate-200">$4,000 – $15,000</p>
            <p className="text-[11px] text-slate-400">Classified as Critical / High</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/40 pt-4">
          <button
            onClick={() => setActiveTab("techniques")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "techniques"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Attack Techniques ({OAUTH_TECHNIQUES.length})
          </button>

          <button
            onClick={() => setActiveTab("methodology")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "methodology"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            5-Phase Methodology
          </button>

          <button
            onClick={() => setActiveTab("lab")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "lab"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Exploit Scripts ({OAUTH_TOOLS_STASH.length})
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "reports"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            P1/P2 Reports ({OAUTH_REPORT_TEMPLATES.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ATTACK TECHNIQUES */}
      {activeTab === "techniques" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 backdrop-blur-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search OAuth & SSO techniques (e.g., pre-ato, state, csrf, redirect_uri, jwt, none)..."
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid gap-4">
            {filteredTechniques.map((tech) => {
              const isExpanded = expandedCard === tech.id;
              return (
                <div
                  key={tech.id}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 transition-all hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/5"
                >
                  <div
                    onClick={() => setExpandedCard(isExpanded ? null : tech.id)}
                    className="flex cursor-pointer items-start justify-between gap-4 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-400">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-100">
                            {localize(tech.title, lang)}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              tech.difficulty === "beginner"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : tech.difficulty === "intermediate"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            }`}
                          >
                            {tech.difficulty}
                          </span>
                          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                            Success: {tech.successRate}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                          {localize(tech.summary, lang)}
                        </p>
                      </div>
                    </div>
                    <button
                      aria-label="Toggle details"
                      className="rounded-lg border border-border/60 p-1.5 text-muted-foreground hover:bg-muted"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-6 border-t border-border/60 bg-muted/10 p-5">
                      {/* Step-by-Step Recipe */}
                      <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                          <Sparkles className="h-3.5 w-3.5" />
                          Step-by-Step Execution Recipe
                        </h4>
                        <div className="mt-2.5 space-y-2">
                          {tech.stepByStepRecipe.map((step, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 text-xs text-slate-300"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-300">
                                {idx + 1}
                              </span>
                              <span className="mt-0.5 leading-relaxed">
                                {localize(step, lang)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Scenarios / Payloads */}
                      <div>
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                          <Terminal className="h-3.5 w-3.5" />
                          Real-World Exploit Scenarios & Payloads
                        </h4>
                        <div className="mt-2.5 space-y-3">
                          {tech.scenarios.map((sc, sIdx) => (
                            <div
                              key={sIdx}
                              className="rounded-xl border border-border/60 bg-card/60 p-4"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-xs font-bold text-slate-200">
                                  {localize(sc.title, lang)}
                                </h5>
                                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400">
                                  Impact: {localize(sc.impact, lang)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                {localize(sc.description, lang)}
                              </p>

                              {sc.commandOrRequest && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                                    <span>Payload / Request Flow</span>
                                    <button
                                      onClick={() =>
                                        copyCode(`sc-${tech.id}-${sIdx}`, sc.commandOrRequest || "")
                                      }
                                      className="flex items-center gap-1 text-sky-400 hover:text-sky-300"
                                    >
                                      {copiedKey === `sc-${tech.id}-${sIdx}` ? (
                                        <>
                                          <Check className="h-3 w-3" /> Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3 w-3" /> Copy
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <pre className="overflow-x-auto rounded-lg border border-border/60 bg-black/60 p-3 font-mono text-[11px] text-emerald-400 whitespace-pre">
                                    {sc.commandOrRequest}
                                  </pre>
                                </div>
                              )}

                              {sc.responseSample && (
                                <div className="mt-2">
                                  <div className="text-[11px] text-muted-foreground mb-1">
                                    <span>Observed Application Behavior</span>
                                  </div>
                                  <pre className="overflow-x-auto rounded-lg border border-border/60 bg-black/60 p-3 font-mono text-[11px] text-amber-300/90 whitespace-pre">
                                    {sc.responseSample}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Burp / Tool Configuration */}
                      {tech.burpOrToolRule && tech.burpOrToolRule.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                            <Lock className="h-3.5 w-3.5" />
                            Targeted Burp Payloads & Verification
                          </h4>
                          <div className="mt-2 space-y-2">
                            {tech.burpOrToolRule.map((rule, rIdx) => (
                              <div
                                key={rIdx}
                                className="group relative rounded-lg border border-border/60 bg-black/60 p-2.5 font-mono text-[11px] text-cyan-300 overflow-x-auto flex items-center justify-between gap-2"
                              >
                                <code>{rule}</code>
                                <button
                                  onClick={() => copyCode(`rule-${tech.id}-${rIdx}`, rule)}
                                  className="shrink-0 text-muted-foreground hover:text-cyan-300"
                                >
                                  {copiedKey === `rule-${tech.id}-${rIdx}` ? (
                                    <Check className="h-3 w-3 text-cyan-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hunter Pro Tip */}
                      <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
                        <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                          <Lightbulb className="h-4 w-4" />
                          <span>Hunter Field Secret</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          {localize(tech.hunterProTip, lang)}
                        </p>
                      </div>

                      {/* Practice Bridge */}
                      {onPractice && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => onPractice("auth")}
                            className="inline-flex items-center gap-2 rounded-xl bg-sky-500/20 px-3.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 transition-colors"
                          >
                            <span>Jump to Auth & OAuth Checklist</span>
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
        </div>
      )}

      {/* TAB 2: 5-PHASE METHODOLOGY */}
      {activeTab === "methodology" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              Complete 5-Phase OAuth & Pre-Account Takeover Methodology
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              The systematic penetration testing workflow for testing third-party social logins, account merging, state parameter verification, and OpenID Connect implementations.
            </p>
          </div>

          <div className="grid gap-4">
            {OAUTH_METHODOLOGY_PHASES.map((phase) => (
              <div
                key={phase.phase}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-5 transition-all hover:border-sky-500/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sm font-black text-sky-400 border border-sky-500/30">
                    {phase.phase}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-100">
                      {localize(phase.title, lang)}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-sky-400">
                      Objective: {localize(phase.objective, lang)}
                    </p>

                    <div className="mt-3 space-y-2">
                      {phase.steps.map((st, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-sky-400">•</span>
                          <span className="leading-relaxed">{localize(st, lang)}</span>
                        </div>
                      ))}
                    </div>

                    {phase.keyTargets && phase.keyTargets.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-semibold mr-1">
                          Key Targets:
                        </span>
                        {phase.keyTargets.map((target, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-slate-300"
                          >
                            {target}
                          </span>
                        ))}
                      </div>
                    )}

                    {phase.commandsOrPayloads && phase.commandsOrPayloads.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {phase.commandsOrPayloads.map((cmd, cIdx) => (
                          <div
                            key={cIdx}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-black/60 p-2.5 font-mono text-[11px] text-emerald-400 overflow-x-auto gap-2"
                          >
                            <code>{cmd}</code>
                            <button
                              onClick={() => copyCode(`phase-${phase.phase}-${cIdx}`, cmd)}
                              className="shrink-0 text-muted-foreground hover:text-emerald-300"
                            >
                              {copiedKey === `phase-${phase.phase}-${cIdx}` ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LAB SCRIPTS & TOOL SNIPPETS */}
      {activeTab === "lab" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-sky-400" />
              OAuth Exploit Scripts & CSRF Generators
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Interactive HTML CSRF payload generators and automated Python redirect_uri fuzzer for bug bounty triage proof-of-concepts.
            </p>
          </div>

          <div className="grid gap-4">
            {OAUTH_TOOLS_STASH.map((snippet) => (
              <div
                key={snippet.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-5"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {localize(snippet.title, lang)}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {localize(snippet.description, lang)}
                    </p>
                  </div>
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono text-sky-400 uppercase self-start sm:self-auto">
                    {snippet.language}
                  </span>
                </div>

                <div className="mt-3 relative">
                  <div className="flex items-center justify-between rounded-t-lg border-x border-t border-border/60 bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
                    <span>Source Snippet</span>
                    <button
                      onClick={() => copyCode(`tool-${snippet.id}`, snippet.code)}
                      className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium"
                    >
                      {copiedKey === `tool-${snippet.id}` ? (
                        <>
                          <Check className="h-3 w-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy Script
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="max-h-80 overflow-auto rounded-b-lg border border-border/60 bg-black/80 p-4 font-mono text-[11px] text-slate-300 whitespace-pre">
                    {snippet.code}
                  </pre>
                </div>

                <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                    How To Execute:
                  </span>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed font-mono">
                    {localize(snippet.howToUse, lang)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: P1/P2 REPORT TEMPLATES */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-400" />
              Copy-Paste Ready P1 / Critical Bug Bounty Reports
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Submit these verified report templates to HackerOne or Bugcrowd for instant acceptance and clear CVSS justification.
            </p>
          </div>

          <div className="grid gap-4">
            {OAUTH_REPORT_TEMPLATES.map((rep) => (
              <div
                key={rep.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-5"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-sky-500/40 bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-bold text-sky-300 uppercase">
                        {rep.severity} • {rep.cvss}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {rep.vulnType}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-base font-bold text-slate-100">
                      {localize(rep.title, lang)}
                    </h3>
                  </div>

                  <button
                    onClick={() => copyCode(`rep-${rep.id}`, rep.reportMarkdown)}
                    className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 self-start sm:self-auto transition-colors"
                  >
                    {copiedKey === `rep-${rep.id}` ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-sky-400" /> Copied Full Report
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Markdown Report
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4">
                  <pre className="max-h-96 overflow-auto rounded-xl border border-border/60 bg-black/70 p-4 font-mono text-[11px] text-slate-300 whitespace-pre leading-relaxed">
                    {rep.reportMarkdown}
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
