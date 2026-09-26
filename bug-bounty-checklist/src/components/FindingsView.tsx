import { useState } from "react";
import { Trash2, Copy, Check, Download } from "lucide-react";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import { SeverityBadge } from "./SeverityBadge";
import { cvssSeverityLabel } from "../lib/cvss";
import type { Finding } from "../types/checklist";

type TemplateType = "standard" | "hackerone" | "bugcrowd";

function formatFinding(f: Finding, template: TemplateType): string {
  if (template === "hackerone") {
    return [
      `## Summary`,
      f.title,
      "",
      `**Asset / Check:** \`${f.itemText}\``,
      `**Domain / Category:** ${f.domain.toUpperCase()} / ${f.categoryName}`,
      `**Severity:** ${f.severity.toUpperCase()}${f.cvss ? ` (CVSS ${f.cvss.score.toFixed(1)} - ${cvssSeverityLabel(f.cvss.score)})` : ""}`,
      f.cvss ? `**CVSS Vector:** \`${f.cvss.vector}\`` : "",
      "",
      `## Steps To Reproduce`,
      f.description || "1. Navigate to target endpoint.\n2. Execute proof of concept payload.\n3. Observe unauthorized behavior.",
      "",
      `## Impact`,
      `Exploitation of this vulnerability allows an attacker to compromise ${f.categoryName} security boundaries, potentially leading to unauthorized data exposure, privilege escalation, or service disruption.`,
      "",
      f.screenshots && f.screenshots.length > 0 ? `_Attached ${f.screenshots.length} screenshot(s) in local report session._` : "",
    ].filter(Boolean).join("\n");
  }

  if (template === "bugcrowd") {
    return [
      `# [Vulnerability Report] ${f.title}`,
      "",
      `### Target Endpoint & Classification`,
      `- **Domain:** ${f.domain}`,
      `- **Category:** ${f.categoryName}`,
      `- **Vulnerability:** ${f.itemText}`,
      `- **Rating:** ${f.severity.toUpperCase()}${f.cvss ? ` (CVSS ${f.cvss.score.toFixed(1)})` : ""}`,
      f.cvss ? `- **CVSS Vector:** \`${f.cvss.vector}\`` : "",
      "",
      `### Vulnerability Details & Replication Steps`,
      f.description || "_(Detailed steps)_",
      "",
      `### Business Impact`,
      `Risk to confidential data and application integrity under ${f.categoryName}.`,
    ].filter(Boolean).join("\n");
  }

  // Standard template
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
  const [template, setTemplate] = useState<TemplateType>("standard");

  function exportMarkdown() {
    if (!profile || profile.findings.length === 0) return;
    const headerTitle =
      template === "hackerone"
        ? `# HackerOne Report — ${profile.name}`
        : template === "bugcrowd"
        ? `# Bugcrowd Submission — ${profile.name}`
        : `# Security Findings Report — ${profile.name}`;

    const md = [
      headerTitle,
      `*Generated on: ${new Date().toLocaleDateString()}*`,
      "",
      ...profile.findings.map((f) => formatFinding(f, template)),
    ].join("\n\n---\n\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, "_")}_${template}_report.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyFinding(f: Finding) {
    await navigator.clipboard.writeText(formatFinding(f, template));
    setCopiedId(f.id);
    setTimeout(() => setCopiedId((id) => (id === f.id ? null : id)), 1500);
  }

  if (!profile) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            🐞 Findings ({profile.findings.length}) — {profile.name}
          </h2>
          <p className="text-xs text-slate-400">
            Export or copy individual findings formatted for security reports.
          </p>
        </div>

        {profile.findings.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-slate-900/60 px-2.5 py-1">
              <span className="text-[11px] text-slate-400">Template:</span>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as TemplateType)}
                className="bg-transparent text-xs font-semibold text-emerald-400 outline-none"
              >
                <option value="standard" className="bg-slate-900 text-slate-200">
                  Standard Markdown
                </option>
                <option value="hackerone" className="bg-slate-900 text-slate-200">
                  HackerOne Format
                </option>
                <option value="bugcrowd" className="bg-slate-900 text-slate-200">
                  Bugcrowd Format
                </option>
              </select>
            </div>

            <button
              onClick={exportMarkdown}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              <Download className="h-3.5 w-3.5" />
              Export Report (.md)
            </button>
          </div>
        )}
      </div>

      {profile.findings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center">
          <p className="text-sm font-semibold text-slate-300">No findings saved yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Mark any checklist item as <span className="font-semibold text-red-400">Vulnerable</span> to document reproduction steps and add it to this report.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {profile.findings.map((f) => (
            <div key={f.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={f.severity} />
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 uppercase">
                      {f.domain}
                    </span>
                    <span className="text-xs text-slate-500">· {f.categoryName}</span>
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-slate-100">{f.title}</h3>
                  <p className="text-xs text-slate-400">
                    Check: <span className="text-slate-300">{f.itemText}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => copyFinding(f)}
                    className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-slate-300 hover:bg-white/5"
                    title={`Copy as ${template} markdown`}
                  >
                    {copiedId === f.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this finding?")) removeFinding(f.id);
                    }}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-red-950/40 hover:text-red-400"
                    title="Delete finding"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {f.cvss && (
                <div className="mt-2.5 flex items-center gap-2 rounded bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-400">
                  <span>CVSS {f.cvss.score.toFixed(1)}</span>
                  <span className="text-slate-600">|</span>
                  <span className="font-mono text-slate-500 truncate">{f.cvss.vector}</span>
                </div>
              )}

              {f.description && (
                <div className="mt-3 rounded-lg border border-border/60 bg-slate-950 p-3 text-xs text-slate-300 whitespace-pre-wrap font-sans">
                  {f.description}
                </div>
              )}

              {f.screenshots && f.screenshots.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {f.screenshots.map((s, idx) => (
                    <img
                      key={idx}
                      src={s}
                      alt={`Finding screenshot ${idx + 1}`}
                      className="h-20 w-32 rounded border border-border object-cover"
                    />
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
