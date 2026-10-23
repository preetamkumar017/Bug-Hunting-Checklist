import { useState, useMemo } from "react";
import {
  Globe,
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
  Cloud,
  Server,
  Lock,
} from "lucide-react";
import {
  TAKEOVER_TECHNIQUES,
  TAKEOVER_METHODOLOGY_PHASES,
  TAKEOVER_TOOLS_STASH,
  TAKEOVER_REPORT_TEMPLATES,
} from "@/learn/data/subdomainTakeoverData";
import { type Lang, LEARN_LANGS, localize } from "@/learn/data/types";

interface SubdomainTakeoverViewProps {
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

export function SubdomainTakeoverView({ onPractice }: SubdomainTakeoverViewProps) {
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
  const [expandedCard, setExpandedCard] = useState<string | null>(TAKEOVER_TECHNIQUES[0].id);
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
    if (!searchQuery.trim()) return TAKEOVER_TECHNIQUES;
    const q = searchQuery.toLowerCase();
    return TAKEOVER_TECHNIQUES.filter((tech) => {
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
      <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-card to-card p-6 shadow-2xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
              <Globe className="h-3.5 w-3.5 animate-pulse text-red-400" />
              <span>Cloud Storage, Subdomain & Dangling DNS Takeovers</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
              ☁️ Subdomain & Dangling CNAME Takeovers Field Guide
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Claim abandoned cloud storage buckets, hijack orphaned CNAME records across AWS S3, GitHub Pages, and Azure, steal enterprise cookies via second-order exploitation, and conquer dangling Name Servers.
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
                    ? "bg-red-500 text-white shadow-md shadow-red-500/30 font-semibold"
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
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
            <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
              <Cloud className="h-3.5 w-3.5" />
              Cloud Providers
            </div>
            <p className="mt-1 text-lg font-bold text-slate-200">60+ Services</p>
            <p className="text-[11px] text-slate-400">AWS S3, Azure, GitHub, Zendesk</p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" />
              Dangling DNS Records
            </div>
            <p className="mt-1 text-lg font-bold text-slate-200">CNAME & NS</p>
            <p className="text-[11px] text-slate-400">Unclaimed cloud pointers</p>
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
              <Lock className="h-3.5 w-3.5" />
              Second-Order Impact
            </div>
            <p className="mt-1 text-lg font-bold text-slate-200">Cookie Stealing</p>
            <p className="text-[11px] text-slate-400">Domain=.target.com cookies</p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              Bounty Payout Tier
            </div>
            <p className="mt-1 text-lg font-bold text-slate-200">$2,500 – $10,000</p>
            <p className="text-[11px] text-slate-400">Classified as High / Critical</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/40 pt-4">
          <button
            onClick={() => setActiveTab("techniques")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "techniques"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Attack Techniques ({TAKEOVER_TECHNIQUES.length})
          </button>

          <button
            onClick={() => setActiveTab("methodology")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "methodology"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
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
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Exploit Scripts ({TAKEOVER_TOOLS_STASH.length})
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "reports"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            P1/P2 Reports ({TAKEOVER_REPORT_TEMPLATES.length})
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
              placeholder="Search Subdomain Takeover techniques (e.g., s3, cname, ns, route53, cookies, digitalocean)..."
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
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 transition-all hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/5"
                >
                  <div
                    onClick={() => setExpandedCard(isExpanded ? null : tech.id)}
                    className="flex cursor-pointer items-start justify-between gap-4 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400">
                        <Globe className="h-4 w-4" />
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
                                : "bg-red-500/10 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {tech.difficulty}
                          </span>
                          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
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
                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                          <Sparkles className="h-3.5 w-3.5" />
                          Step-by-Step Execution Recipe
                        </h4>
                        <div className="mt-2.5 space-y-2">
                          {tech.stepByStepRecipe.map((step, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 text-xs text-slate-300"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-300">
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
                                <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                                  Impact: {localize(sc.impact, lang)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                                {localize(sc.description, lang)}
                              </p>

                              {sc.commandOrRequest && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                                    <span>Reconnaissance / Command Execution</span>
                                    <button
                                      onClick={() =>
                                        copyCode(`sc-${tech.id}-${sIdx}`, sc.commandOrRequest || "")
                                      }
                                      className="flex items-center gap-1 text-red-400 hover:text-red-300"
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
                                    <span>Observed Provider Response / Output</span>
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
                            <Server className="h-3.5 w-3.5" />
                            Targeted Recon Commands & Fingerprints
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
                      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
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
                            onClick={() => onPractice("recon")}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-3.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 border border-red-500/40 transition-colors"
                          >
                            <span>Jump to Reconnaissance Checklist</span>
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
              <Layers className="h-4 w-4 text-red-400" />
              Complete 5-Phase Subdomain Takeover Methodology
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              The systematic methodology for discovering dangling CNAME and NS records, fingerprinting cloud providers, executing safe proof-of-concept claims, and proving high-impact blast radius.
            </p>
          </div>

          <div className="grid gap-4">
            {TAKEOVER_METHODOLOGY_PHASES.map((phase) => (
              <div
                key={phase.phase}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-5 transition-all hover:border-red-500/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-sm font-black text-red-400 border border-red-500/30">
                    {phase.phase}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-100">
                      {localize(phase.title, lang)}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-red-400">
                      Objective: {localize(phase.objective, lang)}
                    </p>

                    <div className="mt-3 space-y-2">
                      {phase.steps.map((st, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-red-400">•</span>
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
              <Terminal className="h-4 w-4 text-red-400" />
              Subdomain Takeover Scripts & Automation Pipelines
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              High-speed Python multi-provider fingerprint scanner and automated bash recon pipeline for finding dangling DNS records across entire domain trees.
            </p>
          </div>

          <div className="grid gap-4">
            {TAKEOVER_TOOLS_STASH.map((snippet) => (
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
                  <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono text-red-400 uppercase self-start sm:self-auto">
                    {snippet.language}
                  </span>
                </div>

                <div className="mt-3 relative">
                  <div className="flex items-center justify-between rounded-t-lg border-x border-t border-border/60 bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
                    <span>Source Snippet</span>
                    <button
                      onClick={() => copyCode(`tool-${snippet.id}`, snippet.code)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium"
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
                  <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
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
              <FileText className="h-4 w-4 text-red-400" />
              Copy-Paste Ready P1 / Critical Bug Bounty Reports
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Submit these pre-structured markdown reports to HackerOne or Bugcrowd for verified high and critical payouts.
            </p>
          </div>

          <div className="grid gap-4">
            {TAKEOVER_REPORT_TEMPLATES.map((rep) => (
              <div
                key={rep.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-5"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-300 uppercase">
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
                    className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 self-start sm:self-auto transition-colors"
                  >
                    {copiedKey === `rep-${rep.id}` ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-red-400" /> Copied Full Report
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
