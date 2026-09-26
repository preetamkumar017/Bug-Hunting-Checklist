import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  Shield,
  Settings,
} from "lucide-react";
import { useActiveProfile } from "../store/useChecklistStore";

interface BurpRulesModalProps {
  open: boolean;
  onClose: () => void;
}

export function BurpRulesModal({ open, onClose }: BurpRulesModalProps) {
  const profile = useActiveProfile();
  const [hackerHandle, setHackerHandle] = useState("researcher");
  const [includeWafBypass, setIncludeWafBypass] = useState(true);
  const [includeNoCache, setIncludeNoCache] = useState(true);
  const [mobileEmulate, setMobileEmulate] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"burp" | "caido" | "curl">("burp");

  if (!open) return null;

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  // Generate Burp Match & Replace Rules JSON
  const burpRules = [
    {
      comment: "Bug Bounty Safe Harbor Researcher ID",
      enabled: true,
      is_simple_match: true,
      rule_type: "request_header",
      string_match: "",
      string_replace: `X-Bug-Bounty: ${hackerHandle || "researcher"} (${profile?.name || "Target"})`,
    },
  ];

  if (includeWafBypass) {
    burpRules.push({
      comment: "WAF Evasion / Localhost Header Spoof",
      enabled: true,
      is_simple_match: true,
      rule_type: "request_header",
      string_match: "",
      string_replace: "X-Forwarded-For: 127.0.0.1",
    });
    burpRules.push({
      comment: "Originating IP Header Spoof",
      enabled: true,
      is_simple_match: true,
      rule_type: "request_header",
      string_match: "",
      string_replace: "X-Originating-IP: 127.0.0.1",
    });
  }

  if (includeNoCache) {
    burpRules.push({
      comment: "Force Fresh Response (Bypass Cache)",
      enabled: true,
      is_simple_match: true,
      rule_type: "request_header",
      string_match: "",
      string_replace: "Cache-Control: no-cache, no-store",
    });
  }

  if (mobileEmulate) {
    burpRules.push({
      comment: "Emulate iPhone iOS User-Agent",
      enabled: true,
      is_simple_match: false,
      rule_type: "request_header",
      string_match: "^User-Agent:.*",
      string_replace:
        "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    });
  }

  const burpConfigJson = JSON.stringify(
    {
      proxy: {
        match_replace_rules: burpRules,
      },
    },
    null,
    2
  );

  const caidoRulesYaml = `# Caido Match & Replace Tamper Rules
# Target: ${profile?.name || "Security Assessment"}
rules:
  - name: "X-Bug-Bounty Header"
    type: "request_header"
    action: "add"
    header: "X-Bug-Bounty"
    value: "${hackerHandle || "researcher"}"
${
  includeWafBypass
    ? `  - name: "X-Forwarded-For Spoof"
    type: "request_header"
    action: "add"
    header: "X-Forwarded-For"
    value: "127.0.0.1"
`
    : ""
}${
    includeNoCache
      ? `  - name: "Cache-Control Bypass"
    type: "request_header"
    action: "add"
    header: "Cache-Control"
    value: "no-cache, no-store"
`
      : ""
  }`;

  const curlAliasScript = `# Terminal Proxy Environment & cURL Setup
export HTTP_PROXY="http://127.0.0.1:8080"
export HTTPS_PROXY="http://127.0.0.1:8080"

# One-liner cURL through Burp/Caido proxy with Safe Harbor header:
alias bcurl='curl -k -x http://127.0.0.1:8080 -H "X-Bug-Bounty: ${hackerHandle || "researcher"}"'

# Example usage:
# bcurl -i "https://target.com/api/v1/profile"`;

  function handleDownloadBurpJson() {
    const blob = new Blob([burpConfigJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `burp_match_replace_${(profile?.name || "rules").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex h-[88vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Settings className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Burp Suite &amp; Caido Rule Generator
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Ready to Import
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Generate Match &amp; Replace rules to auto-inject Safe Harbor identification and WAF bypass headers.
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

        {/* Modal Body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Options Sidebar */}
          <div className="w-full border-b border-border p-4 md:w-80 md:border-b-0 md:border-r bg-slate-950/40 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bug Hunter Handle / Safe Harbor ID:
              </label>
              <input
                type="text"
                value={hackerHandle}
                onChange={(e) => setHackerHandle(e.target.value)}
                placeholder="e.g. your_hackerone_username"
                className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Injected in <code className="text-emerald-400">X-Bug-Bounty</code> header per rules of engagement.
              </p>
            </div>

            <div className="space-y-2 border-t border-border/80 pt-3">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Rule Toggles:
              </span>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWafBypass}
                  onChange={(e) => setIncludeWafBypass(e.target.checked)}
                  className="rounded border-border accent-emerald-500"
                />
                <span>Add WAF Bypass (`X-Forwarded-For: 127.0.0.1`)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNoCache}
                  onChange={(e) => setIncludeNoCache(e.target.checked)}
                  className="rounded border-border accent-emerald-500"
                />
                <span>Force Fresh Responses (`Cache-Control: no-cache`)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mobileEmulate}
                  onChange={(e) => setMobileEmulate(e.target.checked)}
                  className="rounded border-border accent-emerald-500"
                />
                <span>Emulate Mobile Device (iOS User-Agent)</span>
              </label>
            </div>

            <div className="border-t border-border/80 pt-3">
              <button
                onClick={handleDownloadBurpJson}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
              >
                <Download className="h-3.5 w-3.5" />
                Download Burp JSON Config
              </button>
              <p className="mt-2 text-[10px] text-slate-500 leading-normal">
                How to import in Burp Suite: <br />
                <span className="text-slate-400">Settings &rarr; Project &rarr; HTTP &rarr; Match and Replace &rarr; Cog Icon &rarr; Restore options</span>
              </p>
            </div>
          </div>

          {/* Code Tabs & Output */}
          <div className="flex flex-1 flex-col overflow-hidden p-4">
            <div className="flex border-b border-border pb-2 mb-3">
              {[
                { id: "burp", label: "Burp Suite JSON", icon: FileCode },
                { id: "caido", label: "Caido YAML", icon: Shield },
                { id: "curl", label: "Terminal / cURL Alias", icon: Terminal },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-semibold transition ${
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

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">
                {activeTab === "burp"
                  ? "Burp Suite Project Match and Replace configuration:"
                  : activeTab === "caido"
                  ? "Caido Tamper rule specification:"
                  : "Shell alias to proxy CLI tools through 127.0.0.1:8080:"}
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    activeTab === "burp"
                      ? burpConfigJson
                      : activeTab === "caido"
                      ? caidoRulesYaml
                      : curlAliasScript,
                    activeTab
                  )
                }
                className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                {copiedKey === activeTab ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy
              </button>
            </div>

            <pre className="flex-1 overflow-auto rounded-lg border border-border bg-slate-950 p-3 font-mono text-xs text-emerald-400 selection:bg-emerald-900">
              {activeTab === "burp"
                ? burpConfigJson
                : activeTab === "caido"
                ? caidoRulesYaml
                : curlAliasScript}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
