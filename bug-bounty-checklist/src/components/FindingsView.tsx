import { useState } from "react";
import { Trash2, Copy, Check, Download, FileText, Printer } from "lucide-react";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import { SeverityBadge } from "./SeverityBadge";
import { cvssSeverityLabel } from "../lib/cvss";
import type { Finding, TargetProfile } from "../types/checklist";

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
      f.cweId ? `**CWE ID:** \`${f.cweId}\`` : "",
      f.owaspCategory ? `**OWASP Category:** ${f.owaspCategory}` : "",
      "",
      `## Steps To Reproduce`,
      f.description || "1. Navigate to target endpoint.\n2. Execute proof of concept payload.\n3. Observe unauthorized behavior.",
      "",
      `## Impact`,
      `Exploitation of this vulnerability allows an attacker to compromise ${f.categoryName} security boundaries, potentially leading to unauthorized data exposure, privilege escalation, or service disruption.`,
      "",
      f.remediation ? `## Remediation Guidance\n${f.remediation}\n` : "",
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
      f.cweId ? `- **CWE ID:** \`${f.cweId}\`` : "",
      "",
      `### Vulnerability Details & Replication Steps`,
      f.description || "_(Detailed steps)_",
      "",
      `### Business Impact`,
      `Risk to confidential data and application integrity under ${f.categoryName}.`,
      "",
      f.remediation ? `### Remediation\n${f.remediation}` : "",
    ].filter(Boolean).join("\n");
  }

  // Standard template
  const lines = [
    `## ${f.title}`,
    "",
    `**Severity:** ${f.severity}${f.cvss ? ` — CVSS ${f.cvss.score.toFixed(1)} (${cvssSeverityLabel(f.cvss.score)})` : ""}`,
    f.cvss ? `**CVSS Vector:** \`${f.cvss.vector}\`` : "",
    f.cweId ? `**CWE ID:** \`${f.cweId}\`` : "",
    f.owaspCategory ? `**OWASP:** ${f.owaspCategory}` : "",
    `**Domain / Category:** ${f.domain} / ${f.categoryName}`,
    `**Check:** ${f.itemText}`,
    "",
    "### Description / Steps to Reproduce",
    f.description || "_(no description provided)_",
    "",
    f.remediation ? `### Remediation Guidance\n${f.remediation}\n` : "",
    f.screenshots && f.screenshots.length > 0 ? `_${f.screenshots.length} screenshot(s) attached in-app — export/copy manually if needed for this submission._` : "",
  ];
  return lines.filter((l) => l !== "").join("\n");
}

