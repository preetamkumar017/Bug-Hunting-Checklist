import { useState, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Zap,
  Terminal,
  Code2,
  FileCode,
  ShieldAlert,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface HttpAnalyzerModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateToCategory?: (categoryName: string) => void;
}

interface ParsedRequest {
  method: string;
  url: string;
  path: string;
  httpVersion: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
  bodyType: "json" | "xml" | "form" | "multipart" | "graphql" | "text" | "empty";
  jsonParsed?: Record<string, unknown> | null;
}

interface SecuritySuggestion {
  id: string;
  category: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  testSteps: string[];
  samplePayload?: string;
  categoryLink?: string;
}

function parseRawHttpRequest(raw: string): ParsedRequest | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\r?\n/);
  if (lines.length === 0) return null;

  // First line: METHOD /path HTTP/x.x
  const requestLine = lines[0].trim();
  const requestParts = requestLine.split(/\s+/);
  if (requestParts.length < 2) return null;

  const method = requestParts[0].toUpperCase();
  const rawPath = requestParts[1];
  const httpVersion = requestParts[2] || "HTTP/1.1";

  const headers: Record<string, string> = {};
  let bodyStartIndex = -1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      bodyStartIndex = i + 1;
      break;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim();
      headers[key] = val;
    }
  }

  const host = headers["host"] || "target.example.com";
  const scheme = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const fullUrl = rawPath.startsWith("http://") || rawPath.startsWith("https://") 
    ? rawPath 
    : `${scheme}://${host}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;

  // Parse query params
  const queryParams: Record<string, string> = {};
  const querySplit = rawPath.split("?");
  const pathOnly = querySplit[0];
  if (querySplit.length > 1) {
    const searchParams = new URLSearchParams(querySplit.slice(1).join("?"));
    searchParams.forEach((v, k) => {
      queryParams[k] = v;
    });
  }

  // Parse body
  let body = "";
  if (bodyStartIndex !== -1 && bodyStartIndex < lines.length) {
    body = lines.slice(bodyStartIndex).join("\n");
  }

  // Determine body type
  const contentType = (headers["content-type"] || "").toLowerCase();
  let bodyType: ParsedRequest["bodyType"] = "empty";
  let jsonParsed: Record<string, unknown> | null = null;

  if (body.trim().length > 0) {
    if (contentType.includes("application/json") || body.trim().startsWith("{") || body.trim().startsWith("[")) {
      bodyType = "json";
      try {
        jsonParsed = JSON.parse(body);
        if (jsonParsed && typeof jsonParsed === "object" && "query" in jsonParsed) {
          bodyType = "graphql";
        }
      } catch {
        bodyType = "json";
      }
    } else if (contentType.includes("application/xml") || contentType.includes("text/xml") || body.trim().startsWith("<")) {
      bodyType = "xml";
    } else if (contentType.includes("multipart/form-data")) {
      bodyType = "multipart";
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      bodyType = "form";
    } else if (pathOnly.includes("/graphql")) {
      bodyType = "graphql";
    } else {
      bodyType = "text";
    }
  }

  return {
    method,
    url: fullUrl,
    path: pathOnly,
    httpVersion,
    headers,
    queryParams,
    body,
    bodyType,
    jsonParsed,
  };
}

function analyzeRequestForAttacks(req: ParsedRequest): SecuritySuggestion[] {
  const suggestions: SecuritySuggestion[] = [];
  const allParams = { ...req.queryParams };
  
  // Also collect keys from JSON or Form body
  if (req.bodyType === "json" && req.jsonParsed && typeof req.jsonParsed === "object") {
    Object.keys(req.jsonParsed).forEach((k) => {
      allParams[k] = String(req.jsonParsed![k]);
    });
  }

  const paramKeys = Object.keys(allParams);
  const paramKeysLower = paramKeys.map((k) => k.toLowerCase());
  const pathLower = req.path.toLowerCase();

  // 1. IDOR / BOLA Detection
  const idorRegex = /(user_?id|account_?id|org_?id|profile_?id|client_?id|order_?id|member_?id|uid|uuid|id)$/i;
  const pathHasId = /\/(users|accounts|orders|orgs|invoices|documents|profiles)\/([0-9a-fA-F-]+|\d+)/i.test(req.path);
  const paramHasId = paramKeysLower.some((k) => idorRegex.test(k));

  if (pathHasId || paramHasId) {
    suggestions.push({
      id: "idor_bola",
      category: "BOLA & IDOR",
      title: "Broken Object Level Authorization (BOLA / IDOR) Detected",
      severity: "high",
      description: "Identifier found in URL path or parameters. Test if unauthorized users can view, mutate, or delete resources belonging to other tenants or accounts.",
      testSteps: [
        "1. Create two test accounts: Account A (Victim) and Account B (Attacker).",
        "2. Capture this request from Account A.",
        "3. Replace the identifier (ID/UUID) with Account B's resource ID while using Account A's cookies/Bearer token.",
        "4. Test HTTP Method switching: If GET is restricted, try PUT, PATCH, or DELETE on the same endpoint.",
        "5. Test Numeric Array wrapping or HPP: e.g. `?id[]=1&id[]=2` or duplicate parameter `?id=1&id=2`.",
      ],
      samplePayload: "id=999999 or id=attacker_uuid",
      categoryLink: "API Security & BOPLA",
    });
  }

  // 2. SSRF Candidate
  const ssrfRegex = /(url|uri|redirect|dest|destination|callback|webhook|target|feed|fetch|proxy|link|site|endpoint|source)/i;
  const ssrfParam = paramKeys.find((k) => ssrfRegex.test(k));
  if (ssrfParam) {
    suggestions.push({
      id: "ssrf_candidate",
      category: "Server-Side Request Forgery",
      title: `Potential SSRF Injection in parameter "${ssrfParam}"`,
      severity: "critical",
      description: `The parameter "${ssrfParam}" suggests the server fetches external resources. Test for Blind & Full SSRF against internal cloud metadata and private networks.`,
      testSteps: [
        "1. Test Out-of-Band Callback: Point parameter to Burp Collaborator or Interactsh (e.g. `http://xyz.oastify.com`).",
        "2. AWS Cloud Metadata (IMDSv1 & v2): `http://169.254.169.254/latest/meta-data/`.",
        "3. IPv6 / Hex / Octal bypasses: `http://[::1]/`, `http://2130706433/` (127.0.0.1 in decimal).",
        "4. DNS Rebinding: Use services like `127.0.0.1.nip.io` or `lock.cmpxchg8b.com`.",
      ],
      samplePayload: "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
      categoryLink: "Server-Side Injection (SSRF/XXE/SSTI/Command)",
    });
  }

  // 3. GraphQL Endpoint
  if (req.bodyType === "graphql" || pathLower.includes("/graphql")) {
    suggestions.push({
      id: "graphql_attacks",
      category: "GraphQL Security",
      title: "GraphQL Attack Surface (Introspection, Batching & BOPLA)",
      severity: "high",
      description: "GraphQL endpoints often expose sensitive fields via introspection, suffer from batching brute-force attacks, and lack field-level authorization.",
      testSteps: [
        "1. Check Introspection: Send query `{ __schema { types { name fields { name } } } }`.",
        "2. Field Suggestion Leakage: Send a deliberate typo like `{ usr { id } }` to see if server suggests hidden schema fields.",
        "3. Batching DoS / Brute-force: Send an array of queries `[{query: \"...\"}, {query: \"...\"}]` to bypass rate limiting.",
        "4. Mutation Privilege Escalation: Check for `updateUserRole`, `adminResetPassword`, or hidden mutations.",
      ],
      samplePayload: `{"query": "query { __schema { types { name } } }"}`,
      categoryLink: "GraphQL Security",
    });
  }

  // 4. JWT Authorization Header
  const authHeader = req.headers["authorization"] || "";
  if (authHeader.toLowerCase().startsWith("bearer ey") || (req.headers["cookie"] || "").includes("ey")) {
    suggestions.push({
      id: "jwt_attacks",
      category: "Authentication & JWT",
      title: "JSON Web Token (JWT) Vulnerabilities",
      severity: "high",
      description: "Bearer JWT detected. Test for signature bypasses, algorithm confusion (RS256 -> HS256), JWKS spoofing, and claim manipulation.",
      testSteps: [
        "1. Decode Header and Payload using the in-app Swiss Army Knife JWT Inspector.",
        "2. Algorithm None: Change header `{\"alg\": \"none\", \"typ\": \"JWT\"}` and strip the signature entirely.",
        "3. Weak HMAC Secret: Extract token and run `hashcat -m 16500 jwt.txt rockyou.txt` or `jwt_tool.py`.",
        "4. JWKS Injection: Check if the token supports `jku` or `jwk` headers that point to an attacker-controlled key.",
        "5. Kid Header Injection: Test for SQL injection or path traversal in the `kid` (key ID) header (e.g. `../../dev/null`).",
      ],
      samplePayload: 'Header: {"alg":"none","typ":"JWT"}',
      categoryLink: "Authentication, Sessions & JWT",
    });
  }

  // 5. Mass Assignment / Privilege Escalation
  if ((req.method === "POST" || req.method === "PUT" || req.method === "PATCH") && req.bodyType === "json") {
    suggestions.push({
      id: "mass_assignment",
      category: "Business Logic & Mass Assignment",
      title: "Mass Assignment / Parameter Binding Attack",
      severity: "medium",
      description: "JSON update requests often map directly into database models. Test adding administrative or privileged fields.",
      testSteps: [
        "1. Inject privilege attributes: `\"role\": \"admin\"`, `\"is_admin\": true`, `\"role_id\": 1`.",
        "2. Inject account status attributes: `\"verified\": true`, `\"email_verified\": true`, `\"plan\": \"enterprise\"`.",
        "3. Inject tenant switching attributes: `\"organization_id\": 1`, `\"company_id\": 1`.",
        "4. Test type confusion: sending integers instead of strings or boolean flags.",
      ],
      samplePayload: '{"role": "admin", "is_admin": true, "permissions": ["*"]}',
      categoryLink: "Business Logic & Workflows",
    });
  }

  // 6. XML / XXE
  if (req.bodyType === "xml") {
    suggestions.push({
      id: "xxe_injection",
      category: "XML External Entity (XXE)",
      title: "XML External Entity (XXE) Injection Target",
      severity: "critical",
      description: "XML request body parsed by backend parser. Test for local file inclusion, SSRF, and Billion Laughs DoS.",
      testSteps: [
        "1. Define an external entity referencing `/etc/passwd` or `win.ini`.",
        "2. Test Out-of-band XXE (OOB XXE) referencing your Collaborator server: `<!ENTITY % oob SYSTEM \"http://xyz.oastify.com\">`.",
        "3. Test XInclude injection if only XML fragments are parsed: `<xi:include parse=\"text\" href=\"file:///etc/passwd\"/>`.",
      ],
      samplePayload: `<!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>\n<data>&xxe;</data>`,
      categoryLink: "Server-Side Injection (SSRF/XXE/SSTI/Command)",
    });
  }

  // 7. File Upload / Multipart
  if (req.bodyType === "multipart") {
    suggestions.push({
      id: "file_upload_attacks",
      category: "File Upload Vulnerabilities",
      title: "Multipart File Upload Attack Vectors",
      severity: "high",
      description: "File upload handling detected. Test for arbitrary file upload, path traversal, polyglot files, and stored XSS.",
      testSteps: [
        "1. Filename Path Traversal: Set `filename=\"../../../var/www/html/shell.php\"`.",
        "2. Double Extensions & Null Byte: `shell.php.jpg`, `shell.phtml`, `shell.php%00.png`.",
        "3. SVG Stored XSS: Upload `.svg` containing `<script>alert(document.domain)</script>`.",
        "4. Content-Type Tampering: Send executable code with `Content-Type: image/png`.",
      ],
      samplePayload: 'Content-Disposition: form-data; name="file"; filename="../../shell.php"',
      categoryLink: "File Upload & Media Processing",
    });
  }

  // 8. Next.js / RSC Detection
  const hasRscHeader = req.headers["rsc"] === "1" || "next-action" in req.headers || pathLower.includes("_rsc=");
  if (hasRscHeader) {
    suggestions.push({
      id: "nextjs_rsc",
      category: "Modern Frameworks (Next.js/RSC)",
      title: "Next.js App Router & React Server Actions Vector",
      severity: "high",
      description: "Next.js React Server Components (RSC) or Server Action headers detected. Test for server action authorization bypass, prototype pollution, and SSRF in RSC pre-fetches.",
      testSteps: [
        "1. Server Action Direct Invocation: Identify the action hash in `Next-Action` header and invoke it without front-end validation.",
        "2. State Tampering: Inspect hidden bound action arguments (e.g. `1_id`, `1_price`) passed through action closures.",
        "3. Server-side prototype pollution: Test crafted JSON keys `__proto__` or `constructor.prototype` in action body.",
      ],
      samplePayload: "Next-Action: [action-id-hash]\nContent-Type: multipart/form-data",
      categoryLink: "Modern Framework Security (Next.js, RSC, Tauri)",
    });
  }

  // 9. CORS Vulnerability
  if ("origin" in req.headers || pathLower.includes("/api/")) {
    suggestions.push({
      id: "cors_misconfig",
      category: "CORS Misconfiguration",
      title: "Cross-Origin Resource Sharing (CORS) Reflection Test",
      severity: "medium",
      description: "API endpoint receiving Origin or authentication tokens. Verify if server reflects arbitrary origin with Access-Control-Allow-Credentials: true.",
      testSteps: [
        "1. Send `Origin: https://attacker.com` — check if response reflects `Access-Control-Allow-Origin: https://attacker.com`.",
        "2. Send `Origin: null` — check if response allows null origin with credentials.",
        "3. Test trust in subdomains: `Origin: https://target.example.com.attacker.com` or `https://attackertarget.example.com`.",
      ],
      samplePayload: "Origin: https://attacker-controlled.com",
      categoryLink: "API Security & BOPLA",
    });
  }

  // 10. General Injection Check (SQLi / Command / SSTI)
  if (paramKeys.length > 0) {
    suggestions.push({
      id: "injection_probes",
      category: "Input Validation & Injection",
      title: "General Injection Vector Probes (SQLi, SSTI, Command Injection)",
      severity: "high",
      description: "Input parameters detected. Inject contextual escape sequences to check for database errors, template expression evaluation, or command execution.",
      testSteps: [
        "1. SQLi Probe: `'\"` or `1' OR '1'='1` or sleep `(SELECT pg_sleep(5))`.",
        "2. SSTI Probe: `{{7*7}}`, `${7*7}`, `<%= 7*7 %>` to test Jinja2, Twig, or ERB.",
        "3. Command Injection Probe: `; sleep 5;`, `| id`, `$(whoami)`, `` `id` ``.",
      ],
      samplePayload: "{{7*7}} or ' OR 1=1--",
      categoryLink: "SQL Injection & Database Security",
    });
  }

  return suggestions;
}

