import type { Finding, TargetProfile } from "../types/checklist";
import { cvssSeverityLabel } from "./cvss";
import { escapeHtml, isSafeDataImage, REPORT_CSP } from "./reportSafety";

export type TemplateType = "standard" | "hackerone" | "bugcrowd";

export function formatFinding(f: Finding, template: TemplateType): string {
  if (template === "hackerone") {
    return [
      "## Summary", f.title, "",
      `**Asset / Check:** \`${f.itemText}\``,
      `**Domain / Category:** ${f.domain.toUpperCase()} / ${f.categoryName}`,
      `**Severity:** ${f.severity.toUpperCase()}${f.cvss ? ` (CVSS ${f.cvss.score.toFixed(1)} - ${cvssSeverityLabel(f.cvss.score)})` : ""}`,
      f.cvss ? `**CVSS Vector:** \`${f.cvss.vector}\`` : "",
      f.cweId ? `**CWE ID:** \`${f.cweId}\`` : "",
      f.owaspCategory ? `**OWASP Category:** ${f.owaspCategory}` : "", "",
      "## Steps To Reproduce",
      f.description || "[Add exact steps and observed evidence; no reproduction has been documented.]", "",
      "## Impact",
      "[Describe only demonstrated impact and limitations; see researcher-supplied evidence above. No impact is inferred by this exporter.]", "",
      f.remediation ? `## Remediation Guidance\n${f.remediation}\n` : "",
      f.screenshots?.length ? `_Attached ${f.screenshots.length} screenshot(s) in local report session._` : "",
    ].filter(Boolean).join("\n");
  }
  if (template === "bugcrowd") {
    return [
      `# [Vulnerability Report] ${f.title}`, "", "### Target Endpoint & Classification",
      `- **Domain:** ${f.domain}`, `- **Category:** ${f.categoryName}`, `- **Vulnerability:** ${f.itemText}`,
      `- **Rating:** ${f.severity.toUpperCase()}${f.cvss ? ` (CVSS ${f.cvss.score.toFixed(1)})` : ""}`,
      f.cvss ? `- **CVSS Vector:** \`${f.cvss.vector}\`` : "", f.cweId ? `- **CWE ID:** \`${f.cweId}\`` : "", "",
      "### Vulnerability Details & Replication Steps", f.description || "_(Detailed steps)_", "",
      "### Business Impact", "[Add demonstrated impact and limitations. Do not infer impact from the category or severity.]", "",
      f.remediation ? `### Remediation\n${f.remediation}` : "",
    ].filter(Boolean).join("\n");
  }
  return [
    `## ${f.title}`, "",
    `**Severity:** ${f.severity}${f.cvss ? ` — CVSS ${f.cvss.score.toFixed(1)} (${cvssSeverityLabel(f.cvss.score)})` : ""}`,
    f.cvss ? `**CVSS Vector:** \`${f.cvss.vector}\`` : "", f.cweId ? `**CWE ID:** \`${f.cweId}\`` : "",
    f.owaspCategory ? `**OWASP:** ${f.owaspCategory}` : "", `**Domain / Category:** ${f.domain} / ${f.categoryName}`,
    `**Check:** ${f.itemText}`, "", "### Description / Steps to Reproduce", f.description || "_(no description provided)_", "",
    f.remediation ? `### Remediation Guidance\n${f.remediation}\n` : "",
    f.screenshots?.length ? `_${f.screenshots.length} screenshot(s) attached in-app — export/copy manually if needed for this submission._` : "",
  ].filter(l => l !== "").join("\n");
}

