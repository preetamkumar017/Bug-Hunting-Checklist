import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Sparkles,
  Save,
} from "lucide-react";
import { useChecklistStore, useActiveProfile } from "../store/useChecklistStore";
import type { Severity, Domain } from "../types/checklist";

interface ReportDrafterModalProps {
  open: boolean;
  onClose: () => void;
}

interface VulnPreset {
  id: string;
  label: string;
  domain: Domain;
  categoryName: string;
  cweId: string;
  owaspCategory: string;
  defaultSeverity: Severity;
  defaultTitle: string;
  stepsTemplate: string;
  impactTemplate: string;
  remediationTemplate: string;
}

const VULN_PRESETS: VulnPreset[] = [
  {
    id: "idor",
    label: "BOLA / IDOR (Broken Object Level Authorization)",
    domain: "api",
    categoryName: "API Security & BOPLA",
    cweId: "CWE-639",
    owaspCategory: "API1:2023 Broken Object Level Authorization",
    defaultSeverity: "high",
    defaultTitle: "BOLA / IDOR on [ENDPOINT] allows unauthorized access to user records",
    stepsTemplate: `1. Log in to the application with Attacker Account A and observe your resource identifier (e.g. ID: 1042).
2. Create or identify Victim Account B with resource identifier (e.g. ID: 1099).
3. Intercept the request to:
   \`\`\`http
   GET /api/v1/resources/1042 HTTP/1.1
   Host: target.example.com
   Authorization: Bearer <Attacker_Token_A>
   \`\`\`
4. Tamper with the identifier in the URL path or body, changing 1042 to 1099:
   \`\`\`http
   GET /api/v1/resources/1099 HTTP/1.1
   Host: target.example.com
   Authorization: Bearer <Attacker_Token_A>
   \`\`\`
5. Observe the response: The server returns 200 OK with Victim B's confidential details.`,
    impactTemplate:
      "An unauthorized attacker can enumerate and extract sensitive personally identifiable information (PII), confidential documents, or financial transaction records belonging to any user in the system without possessing valid access privileges or tenant authorization.",
    remediationTemplate:
      "Implement server-side object-level access control checks. Before returning or mutating any resource, query the current authenticated session user and verify that they are the legitimate owner or possess tenant authorization for the requested object ID.",
  },
  {
    id: "ssrf",
    label: "Server-Side Request Forgery (SSRF)",
    domain: "web",
    categoryName: "Server-Side Injection (SSRF)",
    cweId: "CWE-918",
    owaspCategory: "A10:2021 Server-Side Request Forgery (SSRF)",
    defaultSeverity: "critical",
    defaultTitle: "Server-Side Request Forgery (SSRF) in [PARAMETER] enables internal metadata access",
    stepsTemplate: `1. Navigate to the target functionality (e.g. webhook setup, PDF generator, or URL preview).
2. Intercept the HTTP request submitting the target URL:
   \`\`\`http
   POST /api/webhooks/test HTTP/1.1
   Host: target.example.com
   Content-Type: application/json

   {"url": "http://169.254.169.254/latest/meta-data/"}
   \`\`\`
3. Send the request and observe the server response.
4. The server makes an outbound request to the AWS EC2 instance metadata endpoint and reflects IAM role names or security credentials in the HTTP response.`,
    impactTemplate:
      "An attacker can leverage the vulnerable server as a proxy to probe the internal local network, query cloud instance metadata (AWS IMDSv1/v2, GCP, Azure), extract temporary cloud service IAM credentials, and pivot deeper into private infrastructure.",
    remediationTemplate:
      "Enforce strict URL allowlists rather than denylists. Disable HTTP redirection on server-side HTTP clients. Enforce AWS IMDSv2 (requiring token PUT requests) with a hop limit of 1 to prevent containerized workloads from querying host metadata.",
  },
  {
    id: "sqli",
    label: "SQL Injection (SQLi)",
    domain: "web",
    categoryName: "SQL Injection & Database Security",
    cweId: "CWE-89",
    owaspCategory: "A03:2021 Injection",
    defaultSeverity: "critical",
    defaultTitle: "SQL Injection in [PARAMETER] leads to database exposure",
    stepsTemplate: `1. Identify the search/filter parameter in:
   \`\`\`http
   GET /api/search?q=test HTTP/1.1
   Host: target.example.com
   \`\`\`
2. Submit a single quote payload: \`?q=test'\` and observe database syntax error (500 Internal Server Error).
3. Confirm time-based blind injection with a 5-second sleep payload:
   \`\`\`http
   GET /api/search?q=test'+AND+(SELECT+1+FROM+(SELECT(SLEEP(5)))a)--+- HTTP/1.1
   Host: target.example.com
   \`\`\`
4. Observe that the HTTP response arrives with a 5,000ms delay, confirming server-side SQL query execution.`,
    impactTemplate:
      "Complete compromise of database confidentiality and integrity. An attacker can extract sensitive customer records, password hashes, and cryptographic keys, or modify administrative balances and records.",
    remediationTemplate:
      "Use parameterized queries (Prepared Statements) or ORM abstraction layers with bind parameters for all database interactions. Never concatenate user-supplied input into raw SQL queries.",
  },
  {
    id: "stored_xss",
    label: "Stored Cross-Site Scripting (XSS)",
    domain: "web",
    categoryName: "Cross-Site Scripting (XSS)",
    cweId: "CWE-79",
    owaspCategory: "A03:2021 Injection",
    defaultSeverity: "high",
    defaultTitle: "Stored XSS in [FIELD] allows session hijacking",
    stepsTemplate: `1. Navigate to the profile edit or comments section.
2. In the target input field, enter the following payload:
   \`\`\`html
   "><img src=x onerror=alert(document.domain)>
   \`\`\`
3. Save the form.
4. Log in as a different user or administrator and view the updated profile or comments page.
5. An alert dialog displays \`document.domain\`, proving stored JavaScript execution in the victim's session.`,
    impactTemplate:
      "An attacker can execute arbitrary JavaScript in the browser context of any victim viewing the affected page. This enables session token theft, unauthorized client-side state manipulation, or phishing overlays.",
    remediationTemplate:
      "Contextually HTML-encode user input before rendering in the DOM. Deploy a strong Content Security Policy (CSP) with `script-src 'self'` and avoid using `unsafe-inline`.",
  },
  {
    id: "nextjs_action",
    label: "Next.js Server Action Authorization Bypass",
    domain: "web",
    categoryName: "Modern Framework Security (Next.js/RSC)",
    cweId: "CWE-285",
    owaspCategory: "A01:2021 Broken Access Control",
    defaultSeverity: "high",
    defaultTitle: "Unauthenticated Next.js Server Action invocation allows unauthorized state mutation",
    stepsTemplate: `1. Locate the Next-Action hash from client JavaScript bundle or intercepted network requests.
2. Formulate a direct POST request without any session cookie or authentication headers:
   \`\`\`http
   POST / HTTP/1.1
   Host: target.example.com
   Next-Action: c4b1979b0bf881d713a0774a3bd5144b6c3d9bca
   Content-Type: application/json

   ["target_user_id", {"role": "admin"}]
   \`\`\`
3. Send the request.
4. The server returns 200 OK and applies the update without validating whether the caller is authenticated or authorized.`,
    impactTemplate:
      "Next.js Server Actions are public HTTP endpoints. When authentication checks are omitted inside the action function, any unauthenticated attacker can invoke administrative routines and bypass UI-level guardrails.",
    remediationTemplate:
      "Verify caller session authentication and role authorizations at the very start of every Server Action function body using server-side session utilities (e.g. `auth()` or `getServerSession()`).",
  },
];