function generateCurl(req: ParsedRequest): string {
  const parts = [`curl -i -s -k -X ${req.method} "${req.url}"`];
  Object.entries(req.headers).forEach(([k, v]) => {
    parts.push(`  -H "${k}: ${v.replace(/"/g, '\\"')}"`);
  });
  if (req.body && req.method !== "GET" && req.method !== "HEAD") {
    parts.push(`  --data-raw '${req.body.replace(/'/g, "'\\''")}'`);
  }
  return parts.join(" \\\n");
}

function generatePython(req: ParsedRequest): string {
  const headersDict = JSON.stringify(req.headers, null, 4);
  const code = [
    `import requests`,
    ``,
    `url = "${req.url}"`,
    `headers = ${headersDict}`,
  ];

  if (req.body && req.method !== "GET") {
    if (req.bodyType === "json") {
      code.push(`data = ${JSON.stringify(req.body)}`);
      code.push(`response = requests.${req.method.toLowerCase()}(url, headers=headers, data=data, verify=False)`);
    } else {
      code.push(`data = """${req.body.replace(/"""/g, '\\"\\"\\"')}"""`);
      code.push(`response = requests.${req.method.toLowerCase()}(url, headers=headers, data=data, verify=False)`);
    }
  } else {
    code.push(`response = requests.${req.method.toLowerCase()}(url, headers=headers, verify=False)`);
  }

  code.push(``);
  code.push(`print(f"Status: {response.status_code}")`);
  code.push(`print(response.text[:500])`);
  return code.join("\n");
}