/** Pure HTML export: all imported text/attributes are escaped, images allowlisted. */
export function generateExecutiveHtml(profile: TargetProfile, generatedAt = new Date()): string {
  const dateStr = generatedAt.toLocaleDateString("en-US", {year:"numeric",month:"long",day:"numeric"});
  const findingsHtml = profile.findings.map((f,idx) => `
    <div class="finding-card">
      <div class="finding-header">
        <span class="finding-number">#${idx + 1}</span>
        <div class="finding-title-group">
          <h3 class="finding-title">${escapeHtml(f.title)}</h3>
          <div class="badges">
            <span class="badge badge-${escapeHtml(f.severity)}">${escapeHtml(String(f.severity).toUpperCase())}</span>
            ${f.cvss && Number.isFinite(f.cvss.score) ? `<span class="badge badge-cvss">CVSS ${escapeHtml(f.cvss.score.toFixed(1))}</span>` : ""}
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
        ${f.remediation ? `<h4>Remediation Guidance</h4><p class="remediation-text">${escapeHtml(f.remediation)}</p>` : ""}
        ${f.screenshots?.length ? `<h4>Attached Proof of Concept Evidence</h4><div class="screenshots-grid">${f.screenshots.filter(isSafeDataImage).map((src,i) => `<img src="${escapeHtml(src)}" alt="Evidence ${i + 1}" class="evidence-img" />`).join("")}</div>` : ""}
      </div>
    </div>`).join("");
  const summary = (["critical","high","medium","low","info"] as const).map(severity => `<div class="summary-card"><div class="summary-num" style="color: var(--${severity})">${profile.findings.filter(f => f.severity === severity).length}</div><div class="summary-label">${severity === "info" ? "Informational" : `${severity} Risk`}</div></div>`).join("");
  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${escapeHtml(REPORT_CSP)}">
  <meta name="referrer" content="no-referrer">
  <title>Security Assessment Report — ${escapeHtml(profile.name)}</title>
  <style>
    :root { --bg:#090d16; --card-bg:#111827; --text:#f3f4f6; --text-muted:#9ca3af; --border:#1f2937; --primary:#10b981; --critical:#ef4444; --high:#f97316; --medium:#38bdf8; --low:#10b981; --info:#9ca3af; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; background:var(--bg); color:var(--text); line-height:1.5; padding:40px 20px; }
    .container { max-width:900px; margin:0 auto; }
    .header { border-bottom:2px solid var(--border); padding-bottom:24px; margin-bottom:32px; display:flex; justify-content:space-between; align-items:flex-start; }
    .title { font-size:28px; font-weight:800; color:#fff; }
    .subtitle { color:var(--text-muted); font-size:14px; margin-top:4px; }
    .actions { display:flex; gap:8px; }
    .summary-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:32px; }
    .summary-card { background:var(--card-bg); border:1px solid var(--border); border-radius:8px; padding:16px; text-align:center; }
    .summary-num { font-size:28px; font-weight:800; }
    .summary-label { font-size:12px; color:var(--text-muted); text-transform:uppercase; font-weight:600; }
    .finding-card { background:var(--card-bg); border:1px solid var(--border); border-radius:10px; margin-bottom:24px; padding:24px; page-break-inside:avoid; }
    .finding-header { display:flex; gap:16px; align-items:flex-start; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:16px; }
    .finding-number { font-size:18px; font-weight:800; color:var(--text-muted); font-family:monospace; }
    .finding-title-group { flex:1; }
    .finding-title { font-size:18px; font-weight:700; color:#fff; }
    .badges { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
    .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:700; text-transform:uppercase; font-family:monospace; }
    .badge-critical { background:rgba(239,68,68,.2); color:#fca5a5; border:1px solid rgba(239,68,68,.4); }
    .badge-high { background:rgba(249,115,22,.2); color:#fdba74; border:1px solid rgba(249,115,22,.4); }
    .badge-medium { background:rgba(56,189,248,.2); color:#7dd3fc; border:1px solid rgba(56,189,248,.4); }
    .badge-low { background:rgba(16,185,129,.2); color:#6ee7b7; border:1px solid rgba(16,185,129,.4); }
    .badge-info,.badge-cvss { background:#1f2937; color:#e5e7eb; }
    .badge-cwe { background:#374151; color:#93c5fd; }
    .badge-category { background:#1f2937; color:#9ca3af; text-transform:none; }
    .finding-body h4 { font-size:13px; font-weight:700; color:#e5e7eb; margin:16px 0 8px; }
    .finding-body p { font-size:13px; color:#d1d5db; margin-bottom:8px; }
    .code-block { background:#030712; border:1px solid #1f2937; padding:12px; border-radius:6px; font-family:monospace; font-size:12px; color:#10b981; white-space:pre-wrap; overflow-x:auto; }
    .remediation-text { background:rgba(16,185,129,.08); border-left:3px solid var(--primary); padding:8px 12px; font-size:13px; color:#e5e7eb; }
    .screenshots-grid { display:flex; flex-wrap:wrap; gap:12px; margin-top:8px; }
    .evidence-img { max-height:180px; max-width:100%; border-radius:6px; border:1px solid var(--border); }
    .footer { border-top:1px solid var(--border); padding-top:20px; margin-top:40px; text-align:center; font-size:12px; color:var(--text-muted); }
    @media print {
      body { background:#fff !important; color:#111 !important; padding:0 !important; }
      .actions { display:none !important; }
      .finding-card { border:1px solid #ddd !important; background:#fff !important; color:#111 !important; }
      .finding-title { color:#111 !important; }
      .code-block { background:#f8f9fa !important; color:#111 !important; border:1px solid #ddd !important; }
      .summary-card { background:#f8f9fa !important; border:1px solid #ddd !important; }
      .badge-category { color:#555 !important; background:#eee !important; }
    }
  </style>
</head><body><div class="container">
  <div class="header"><div><h1 class="title">Security Vulnerability Assessment Report</h1><p class="subtitle">Target: <strong>${escapeHtml(profile.name)}</strong> · Generated on ${escapeHtml(dateStr)}</p></div><div class="actions"><p>Use your browser's Print command to save as PDF.</p></div></div>
  <div class="summary-grid">${summary}</div>
  <div class="findings-list">${findingsHtml}</div>
  <div class="footer"><p>Confidential Security Assessment Report · Generated via Bug Bounty Checklist. Findings are researcher-supplied and are not independently verified by this tool.</p></div>
</div></body></html>`;
}