function generateExecutiveHtml(profile: TargetProfile): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const criticalCount = profile.findings.filter((f) => f.severity === "critical").length;
  const highCount = profile.findings.filter((f) => f.severity === "high").length;
  const mediumCount = profile.findings.filter((f) => f.severity === "medium").length;
  const lowCount = profile.findings.filter((f) => f.severity === "low").length;

  const findingsHtml = profile.findings
    .map(
      (f, idx) => `
    <div class="finding-card">
      <div class="finding-header">
        <span class="finding-number">#${idx + 1}</span>
        <div class="finding-title-group">
          <h3 class="finding-title">${escapeHtml(f.title)}</h3>
          <div class="badges">
            <span class="badge badge-${f.severity}">${f.severity.toUpperCase()}</span>
            ${f.cvss ? `<span class="badge badge-cvss">CVSS ${f.cvss.score.toFixed(1)}</span>` : ""}
            ${f.cweId ? `<span class="badge badge-cwe">${escapeHtml(f.cweId)}</span>` : ""}
            <span class="badge badge-category">${escapeHtml(f.domain)} / ${escapeHtml(f.categoryName)}</span>
          </div>
        </div>
      </div>

      <div class="finding-body">
        <p><strong>Affected Check:</strong> <code>${escapeHtml(f.itemText)}</code></p>
        ${f.cvss ? `<p><strong>CVSS Vector:</strong> <code>${escapeHtml(f.cvss.vector)}</code></p>` : ""}
        
        <h4>Vulnerability Details &amp; Steps to Reproduce</h4>
        <pre class="code-block">${escapeHtml(f.description || "No replication steps provided.")}</pre>

        ${
          f.remediation
            ? `
          <h4>Remediation Guidance</h4>
          <p class="remediation-text">${escapeHtml(f.remediation)}</p>
        `
            : ""
        }

        ${
          f.screenshots && f.screenshots.length > 0
            ? `
          <h4>Attached Proof of Concept Evidence</h4>
          <div class="screenshots-grid">
            ${f.screenshots
              .map(
                (src, sIdx) => `
              <img src="${src}" alt="Evidence ${sIdx + 1}" class="evidence-img" />
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Security Assessment Report — ${escapeHtml(profile.name)}</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --border: #1f2937;
      --primary: #10b981;
      --critical: #ef4444;
      --high: #f97316;
      --medium: #38bdf8;
      --low: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title { font-size: 28px; font-weight: 800; color: #fff; }
    .subtitle { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .actions { display: flex; gap: 8px; }
    .btn-print {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .summary-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .summary-num { font-size: 28px; font-weight: 800; }
    .summary-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
    .finding-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 24px;
      padding: 24px;
      page-break-inside: avoid;
    }
    .finding-header {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }
    .finding-number {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-muted);
      font-family: monospace;
    }
    .finding-title-group { flex: 1; }
    .finding-title { font-size: 18px; font-weight: 700; color: #fff; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      font-family: monospace;
    }
    .badge-critical { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
    .badge-high { background: rgba(249, 115, 22, 0.2); color: #fdba74; border: 1px solid rgba(249, 115, 22, 0.4); }
    .badge-medium { background: rgba(56, 189, 248, 0.2); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.4); }
    .badge-low { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-cvss { background: #1f2937; color: #e5e7eb; }
    .badge-cwe { background: #374151; color: #93c5fd; }
    .badge-category { background: #1f2937; color: #9ca3af; text-transform: none; }
    .finding-body h4 { font-size: 13px; font-weight: 700; color: #e5e7eb; margin: 16px 0 8px; }
    .finding-body p { font-size: 13px; color: #d1d5db; margin-bottom: 8px; }
    .code-block {
      background: #030712;
      border: 1px solid #1f2937;
      padding: 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
      color: #10b981;
      white-space: pre-wrap;
      overflow-x: auto;
    }
    .remediation-text {
      background: rgba(16, 185, 129, 0.08);
      border-left: 3px solid var(--primary);
      padding: 8px 12px;
      font-size: 13px;
      color: #e5e7eb;
    }
    .screenshots-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
    .evidence-img { max-height: 180px; border-radius: 6px; border: 1px solid var(--border); }
    .footer {
      border-top: 1px solid var(--border);
      padding-top: 20px;
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }
    @media print {
      body { background: #fff !important; color: #111 !important; padding: 0 !important; }
      .actions { display: none !important; }
      .finding-card { border: 1px solid #ddd !important; background: #fff !important; color: #111 !important; }
      .finding-title { color: #111 !important; }
      .code-block { background: #f8f9fa !important; color: #111 !important; border: 1px solid #ddd !important; }
      .summary-card { background: #f8f9fa !important; border: 1px solid #ddd !important; }
      .badge-category { color: #555 !important; background: #eee !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="title">Security Vulnerability Assessment Report</h1>
        <p class="subtitle">Target: <strong>${escapeHtml(profile.name)}</strong> · Generated on ${dateStr}</p>
      </div>
      <div class="actions">
        <button class="btn-print" onclick="window.print()">Print to PDF</button>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-num" style="color: var(--critical)">${criticalCount}</div>
        <div class="summary-label">Critical Risk</div>
      </div>
      <div class="summary-card">
        <div class="summary-num" style="color: var(--high)">${highCount}</div>
        <div class="summary-label">High Risk</div>
      </div>
      <div class="summary-card">
        <div class="summary-num" style="color: var(--medium)">${mediumCount}</div>
        <div class="summary-label">Medium Risk</div>
      </div>
      <div class="summary-card">
        <div class="summary-num" style="color: var(--low)">${lowCount}</div>
        <div class="summary-label">Low Risk</div>
      </div>
    </div>

    <div class="findings-list">
      ${findingsHtml}
    </div>

    <div class="footer">
      <p>Confidential Security Assessment Report · Generated via Antigravity Bug Bounty Checklist</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

  function exportExecutiveHtml() {
    if (!profile || profile.findings.length === 0) return;
    const html = generateExecutiveHtml(profile);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    
    // Open in a new tab for immediate printing / preview
    const win = window.open(url, "_blank");
    if (!win) {
      // Fallback download if popup blocked
      const a = document.createElement("a");
      a.href = url;
      a.download = `${profile.name.replace(/\s+/g, "_")}_Executive_Security_Report.html`;
      a.click();
    }
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
            Export executive HTML reports or copy individual findings formatted for security reports.
          </p>
        </div>

        {profile.findings.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportExecutiveHtml}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40"
              title="Generate printable Executive HTML / PDF Report"
            >
              <Printer className="h-3.5 w-3.5" />
              Executive HTML / PDF
            </button>

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
              Export (.md)
            </button>
          </div>
        )}
      </div>

      {profile.findings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-600" />
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
                    {f.cweId && (
                      <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-mono text-blue-400 border border-blue-500/20">
                        {f.cweId}
                      </span>
                    )}
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

              {f.remediation && (
                <div className="mt-2.5 rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-2.5 text-xs text-emerald-300/90">
                  <span className="font-semibold text-emerald-400 block mb-0.5">Remediation:</span>
                  {f.remediation}
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
