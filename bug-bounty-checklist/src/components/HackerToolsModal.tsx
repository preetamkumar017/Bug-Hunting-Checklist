import { useState } from "react";
import {
  X,
  Calculator,
  Binary,
  KeyRound,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";
import {
  urlEncode,
  urlDecode,
  doubleUrlEncode,
  base64Encode,
  base64Decode,
  hexEncode,
  hexDecode,
  htmlEncode,
  htmlDecode,
  parseJwt,
  generateWafMutations,
  type WafMutation,
} from "../lib/encoder";
import {
  calcCvss4,
  cvss4SeverityLabel,
  DEFAULT_CVSS4,
  type Cvss4Metrics,
} from "../lib/cvss4";
import {
  calcCvss,
  cvssSeverityLabel,
  DEFAULT_CVSS,
  type CvssMetrics,
} from "../lib/cvss";

const CVSS4_OPTIONS = [
  {
    key: "av" as const,
    label: "Attack Vector (AV)",
    choices: [
      ["N", "Network"],
      ["A", "Adjacent"],
      ["L", "Local"],
      ["P", "Physical"],
    ] as [string, string][],
  },
  {
    key: "ac" as const,
    label: "Attack Complexity (AC)",
    choices: [
      ["L", "Low"],
      ["H", "High"],
    ] as [string, string][],
  },
  {
    key: "at" as const,
    label: "Attack Requirements (AT)",
    choices: [
      ["N", "None"],
      ["P", "Present"],
    ] as [string, string][],
  },
  {
    key: "pr" as const,
    label: "Privileges Required (PR)",
    choices: [
      ["N", "None"],
      ["L", "Low"],
      ["H", "High"],
    ] as [string, string][],
  },
  {
    key: "ui" as const,
    label: "User Interaction (UI)",
    choices: [
      ["N", "None"],
      ["P", "Passive"],
      ["A", "Active"],
    ] as [string, string][],
  },
  {
    key: "vc" as const,
    label: "Vuln Sys Conf. (VC)",
    choices: [
      ["H", "High"],
      ["L", "Low"],
      ["N", "None"],
    ] as [string, string][],
  },
  {
    key: "vi" as const,
    label: "Vuln Sys Integ. (VI)",
    choices: [
      ["H", "High"],
      ["L", "Low"],
      ["N", "None"],
    ] as [string, string][],
  },
  {
    key: "va" as const,
    label: "Vuln Sys Avail. (VA)",
    choices: [
      ["H", "High"],
      ["L", "Low"],
      ["N", "None"],
    ] as [string, string][],
  },
  {
    key: "sc" as const,
    label: "Subseq Sys Conf. (SC)",
    choices: [
      ["H", "High"],
      ["L", "Low"],
      ["N", "None"],
    ] as [string, string][],
  },
  {
    key: "si" as const,
    label: "Subseq Sys Integ. (SI)",
    choices: [
      ["H", "High"],
      ["L", "Low"],
      ["N", "None"],
    ] as [string, string][],
  },
  {
    key: "sa" as const,
    label: "Subseq Sys Avail. (SA)",
    choices: [
      ["H", "High"],
      ["L", "Low"],
      ["N", "None"],
    ] as [string, string][],
  },
];

export function HackerToolsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"cvss" | "encoder" | "jwt" | "waf">("cvss");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // CVSS State
  const [cvssVer, setCvssVer] = useState<"4.0" | "3.1">("4.0");
  const [cvss4, setCvss4] = useState<Cvss4Metrics>(DEFAULT_CVSS4);
  const [cvss3, setCvss3] = useState<CvssMetrics>(DEFAULT_CVSS);

  // Encoder State
  const [encodeInput, setEncodeInput] = useState("<script>alert(1)</script>");
  const [encodeMode, setEncodeMode] = useState<"url" | "durl" | "b64" | "hex" | "html">("url");

  // JWT State
  const [jwtInput, setJwtInput] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIFNlY3VyaXR5IiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  );

  // WAF Mutator State
  const [wafInput, setWafInput] = useState("' UNION SELECT null, username, password FROM users --");

  if (!open) return null;

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  // Calculate CVSS outputs
  const cvss4Res = calcCvss4(cvss4);
  const cvss3Res = calcCvss(cvss3);

  // Compute encoder outputs
  let encodedOutput = "";
  let decodedOutput = "";
  if (encodeMode === "url") {
    encodedOutput = urlEncode(encodeInput);
    decodedOutput = urlDecode(encodeInput);
  } else if (encodeMode === "durl") {
    encodedOutput = doubleUrlEncode(encodeInput);
    decodedOutput = urlDecode(urlDecode(encodeInput));
  } else if (encodeMode === "b64") {
    encodedOutput = base64Encode(encodeInput);
    decodedOutput = base64Decode(encodeInput);
  } else if (encodeMode === "hex") {
    encodedOutput = hexEncode(encodeInput);
    decodedOutput = hexDecode(encodeInput);
  } else if (encodeMode === "html") {
    encodedOutput = htmlEncode(encodeInput);
    decodedOutput = htmlDecode(encodeInput);
  }

  const parsedJwt = parseJwt(jwtInput);
  const wafMutations: WafMutation[] = generateWafMutations(wafInput);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              🛠️
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Hacker Swiss Army Knife</h2>
              <p className="text-[11px] text-slate-400">
                In-app utilities: CVSS v4.0/3.1, Encoders, JWT Parser & WAF Mutators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-border bg-slate-900/40 px-5">
          <button
            onClick={() => setActiveTab("cvss")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "cvss"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" /> CVSS Calculator
          </button>
          <button
            onClick={() => setActiveTab("encoder")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "encoder"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Binary className="h-3.5 w-3.5" /> Encoders / Decoders
          </button>
          <button
            onClick={() => setActiveTab("jwt")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "jwt"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" /> JWT Inspector
          </button>
          <button
            onClick={() => setActiveTab("waf")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "waf"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" /> WAF Mutator
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: CVSS CALCULATOR */}
          {activeTab === "cvss" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-slate-900/60 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-300">CVSS Standard:</span>
                  <div className="inline-flex rounded-md border border-border p-0.5">
                    <button
                      onClick={() => setCvssVer("4.0")}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                        cvssVer === "4.0"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      v4.0 (Latest)
                    </button>
                    <button
                      onClick={() => setCvssVer("3.1")}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                        cvssVer === "3.1"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      v3.1 (Legacy)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Base Score</p>
                    <p className="text-xl font-black text-amber-400 font-mono">
                      {cvssVer === "4.0" ? cvss4Res.score.toFixed(1) : cvss3Res.score.toFixed(1)}{" "}
                      <span className="text-xs font-semibold text-slate-400">
                        (
                        {cvssVer === "4.0"
                          ? cvss4SeverityLabel(cvss4Res.score)
                          : cvssSeverityLabel(cvss3Res.score)}
                        )
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      copyText(
                        cvssVer === "4.0" ? cvss4Res.vector : cvss3Res.vector,
                        "cvss-vector"
                      )
                    }
                    className="flex items-center gap-1 rounded border border-border bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    {copiedKey === "cvss-vector" ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Copy Vector
                  </button>
                </div>
              </div>

              {/* Vector Bar */}
              <div className="rounded border border-border/50 bg-slate-950 p-2 font-mono text-xs text-slate-400 select-all">
                {cvssVer === "4.0" ? cvss4Res.vector : cvss3Res.vector}
              </div>

              {/* Matrix Form */}
              {cvssVer === "4.0" ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                  {CVSS4_OPTIONS.map((opt) => (
                    <div
                      key={opt.key}
                      className="rounded-lg border border-border/60 bg-slate-900/40 p-2"
                    >
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        {opt.label}
                      </label>
                      <select
                        value={cvss4[opt.key]}
                        onChange={(e) =>
                          setCvss4({ ...cvss4, [opt.key]: e.target.value as never })
                        }
                        className="w-full rounded border border-border/70 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
                      >
                        {opt.choices.map(([val, desc]) => (
                          <option key={val} value={val} className="bg-slate-900">
                            {val} — {desc}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    {
                      key: "av" as const,
                      label: "Attack Vector",
                      choices: [
                        ["N", "Network"],
                        ["A", "Adjacent"],
                        ["L", "Local"],
                        ["P", "Physical"],
                      ],
                    },
                    {
                      key: "ac" as const,
                      label: "Attack Complexity",
                      choices: [
                        ["L", "Low"],
                        ["H", "High"],
                      ],
                    },
                    {
                      key: "pr" as const,
                      label: "Privileges Req.",
                      choices: [
                        ["N", "None"],
                        ["L", "Low"],
                        ["H", "High"],
                      ],
                    },
                    {
                      key: "ui" as const,
                      label: "User Interaction",
                      choices: [
                        ["N", "None"],
                        ["R", "Required"],
                      ],
                    },
                    {
                      key: "s" as const,
                      label: "Scope",
                      choices: [
                        ["U", "Unchanged"],
                        ["C", "Changed"],
                      ],
                    },
                    {
                      key: "c" as const,
                      label: "Confidentiality",
                      choices: [
                        ["N", "None"],
                        ["L", "Low"],
                        ["H", "High"],
                      ],
                    },
                    {
                      key: "i" as const,
                      label: "Integrity",
                      choices: [
                        ["N", "None"],
                        ["L", "Low"],
                        ["H", "High"],
                      ],
                    },
                    {
                      key: "a" as const,
                      label: "Availability",
                      choices: [
                        ["N", "None"],
                        ["L", "Low"],
                        ["H", "High"],
                      ],
                    },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      className="rounded-lg border border-border/60 bg-slate-900/40 p-2"
                    >
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        {opt.label}
                      </label>
                      <select
                        value={cvss3[opt.key]}
                        onChange={(e) =>
                          setCvss3({ ...cvss3, [opt.key]: e.target.value as never })
                        }
                        className="w-full rounded border border-border/70 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
                      >
                        {opt.choices.map(([val, desc]) => (
                          <option key={val} value={val} className="bg-slate-900">
                            {val} — {desc}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENCODER / DECODER */}
          {activeTab === "encoder" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Scheme:</span>
                {[
                  { id: "url", label: "URL" },
                  { id: "durl", label: "Double URL" },
                  { id: "b64", label: "Base64" },
                  { id: "hex", label: "Hex" },
                  { id: "html", label: "HTML Entities" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setEncodeMode(mode.id as never)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                      encodeMode === mode.id
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "border border-border text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Input Text</label>
                <textarea
                  value={encodeInput}
                  onChange={(e) => setEncodeInput(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-slate-950 p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
                  placeholder="Paste or type text to encode/decode..."
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-slate-900/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">Encoded Output</span>
                    <button
                      onClick={() => copyText(encodedOutput, "enc-out")}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      {copiedKey === "enc-out" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </button>
                  </div>
                  <pre className="max-h-36 overflow-auto rounded bg-slate-950 p-2 font-mono text-xs text-slate-300 select-all whitespace-pre-wrap break-all">
                    {encodedOutput || "(empty)"}
                  </pre>
                </div>

                <div className="rounded-lg border border-border/70 bg-slate-900/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-400">Decoded Output</span>
                    <button
                      onClick={() => copyText(decodedOutput, "dec-out")}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      {copiedKey === "dec-out" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </button>
                  </div>
                  <pre className="max-h-36 overflow-auto rounded bg-slate-950 p-2 font-mono text-xs text-slate-300 select-all whitespace-pre-wrap break-all">
                    {decodedOutput || "(empty)"}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JWT INSPECTOR */}
          {activeTab === "jwt" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Encoded JWT Token (Header.Payload.Signature)
                </label>
                <textarea
                  value={jwtInput}
                  onChange={(e) => setJwtInput(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-slate-950 p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500 break-all"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              </div>

              {parsedJwt ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 bg-slate-900/60 p-3">
                    <span className="mb-2 block text-xs font-semibold text-rose-400">
                      Header (Algorithm & Token Type)
                    </span>
                    <pre className="rounded bg-slate-950 p-2.5 font-mono text-xs text-slate-300 overflow-x-auto">
                      {JSON.stringify(parsedJwt.header, null, 2)}
                    </pre>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-slate-900/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-violet-400">Payload (Claims)</span>
                      {parsedJwt.isExpired !== undefined && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            parsedJwt.isExpired
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {parsedJwt.isExpired ? "EXPIRED" : "ACTIVE"}
                        </span>
                      )}
                    </div>
                    <pre className="rounded bg-slate-950 p-2.5 font-mono text-xs text-slate-300 overflow-x-auto">
                      {JSON.stringify(parsedJwt.payload, null, 2)}
                    </pre>
                    {parsedJwt.expiresAt && (
                      <p className="mt-2 text-[11px] text-slate-400">
                        Expires at: <span className="text-slate-200">{parsedJwt.expiresAt}</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-rose-500/40 bg-rose-500/5 p-4 text-center text-xs text-rose-300">
                  Invalid JWT format. Provide a valid 3-part base64url encoded token.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WAF PAYLOAD MUTATOR */}
          {activeTab === "waf" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Base Payload to Mutate
                </label>
                <div className="flex gap-2">
                  <input
                    value={wafInput}
                    onChange={(e) => setWafInput(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
                    placeholder="Enter payload..."
                  />
                  <button
                    onClick={() => setWafInput("<script>alert(1)</script>")}
                    className="rounded border border-border px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    XSS Example
                  </button>
                  <button
                    onClick={() =>
                      setWafInput("' UNION SELECT 1, user(), database() --")
                    }
                    className="rounded border border-border px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    SQLi Example
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">
                  Generated Mutations ({wafMutations.length})
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {wafMutations.map((mut, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-slate-900/60 p-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-400">
                            {mut.technique}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">{mut.note}</p>
                        <code className="mt-1 block max-h-16 overflow-x-auto rounded bg-slate-950 px-2 py-1 font-mono text-xs text-amber-300 select-all">
                          {mut.payload}
                        </code>
                      </div>
                      <button
                        onClick={() => copyText(mut.payload, `waf-${idx}`)}
                        className="flex shrink-0 items-center gap-1 self-start rounded border border-border bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 sm:self-center"
                      >
                        {copiedKey === `waf-${idx}` ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
