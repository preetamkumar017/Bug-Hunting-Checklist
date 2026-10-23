import { useState, useMemo } from "react";
import { Modal } from "@/shared/components/Modal";
import {
  X,
  Copy,
  Check,
  Zap,
  ExternalLink,
  Target,
  Globe,
  Server,
  Lightbulb,
  ShieldCheck,
  ShieldAlert,
  Search,
} from "lucide-react";
import { ATTACK_CHAINS } from "@/tools/data/attackChainData";
import {
  useTargetContext,
  interpolateTargetVars,
} from "@/shared/store/useTargetContext";

interface AttackChainerModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateToView?: (view: string) => void;
}

type Lang = "en" | "simple" | "hi";

export function AttackChainerModal({
  open,
  onClose,
  onNavigateToView,
}: AttackChainerModalProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("subdomain");
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem("learn.lang");
      if (saved === "en" || saved === "simple" || saved === "hi") return saved;
    } catch {
      // ignore
    }
    return "en";
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  // Store context
  const targetDomain = useTargetContext((s) => s.targetDomain);
  const subdomain = useTargetContext((s) => s.subdomain);
  const originIp = useTargetContext((s) => s.originIp);
  const cloudBucket = useTargetContext((s) => s.cloudBucket);
  const protectedPath = useTargetContext((s) => s.protectedPath);

  const setTargetDomain = useTargetContext((s) => s.setTargetDomain);
  const setSubdomain = useTargetContext((s) => s.setSubdomain);
  const setOriginIp = useTargetContext((s) => s.setOriginIp);
  const setCloudBucket = useTargetContext((s) => s.setCloudBucket);
  const setProtectedPath = useTargetContext((s) => s.setProtectedPath);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleLangChange = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem("learn.lang", l);
    } catch {
      // ignore
    }
  };

  const currentCategory = useMemo(() => {
    return (
      ATTACK_CHAINS.find((c) => c.id === activeCategoryId) || ATTACK_CHAINS[0]
    );
  }, [activeCategoryId]);

  const filteredSteps = useMemo(() => {
    if (!filterQuery.trim()) return currentCategory.steps;
    const q = filterQuery.toLowerCase();
    return currentCategory.steps.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.objective[lang].toLowerCase().includes(q) ||
        s.commandTemplate.toLowerCase().includes(q)
    );
  }, [currentCategory, filterQuery, lang]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recon & Attack Chainer"
      className="w-full max-w-5xl !max-h-[92vh] !p-0 !overflow-hidden"
    >
      <div className="relative flex h-[88vh] max-h-[88vh] w-full max-w-5xl flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-slate-900/90 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">
                  Recon & Attack Chainer
                </h2>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                  Next-Move Decision Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Found an IP, Subdomain, or 403? Get prioritized attack chains with auto-interpolated commands.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Language Selector */}
            <div className="flex rounded-md border border-border bg-slate-900/80 p-0.5 text-[11px]">
              <button
                onClick={() => handleLangChange("en")}
                className={`rounded px-2 py-0.5 font-medium transition ${
                  lang === "en" ? "bg-amber-500 text-black font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLangChange("simple")}
                className={`rounded px-2 py-0.5 font-medium transition ${
                  lang === "simple" ? "bg-amber-500 text-black font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => handleLangChange("hi")}
                className={`rounded px-2 py-0.5 font-medium transition ${
                  lang === "hi" ? "bg-amber-500 text-black font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              aria-label="Close attack chainer"
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Global Live Target Controls Bar (Compact HUD style) */}
        <div className="shrink-0 border-b border-border/80 bg-slate-950/80 px-5 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Target Domain Input */}
            <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-slate-900/90 px-3 py-1.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-500/30 transition">
              <Target className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <div className="min-w-0 flex-1 flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Domain:
                </span>
                <input
                  type="text"
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value)}
                  placeholder="e.g. salesflare.com"
                  className="w-full min-w-0 bg-transparent text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Subdomain Input */}
            <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-slate-900/90 px-3 py-1.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-500/30 transition">
              <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <div className="min-w-0 flex-1 flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Subdomain:
                </span>
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="e.g. api.salesflare.com"
                  className="w-full min-w-0 bg-transparent text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Contextual 3rd Input based on active tab */}
            {activeCategoryId === "cloud_bucket" ? (
              <div className="flex items-center gap-2 rounded-lg border border-sky-500/20 bg-slate-900/90 px-3 py-1.5 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-500/30 transition">
                <Server className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    S3 Bucket:
                  </span>
                  <input
                    type="text"
                    value={cloudBucket}
                    onChange={(e) => setCloudBucket(e.target.value)}
                    placeholder="e.g. salesflare-assets"
                    className="w-full min-w-0 bg-transparent text-xs font-mono text-sky-300 placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            ) : activeCategoryId === "protected_path" ? (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-slate-900/90 px-3 py-1.5 focus-within:border-rose-400 focus-within:ring-1 focus-within:ring-rose-500/30 transition">
                <Server className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Path:
                  </span>
                  <input
                    type="text"
                    value={protectedPath}
                    onChange={(e) => setProtectedPath(e.target.value)}
                    placeholder="e.g. /admin or /api/v2"
                    className="w-full min-w-0 bg-transparent text-xs font-mono text-rose-300 placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-slate-900/90 px-3 py-1.5 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-500/30 transition">
                <Server className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Origin IP:
                  </span>
                  <input
                    type="text"
                    value={originIp}
                    onChange={(e) => setOriginIp(e.target.value)}
                    placeholder="e.g. 35.186.254.174"
                    className="w-full min-w-0 bg-transparent text-xs font-mono text-amber-300 placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Artifact Categories Horizontal Tabs Strip */}
        <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto border-b border-border bg-slate-900/60 px-5 py-2 scrollbar-thin">
          {ATTACK_CHAINS.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setFilterQuery("");
                }}
                className={`group flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <span>{cat.emoji}</span>
                <span className="whitespace-nowrap">{cat.title}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive
                      ? "bg-amber-500/25 text-amber-200"
                      : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                  }`}
                >
                  {cat.steps.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Description Banner & Filter */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-slate-950/40 px-5 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/20 shrink-0">
              {currentCategory.emoji} Playbook
            </span>
            <p className="text-xs text-slate-300 truncate sm:whitespace-normal leading-relaxed">
              {currentCategory.description[lang]}
            </p>
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter steps or commands..."
              className="w-full rounded-md border border-border bg-slate-900/80 pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery("")}
                className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300"
                aria-label="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Body: Attack Steps Progression */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {filteredSteps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Search className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">
                No attack steps match &quot;{filterQuery}&quot;
              </p>
              <button
                onClick={() => setFilterQuery("")}
                className="mt-2 text-xs font-semibold text-amber-400 hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            filteredSteps.map((step, idx) => {
              const interpolatedCommand = interpolateTargetVars(step.commandTemplate, {
                targetDomain,
                subdomain,
                originIp,
                cloudBucket,
                protectedPath,
              });

              const cardKey = `step-${step.id}-${idx}`;

              return (
                <div
                  key={step.id}
                  className="rounded-xl border border-border/80 bg-slate-900/50 p-4 space-y-3 transition-colors hover:border-border"
                >
                  {/* Header: Title, Badge, and Playbook Link */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-400">
                        {idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-slate-100">{step.title}</h3>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          step.badge === "P1"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : step.badge === "P2"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : step.badge === "Bypass"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {step.badge}
                      </span>
                    </div>

                    {step.playbookRoute && onNavigateToView && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToView(step.playbookRoute!.replace(/^\//, ""));
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                      >
                        <span>{step.playbookLabel || "Open Playbook"}</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Objective Description */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {step.objective[lang]}
                  </p>

                  {/* Executable Command Snippet */}
                  <div className="relative rounded-lg border border-border/70 bg-black/60 p-3">
                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400">
                      <span className="font-mono text-cyan-400"># Auto-Interpolated Command</span>
                      <button
                        onClick={() => handleCopy(interpolatedCommand, cardKey)}
                        className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        {copiedKey === cardKey ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Command</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto font-mono text-xs text-amber-200/90 whitespace-pre-wrap select-all">
                      {interpolatedCommand}
                    </pre>
                  </div>

                  {/* Vulnerable vs Safe Expected Signals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                    <div className="rounded-lg border border-red-500/25 bg-red-950/15 p-2.5 space-y-1">
                      <span className="flex items-center gap-1 font-bold text-red-400">
                        <ShieldAlert className="h-3.5 w-3.5" /> Expected Vulnerable Signal:
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {step.expectedVulnerable[lang]}
                      </p>
                    </div>

                    <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/15 p-2.5 space-y-1">
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" /> Expected Safe Signal:
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {step.expectedSafe[lang]}
                      </p>
                    </div>
                  </div>

                  {/* Bounty Tip */}
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-200/90">
                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Bounty Pro-Tip: </span>
                      <span>{step.bountyTip[lang]}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
