import type { Domain, Severity } from "../types/checklist";

export interface ReportPreset { id: string; label: string; domain: Domain; categoryName: string; cweId: string; guidance: string; remediation: string }
export const REPORT_PRESETS: ReportPreset[] = [
  {id:"idor",label:"BOLA / IDOR",domain:"api",categoryName:"API Authentication & Authorization",cweId:"CWE-639",guidance:"Use two researcher-owned accounts and resources. Record the ownership boundary, baseline denial, changed identifier, actual returned data or persisted change. A 200 response alone does not establish access.",remediation:"Enforce server-side object and tenant authorization on every read and write."},
  {id:"ssrf",label:"Server-Side Request Forgery",domain:"web",categoryName:"Server-Side Request Forgery (SSRF)",cweId:"CWE-918",guidance:"Record baseline and unique controlled callback, timestamp and source. Distinguish DNS lookup, HTTP callback and response read. Do not infer internal access or cloud credentials from a callback. IMDSv2 requires a token exchange; record only capabilities actually demonstrated.",remediation:"Allowlist destinations and schemes, resolve and validate all addresses at connection time and after every redirect, restrict egress and disable unnecessary redirects. Require IMDSv2 as defense in depth; hop limits depend on deployment and are not a complete SSRF fix."},
  {id:"sqli",label:"SQL Injection",domain:"web",categoryName:"SQL Injection",cweId:"CWE-89",guidance:"Record the input context, baseline and negative control. For timing evidence, repeat and interleave control/probe requests, account for latency variance and show a reproducible signal. A 500 response, quote error, or one slow response is not proof. Do not assert read/write access beyond demonstrated behavior.",remediation:"Use parameterized queries with bound values, allowlist identifiers that cannot be bound, and least-privilege database accounts. An ORM is safe only when its query path parameterizes untrusted values."},
  {id:"stored_xss",label:"Stored Cross-Site Scripting",domain:"web",categoryName:"Cross-Site Scripting (XSS)",cweId:"CWE-79",guidance:"Record storage location, rendering context, payload, second researcher-owned viewer account and observed execution. Distinguish stored cross-user execution from self-XSS. HttpOnly cookies are not readable by JavaScript; do not claim session theft without evidence.",remediation:"Use context-appropriate output encoding and safe DOM sinks. For intentionally supported HTML use a maintained sanitizer. Avoid inserting data into JavaScript contexts. Add a nonce/hash-based CSP as defense in depth; CSP does not replace fixing the sink."},
  {id:"nextjs_action",label:"Server Action Authorization",domain:"web",categoryName:"Authorization",cweId:"CWE-285",guidance:"Capture a real action request rather than inventing its wire format. Compare authenticated and unauthorized calls, and independently verify any persisted state change. A public action identifier or HTTP 200 is not an authorization bypass.",remediation:"Authenticate and authorize inside every action, validating object ownership, tenant and permitted fields before changing state."},
];
export interface ReportDraft { title: string; targetUrl: string; severity: Severity; cweId: string; steps: string; evidence: string; impact: string; remediation: string }
const DRAFT_PLACEHOLDERS = {
  title: "[affected component]",
  targetUrl: "[target endpoint]",
  steps: "[Prerequisites and exact reproducible steps, including baseline and negative control]",
  evidence: "[Observed result with redacted request/response, timestamps and evidence references]",
  impact: "[Demonstrated security boundary crossed, affected data/actions and tested limitations]",
} as const;
export function newReportDraft(preset: ReportPreset): ReportDraft {
  return {title:`${preset.label} in ${DRAFT_PLACEHOLDERS.title}`,targetUrl:DRAFT_PLACEHOLDERS.targetUrl,severity:"info",cweId:preset.cweId,steps:DRAFT_PLACEHOLDERS.steps,evidence:DRAFT_PLACEHOLDERS.evidence,impact:DRAFT_PLACEHOLDERS.impact,remediation:preset.remediation};
}
export function reportDraftIssues(d: ReportDraft): string[] {
  const issues: string[] = [];
  for (const key of ["title","targetUrl","steps","evidence","impact"] as const) {
    const value = d[key].trim();
    // Only known prompts or wholly unfilled markers are placeholders. Evidence
    // may legitimately contain JSON arrays, timestamps, IPv6 or a quoted TODO.
    if (!value || /^(?:todo|tbd|\[todo\]|\[tbd\])$/i.test(value) ||
        Object.values(DRAFT_PLACEHOLDERS).some(p => value.toLowerCase().includes(p.toLowerCase()))) {
      issues.push(`Complete ${key} with observed facts.`);
    }
  }
  return issues;
}
export function generateReportDraft(d: ReportDraft, template: "hackerone" | "bugcrowd", evidenceConfirmed = false): string {
  const incomplete = reportDraftIssues(d).length > 0 || !evidenceConfirmed;
  return `${incomplete ? "> INCOMPLETE DRAFT — placeholders and evidence require review; not ready for submission.\n\n" : "> Researcher-reviewed draft; independently validate scope, evidence and severity before submission.\n\n"}# ${template === "hackerone" ? "HackerOne" : "Bugcrowd"} report draft: ${d.title}\n\n## Target\n${d.targetUrl}\n\n**Researcher-assigned severity:** ${d.severity}\n**CWE:** ${d.cweId}\n\n## Steps to reproduce\n${d.steps}\n\n## Observed evidence\n${d.evidence}\n\n## Demonstrated impact and limitations\n${d.impact}\n\n## Suggested remediation\n${d.remediation}\n\n_Drafted with Bug Bounty Checklist. No evidence or impact is inferred by this tool._\n`;
}