export function ReportDrafterModal({ open, onClose }: ReportDrafterModalProps) {
  const profile = useActiveProfile();
  const addFinding = useChecklistStore((s) => s.addFinding);

  const [presetId, setPresetId] = useState<string>("idor");
  const [title, setTitle] = useState(VULN_PRESETS[0].defaultTitle);
  const [severity, setSeverity] = useState<Severity>(VULN_PRESETS[0].defaultSeverity);
  const [targetUrl, setTargetUrl] = useState("https://target.example.com/api/v1/...");
  const [steps, setSteps] = useState(VULN_PRESETS[0].stepsTemplate);
  const [impact, setImpact] = useState(VULN_PRESETS[0].impactTemplate);
  const [remediation, setRemediation] = useState(VULN_PRESETS[0].remediationTemplate);
  const [cweId, setCweId] = useState(VULN_PRESETS[0].cweId);
  const [copiedH1, setCopiedH1] = useState(false);
  const [copiedBc, setCopiedBc] = useState(false);
  const [savedToFindings, setSavedToFindings] = useState(false);

  if (!open) return null;

  function handlePresetChange(id: string) {
    setPresetId(id);
    const p = VULN_PRESETS.find((x) => x.id === id);
    if (p) {
      setTitle(p.defaultTitle);
      setSeverity(p.defaultSeverity);
      setSteps(p.stepsTemplate);
      setImpact(p.impactTemplate);
      setRemediation(p.remediationTemplate);
      setCweId(p.cweId);
    }
  }

  function generateHackerOneReport(): string {
    return `## Summary:
${title}

**Target Endpoint / Asset:** \`${targetUrl}\`
**Severity Rating:** ${severity.toUpperCase()}
**Weakness (CWE):** ${cweId}

---

## Steps To Reproduce:
${steps}

---

## Business Impact:
${impact}

---

## Suggested Remediation:
${remediation}

---
*Report drafted with Antigravity Bug Bounty Suite*`;
  }

  function generateBugcrowdReport(): string {
    return `# [Vulnerability Report] ${title}

### Target Asset & Weakness
- **Target URL:** ${targetUrl}
- **Vulnerability Rating:** ${severity.toUpperCase()}
- **Classification:** ${cweId}

### Vulnerability Details & Replication Steps
${steps}

### Impact Analysis
${impact}

### Recommended Fix
${remediation}`;
  }

  async function copyH1() {
    await navigator.clipboard.writeText(generateHackerOneReport());
    setCopiedH1(true);
    setTimeout(() => setCopiedH1(false), 1500);
  }

  async function copyBc() {
    await navigator.clipboard.writeText(generateBugcrowdReport());
    setCopiedBc(true);
    setTimeout(() => setCopiedBc(false), 1500);
  }

  function handleSaveAsFinding() {
    const currentPreset = VULN_PRESETS.find((p) => p.id === presetId) || VULN_PRESETS[0];

    addFinding({
      itemId: `custom-${Date.now()}`,
      itemText: `${currentPreset.label} on ${targetUrl}`,
      domain: currentPreset.domain,
      categoryName: currentPreset.categoryName,
      severity,
      title,
      description: `### Steps to Reproduce\n${steps}\n\n### Impact\n${impact}`,
      remediation,
      cweId,
      owaspCategory: currentPreset.owaspCategory,
    });

    setSavedToFindings(true);
    setTimeout(() => {
      setSavedToFindings(false);
      onClose();
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Smart Vulnerability Report Drafter
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  HackerOne &amp; Bugcrowd
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Craft professional, high-impact vulnerability reports for {profile?.name || "your target"} with automated impact &amp; fix advice.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drafter Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 space-y-4">
          {/* Top Controls Bar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Vulnerability Template Preset:
              </label>
              <select
                value={presetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              >
                {VULN_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Severity Rating:
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs font-semibold text-rose-300 outline-none focus:border-emerald-500"
              >
                <option value="critical">Critical (P1)</option>
                <option value="high">High (P2)</option>
                <option value="medium">Medium (P3)</option>
                <option value="low">Low (P4)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                CWE Identifier:
              </label>
              <input
                type="text"
                value={cweId}
                onChange={(e) => setCweId(e.target.value)}
                placeholder="e.g. CWE-639"
                className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Title & Target */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Report Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Clear, descriptive vulnerability title..."
                className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Target Endpoint / Asset:
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://api.target.com/..."
                className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Steps to Reproduce (Markdown &amp; HTTP Snippets):
            </label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-border bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Impact and Remediation */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Business Impact &amp; Risk:
              </label>
              <textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-slate-950 p-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Remediation &amp; Mitigation Guidance:
              </label>
              <textarea
                value={remediation}
                onChange={(e) => setRemediation(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-slate-950 p-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-slate-950/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={copyH1}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-slate-100"
            >
              {copiedH1 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              Copy HackerOne Markdown
            </button>
            <button
              onClick={copyBc}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-slate-100"
            >
              {copiedBc ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              Copy Bugcrowd Format
            </button>
          </div>

          <button
            onClick={handleSaveAsFinding}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            {savedToFindings ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {savedToFindings ? "Saved to Target Findings!" : "Save to Findings & Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