function generateNucleiTemplate(req: ParsedRequest): string {
  const host = req.headers["host"] || "{{Hostname}}";
  const relativePath = req.path || "/";
  const idName = `custom-request-${req.method.toLowerCase()}-${relativePath.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30)}`;

  const headerLines = Object.entries(req.headers)
    .filter(([k]) => k !== "host" && k !== "content-length")
    .map(([k, v]) => `        ${k}: ${v}`)
    .join("\n");

  return `id: ${idName}

info:
  name: Custom Security Check for ${relativePath}
  author: bug-bounty-hunter
  severity: medium
  tags: custom,api,fuzzing

http:
  - raw:
      - |
        ${req.method} ${relativePath} ${req.httpVersion}
        Host: ${host}
${headerLines ? `${headerLines}\n` : ""}${req.body ? `\n        ${req.body.split("\n").join("\n        ")}` : ""}

    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200
`;
}

export function HttpAnalyzerModal({ open, onClose, onNavigateToCategory }: HttpAnalyzerModalProps) {
  const [rawText, setRawText] = useState("");
  const [activeTab, setActiveTab] = useState<"analysis" | "curl" | "python" | "nuclei">("analysis");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const parsedRequest = useMemo(() => {
    return parseRawHttpRequest(rawText);
  }, [rawText]);

  const suggestions = useMemo(() => {
    if (!parsedRequest) return [];
    return analyzeRequestForAttacks(parsedRequest);
  }, [parsedRequest]);

  if (!open) return null;

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  function loadSample() {
    setRawText(`POST /api/v1/users/1042/update_profile HTTP/1.1
Host: target.example.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDQyLCJyb2xlIjoidXNlciJ9.signature
Content-Type: application/json
Origin: https://target.example.com
Referer: https://target.example.com/settings

{
  "username": "pentester",
  "avatar_url": "https://attacker.com/avatar.png",
  "bio": "Security researcher",
  "webhook_callback": "http://169.254.169.254/latest/meta-data/"
}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Raw HTTP Request &amp; Vulnerability Analyzer
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                  Burp / Caido Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Paste a raw HTTP request to detect attack vectors, generate PoC scripts, and jump to checklist playbooks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!rawText && (
              <button
                onClick={loadSample}
                className="flex items-center gap-1 rounded-md border border-border bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:text-emerald-400"
              >
                <Sparkles className="h-3 w-3 text-amber-400" /> Load Sample Request
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left: Input Textarea */}
          <div className="flex flex-1 flex-col border-b border-border p-4 md:border-b-0 md:border-r">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Raw HTTP Request (Burp / Caido / Network Tab)
              </span>
              {rawText && (
                <button
                  onClick={() => setRawText("")}
                  className="text-[11px] text-red-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`POST /api/v1/users/42 HTTP/1.1\nHost: example.com\nAuthorization: Bearer ey...\nContent-Type: application/json\n\n{"name": "john", "role": "admin"}`}
              className="flex-1 resize-none rounded-lg border border-border/80 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500"
            />
            {parsedRequest && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/20">
                  {parsedRequest.method}
                </span>
                <span className="font-mono text-slate-300 truncate max-w-[200px]" title={parsedRequest.path}>
                  {parsedRequest.path}
                </span>
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-sky-300 font-mono">
                  Body: {parsedRequest.bodyType}
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-400 font-mono">
                  {Object.keys(parsedRequest.headers).length} headers
                </span>
              </div>
            )}
          </div>

          {/* Right: Output & Security Analysis */}
          <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/40">
            {/* Tabs */}
            <div className="flex border-b border-border bg-card px-4 pt-2">
              {[
                { id: "analysis", label: `Security Suggestions (${suggestions.length})`, icon: ShieldAlert },
                { id: "curl", label: "cURL Command", icon: Terminal },
                { id: "python", label: "Python Exploit", icon: Code2 },
                { id: "nuclei", label: "Nuclei Template", icon: FileCode },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "border-emerald-500 text-emerald-400"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4">
              {!parsedRequest ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                  <Search className="mb-2 h-8 w-8 text-slate-600" />
                  <p className="text-sm font-medium">Paste a raw HTTP request on the left</p>
                  <p className="mt-1 text-xs text-slate-600 max-w-sm">
                    Antigravity will parse headers, parameters, and payloads to identify vulnerabilities and generate ready-to-run automation.
                  </p>
                  <button
                    onClick={loadSample}
                    className="mt-4 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    Try Sample Request
                  </button>
                </div>
              ) : activeTab === "analysis" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-300">
                      🎯 Identified Attack Vectors &amp; Checklist Matches:
                    </p>
                    <span className="text-[11px] text-slate-500">{suggestions.length} vectors detected</span>
                  </div>

                  {suggestions.length === 0 ? (
                    <div className="rounded-lg border border-border p-6 text-center text-xs text-slate-400">
                      No obvious specific vulnerability signatures detected in standard parameters. Test general injection and authorization controls manually.
                    </div>
                  ) : (
                    suggestions.map((sug) => (
                      <div
                        key={sug.id}
                        className="rounded-lg border border-border bg-card p-3.5 transition hover:border-border/80"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                sug.severity === "critical"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : sug.severity === "high"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-sky-500/20 text-sky-300"
                              }`}
                            >
                              {sug.severity}
                            </span>
                            <span className="text-xs font-bold text-slate-200">{sug.title}</span>
                          </div>
                          {sug.categoryLink && onNavigateToCategory && (
                            <button
                              onClick={() => {
                                onNavigateToCategory(sug.categoryLink!);
                                onClose();
                              }}
                              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                            >
                              Go to checks <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-400">{sug.description}</p>

                        <div className="mt-2.5 rounded bg-slate-950 p-2 text-[11px] text-slate-300">
                          <p className="mb-1 font-semibold text-slate-400">Recommended Test Methodology:</p>
                          <ul className="space-y-1 text-slate-400">
                            {sug.testSteps.map((step, idx) => (
                              <li key={idx} className="font-mono text-[11px]">
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {sug.samplePayload && (
                          <div className="mt-2 flex items-center justify-between rounded border border-border/50 bg-slate-900/80 px-2 py-1">
                            <code className="text-[11px] font-mono text-amber-300 truncate max-w-md">
                              {sug.samplePayload}
                            </code>
                            <button
                              onClick={() => handleCopy(sug.samplePayload!, sug.id)}
                              className="text-xs text-slate-400 hover:text-slate-200 ml-2"
                              title="Copy payload"
                            >
                              {copiedKey === sug.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === "curl" ? (
                <div className="flex h-full flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Ready to run in terminal:</span>
                    <button
                      onClick={() => handleCopy(generateCurl(parsedRequest), "curl")}
                      className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    >
                      {copiedKey === "curl" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy cURL
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto rounded-lg border border-border bg-slate-950 p-3 font-mono text-xs text-emerald-400 selection:bg-emerald-900">
                    {generateCurl(parsedRequest)}
                  </pre>
                </div>
              ) : activeTab === "python" ? (
                <div className="flex h-full flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Standalone Python 3 script (`requests`):</span>
                    <button
                      onClick={() => handleCopy(generatePython(parsedRequest), "python")}
                      className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    >
                      {copiedKey === "python" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy Python Script
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto rounded-lg border border-border bg-slate-950 p-3 font-mono text-xs text-sky-300 selection:bg-sky-900">
                    {generatePython(parsedRequest)}
                  </pre>
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Nuclei Automation Template (.yaml):</span>
                    <button
                      onClick={() => handleCopy(generateNucleiTemplate(parsedRequest), "nuclei")}
                      className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    >
                      {copiedKey === "nuclei" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy Nuclei Template
                    </button>
                  </div>
                  <pre className="flex-1 overflow-auto rounded-lg border border-border bg-slate-950 p-3 font-mono text-xs text-amber-300 selection:bg-amber-900">
                    {generateNucleiTemplate(parsedRequest)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
