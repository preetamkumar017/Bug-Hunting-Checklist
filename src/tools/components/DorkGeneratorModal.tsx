import { useState, useMemo, useEffect } from "react";
import { X, Copy, Check, ExternalLink, SearchCode, Target, ShieldAlert } from "lucide-react";
import {
  DORK_GROUPS,
  TARGET_RECON_GROUPS,
  buildQuery,
  normalizeDomain,
  searchUrl,
} from "@/tools/lib/dorks";

interface DorkGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  /** Prefill for the domain input (e.g. active profile name). */
  defaultDomain?: string;
}

const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-red-500/15 text-red-300 border-red-500/30",
  high:     "bg-orange-500/15 text-orange-300 border-orange-500/30",
  medium:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low:      "bg-sky-500/15 text-sky-300 border-sky-500/30",
  info:     "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const ENGINE_LABEL = { google: "Google", github: "GitHub", shodan: "Shodan" } as const;

type Mode = "vuln" | "recon";

export function DorkGeneratorModal({ open, onClose, defaultDomain }: DorkGeneratorModalProps) {
  const [mode, setMode]           = useState<Mode>("vuln");
  const [input, setInput]         = useState("");
  const [activeVuln, setActiveVuln]   = useState(DORK_GROUPS[0].id);
  const [activeRecon, setActiveRecon] = useState(TARGET_RECON_GROUPS[0].id);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (open && !input && defaultDomain && defaultDomain.includes(".")) {
      setInput(defaultDomain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDomain]);

  const domain = useMemo(() => normalizeDomain(input) || "example.com", [input]);

  const vulnGroup  = DORK_GROUPS.find((g) => g.id === activeVuln)  ?? DORK_GROUPS[0];
  const reconGroup = TARGET_RECON_GROUPS.find((g) => g.id === activeRecon) ?? TARGET_RECON_GROUPS[0];

  if (!open) return null;

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1200);
  }

  // ── Shared dork list renderer ──────────────────────────────────────────────
  function DorkList({ dorks, groupId }: { dorks: typeof vulnGroup["dorks"]; groupId: string }) {
    const allQueries = dorks.map((d) => buildQuery(d.query, domain)).join("\n");
    return (
      <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              {mode === "vuln" ? vulnGroup.name : reconGroup.name}
            </h3>
            <p className="text-[11px] text-slate-400">
              {mode === "vuln" ? vulnGroup.description : reconGroup.description}
            </p>
          </div>
          <button
            onClick={() => copy(allQueries, "all")}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-slate-100"
          >
            {copiedKey === "all" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            Copy all ({dorks.length})
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {dorks.map((d, idx) => {
            const q      = buildQuery(d.query, domain);
            const engine = d.engine ?? "google";
            const key    = `${groupId}-${idx}`;
            return (
              <div key={key} className="rounded-lg border border-border bg-slate-950 p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SEVERITY_STYLE[d.severity]}`}>
                    {d.severity}
                  </span>
                  <span className="text-[11px] text-slate-400">{d.what}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <code className="break-all select-all font-mono text-[11px] text-violet-300/90">{q}</code>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => copy(q, key)}
                      title="Copy dork"
                      className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-slate-200"
                    >
                      {copiedKey === key ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <a
                      href={searchUrl(engine, q)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-violet-500"
                    >
                      <ExternalLink className="h-3 w-3" /> {ENGINE_LABEL[engine]}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          {mode === "vuln"
            ? "A hit is only a lead — confirm the data is real and in scope before reporting. Google may CAPTCHA rapid queries."
            : "Recon dorks are for passive OSINT only. Respect privacy laws and program scope. Never use against targets you don't have permission to research."}
        </p>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col rounded-xl border border-border bg-card shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <SearchCode className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100">Dork Generator</h2>
              <p className="text-[11px] text-slate-400">
                Vulnerability dorks &amp; target reconnaissance — powered by Google / GitHub / Shodan.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Mode switcher ── */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-2.5">
          <button
            onClick={() => setMode("vuln")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition ${
              mode === "vuln"
                ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Vulnerability Dorks
            <span className="ml-1 rounded-full bg-violet-500/20 px-1.5 py-0.5 font-mono text-[10px] text-violet-400">
              {DORK_GROUPS.length}
            </span>
          </button>
          <button
            onClick={() => setMode("recon")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition ${
              mode === "recon"
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            Target Recon
            <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
              {TARGET_RECON_GROUPS.length}
            </span>
          </button>
        </div>

        {/* ── Target input ── */}
        <div className="border-b border-border px-5 py-3">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {mode === "vuln" ? "Target domain (must be in scope)" : "Target — company name or domain"}
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "vuln" ? "example.com" : "acmecorp  or  example.com"}
            className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-violet-500"
          />
          {mode === "recon" && (
            <p className="mt-1 text-[10px] text-slate-500">
              Tip: for company-name queries the <code className="text-violet-400">{"{"}"org{"}"}</code> token is used (first part of domain, or your input directly).
            </p>
          )}
        </div>

        {/* ── Body: sidebar + dork list ── */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">

          {/* Sidebar */}
          <div className="w-full border-b border-border bg-slate-950/40 p-3 md:w-64 md:border-b-0 md:border-r">
            {mode === "vuln" ? (
              <>
                <span className="mb-2 block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Vuln Categories ({DORK_GROUPS.length})
                </span>
                <div className="space-y-1">
                  {DORK_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setActiveVuln(g.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        g.id === activeVuln
                          ? "bg-violet-500/15 font-semibold text-violet-300"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{g.dorks.length}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span className="mb-2 block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Recon Categories ({TARGET_RECON_GROUPS.length})
                </span>
                <div className="space-y-1">
                  {TARGET_RECON_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setActiveRecon(g.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        g.id === activeRecon
                          ? "bg-emerald-500/15 font-semibold text-emerald-300"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{g.dorks.length}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dork list panel */}
          <div className="flex flex-1 flex-col overflow-hidden p-4">
            {mode === "vuln" ? (
              <DorkList dorks={vulnGroup.dorks}  groupId={vulnGroup.id} />
            ) : (
              <DorkList dorks={reconGroup.dorks} groupId={reconGroup.id} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
