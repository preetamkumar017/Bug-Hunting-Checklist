import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface ClaudeLogEntry {
  id: string;
  timestamp: string;
  target: string;
  domain: string;
  category: string;
  item: string;
  method: string;
  result: "clean" | "found" | "blocked" | "info";
  summary: string;
  reportRef?: string;
}

interface ClaudeLog {
  lastUpdated: string;
  entries: ClaudeLogEntry[];
}

const RESULT_STYLE: Record<ClaudeLogEntry["result"], string> = {
  found: "border-red-600/40 bg-red-950/20",
  clean: "border-border bg-card",
  blocked: "border-border bg-card opacity-70",
  info: "border-sky-600/30 bg-sky-950/10",
};

const RESULT_LABEL: Record<ClaudeLogEntry["result"], string> = {
  found: "🔴 Found something",
  clean: "🟢 Clean",
  blocked: "⚪ Blocked / N/A",
  info: "🔵 Info",
};

export function ClaudeLogView() {
  const [log, setLog] = useState<ClaudeLog | null>(null);
  const [error, setError] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/claude-log.json?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("not found");
      setLog(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const entries = log ? [...log.entries].reverse() : [];
  const counts = entries.reduce(
    (acc, e) => {
      acc[e.result] = (acc[e.result] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-100">🤖 Claude Log</h2>
        <button
          onClick={load}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-slate-400 hover:bg-white/5"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Everything Claude checked on its own, without needing you to run or paste anything.
        Updates automatically as Claude writes to{" "}
        <code className="rounded bg-black/30 px-1 py-0.5 text-[11px]">public/claude-log.json</code>{" "}
        — no manual saving needed on your end.
      </p>

      {error && (
        <p className="mb-4 rounded-md border border-amber-600/30 bg-amber-950/20 p-3 text-xs text-amber-400">
          Couldn't load claude-log.json yet. Once Claude writes its first entry, this will populate
          automatically (refreshes every 15s).
        </p>
      )}

      {log && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border px-2.5 py-1 text-slate-400">
            {entries.length} checks logged
          </span>
          {counts.found > 0 && (
            <span className="rounded-full border border-red-600/40 bg-red-950/20 px-2.5 py-1 text-red-400">
              {counts.found} found something
            </span>
          )}
          {counts.clean > 0 && (
            <span className="rounded-full border border-border px-2.5 py-1 text-emerald-400">
              {counts.clean} clean
            </span>
          )}
          {counts.blocked > 0 && (
            <span className="rounded-full border border-border px-2.5 py-1 text-slate-500">
              {counts.blocked} blocked/N-A
            </span>
          )}
          <span className="rounded-full border border-border px-2.5 py-1 text-slate-500">
            last updated {new Date(log.lastUpdated).toLocaleString()}
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {entries.map((e) => (
          <div key={e.id} className={`rounded-lg border p-3.5 ${RESULT_STYLE[e.result]}`}>
            <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-100">{e.item}</h3>
              <span className="shrink-0 text-[11px] font-medium">{RESULT_LABEL[e.result]}</span>
            </div>
            <p className="mb-1.5 text-[11px] text-slate-500">
              {e.target} · {e.domain} · {e.category} · via {e.method} ·{" "}
              {new Date(e.timestamp).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">{e.summary}</p>
            {e.reportRef && (
              <p className="mt-1.5 text-[11px] font-medium text-amber-400">📄 {e.reportRef}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
