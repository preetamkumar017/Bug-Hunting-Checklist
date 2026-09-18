import { useState } from "react";
import { Trash2, Copy, Check } from "lucide-react";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import { SeverityBadge } from "./SeverityBadge";
import { cvssSeverityLabel } from "../lib/cvss";
import type { Finding } from "../types/checklist";

function findingToReport(f: Finding): string {
  const lines = [
    `## ${f.title}`,
    "",
    `**Severity:** ${f.severity}${f.cvss ? ` — CVSS ${f.cvss.score.toFixed(1)} (${cvssSeverityLabel(f.cvss.score)})` : ""}`,
    f.cvss ? `**CVSS Vector:** \`${f.cvss.vector}\`` : "",
    `**Domain / Category:** ${f.domain} / ${f.categoryName}`,
    `**Check:** ${f.itemText}`,
    "",
    "### Description / Steps to Reproduce",
    f.description || "_(no description provided)_",
    "",
    f.screenshots && f.screenshots.length > 0 ? `_${f.screenshots.length} screenshot(s) attached in-app — export/copy manually if needed for this submission._` : "",
  ];
  return lines.filter((l) => l !== "").join("\n");
}

export function FindingsView() {
  const profile = useActiveProfile();
  const removeFinding = useChecklistStore((s) => s.removeFinding);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function exportMarkdown() {
    if (!profile || profile.findings.length === 0) return;
    const md = [`# Findings — ${profile.name}`, "", ...profile.findings.map(findingToReport)].join("\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, "_")}_findings.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyFinding(f: Finding) {
    await navigator.clipboard.writeText(findingToReport(f));
    setCopiedId(f.id);
    setTimeout(() => setCopiedId((id) => (id === f.id ? null : id)), 1500);
  }

  if (!profile) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-100">Findings — {profile.name}</h2>
        {profile.findings.length > 0 && (
          <button
            onClick={exportMarkdown}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            Export as Markdown report
          </button>
        )}
      </div>

      {profile.findings.length === 0 ? (
        <p className="text-sm text-slate-500">
          No findings yet. Mark a checklist item as "Vulnerable" to record one.
        </p>
      ) : (
        <div className="space-y-3">
          {profile.findings.map((f) => (
            <div key={f.id} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{f.title}</h3>
                <div className="flex items-center gap-2">
                  {f.cvss && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[11px] text-amber-400">
                      CVSS {f.cvss.score.toFixed(1)}
                    </span>
                  )}
                  <SeverityBadge severity={f.severity} />
                  <button
                    onClick={() => copyFinding(f)}
                    className="text-slate-500 hover:text-slate-200"
                    aria-label="Copy finding as report text"
                    title="Copy as report"
                  >
                    {copiedId === f.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => removeFinding(f.id)}
                    className="text-slate-500 hover:text-red-400"
                    aria-label="Delete finding"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mb-2 text-[11px] text-slate-500">
                {f.domain} · {f.categoryName} · {f.itemText}
              </p>
              {f.description && <p className="text-xs text-slate-400">{f.description}</p>}
              {f.screenshots && f.screenshots.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {f.screenshots.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer">
                      <img src={src} alt={`Screenshot ${i + 1}`} className="h-16 w-16 rounded border border-border/60 object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
