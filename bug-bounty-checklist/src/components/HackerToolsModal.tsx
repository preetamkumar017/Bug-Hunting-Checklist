import { useState, useMemo, useEffect } from "react";
import {
  X,
  Calculator,
  Binary,
  KeyRound,
  ShieldAlert,
  Copy,
  Check,
  Hash,
  Link,
  Globe,
  Code2,
  Key,
  Sparkles,
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
  identifyHash,
  computeSubtleHash,
  computeMd5,
  parseTargetUrl,
  defangString,
  refangString,
  convertParamsToJson,
  calculateSubnet,
  signJwtHmac,
  type JwtSignResult,
} from "../lib/hackerTools";
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
  if (!open) return null;
  return <HackerToolsModalContent onClose={onClose} />;
}

function HackerToolsModalContent({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<
    "cvss" | "encoder" | "jwt" | "waf" | "hashes" | "url" | "subnet"
  >("cvss");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // CVSS State
  const [cvssVer, setCvssVer] = useState<"4.0" | "3.1">("4.0");
  const [cvss4, setCvss4] = useState<Cvss4Metrics>(DEFAULT_CVSS4);
  const [cvss3, setCvss3] = useState<CvssMetrics>(DEFAULT_CVSS);

  // Encoder State
  const [encodeInput, setEncodeInput] = useState("<script>alert(1)</script>");
  const [encodeMode, setEncodeMode] = useState<"url" | "durl" | "b64" | "hex" | "html">("url");

  // JWT State & Interactive Resigner
  const [jwtInput, setJwtInput] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIFNlY3VyaXR5IiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  );
  const [jwtHeaderEdit, setJwtHeaderEdit] = useState(
    JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)
  );
  const [jwtPayloadEdit, setJwtPayloadEdit] = useState(
    JSON.stringify(
      {
        sub: "1234567890",
        name: "Alice Security",
        iat: 1516239022,
        role: "admin",
      },
      null,
      2
    )
  );
  const [jwtSecret, setJwtSecret] = useState("your-256-bit-secret");
  const [jwtAlg, setJwtAlg] = useState<"HS256" | "HS384" | "HS512" | "none">("HS256");
  const [jwtSignResult, setJwtSignResult] = useState<JwtSignResult>({
    token: "",
    signature: "",
    unsignedToken: "",
  });

  // Re-sign JWT on any change to header, payload, secret, or algorithm
  useEffect(() => {
    let cancelled = false;
    async function resign() {
      const res = await signJwtHmac(jwtHeaderEdit, jwtPayloadEdit, jwtSecret, jwtAlg);
      if (!cancelled) {
        setJwtSignResult(res);
      }
    }
    resign();
    return () => {
      cancelled = true;
    };
  }, [jwtHeaderEdit, jwtPayloadEdit, jwtSecret, jwtAlg]);

  function handleRawJwtChange(raw: string) {
    setJwtInput(raw);
    const parsed = parseJwt(raw);
    if (parsed) {
      if (typeof parsed.header === "object") {
        setJwtHeaderEdit(JSON.stringify(parsed.header, null, 2));
        const detectedAlg = (parsed.header as { alg?: string }).alg;
        if (
          detectedAlg === "HS256" ||
          detectedAlg === "HS384" ||
          detectedAlg === "HS512" ||
          detectedAlg === "none"
        ) {
          setJwtAlg(detectedAlg);
        }
      }
      if (typeof parsed.payload === "object") {
        setJwtPayloadEdit(JSON.stringify(parsed.payload, null, 2));
      }
    }
  }

  function setNoneAlg() {
    setJwtAlg("none");
    try {
      const h = JSON.parse(jwtHeaderEdit);
      h.alg = "none";
      setJwtHeaderEdit(JSON.stringify(h, null, 2));
    } catch {
      setJwtHeaderEdit(JSON.stringify({ alg: "none", typ: "JWT" }, null, 2));
    }
  }

  function addAdminRole() {
    try {
      const p = JSON.parse(jwtPayloadEdit);
      p.role = "admin";
      p.admin = true;
      p.is_admin = true;
      setJwtPayloadEdit(JSON.stringify(p, null, 2));
    } catch {
      // ignore
    }
  }

  function extendOneYear() {
    try {
      const p = JSON.parse(jwtPayloadEdit);
      p.exp = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;
      setJwtPayloadEdit(JSON.stringify(p, null, 2));
    } catch {
      // ignore
    }
  }

  // WAF Mutator State
  const [wafInput, setWafInput] = useState("' UNION SELECT null, username, password FROM users --");

  // Hash Inspector & Hasher State
  const [hashInput, setHashInput] = useState("5f4dcc3b5aa765d61d8327deb882cf99");
  const [hashLiveText, setHashLiveText] = useState("admin");
  const [computedHashes, setComputedHashes] = useState<{
    md5: string;
    sha1: string;
    sha256: string;
    sha512: string;
  }>({ md5: "", sha1: "", sha256: "", sha512: "" });

  // URL Studio State
  const [urlInput, setUrlInput] = useState(
    "https://api.example.com/v2/users?user_id=1337&role=standard&redirect=https%3A%2F%2Ftarget.com%2Fcallback#profile"
  );

  // Subnet State
  const [subnetInput, setSubnetInput] = useState("192.168.1.100/24");

  // Live hash calculator effect
  useEffect(() => {
    let cancelled = false;
    async function updateHashes() {
      const md5 = computeMd5(hashLiveText);
      const sha1 = await computeSubtleHash(hashLiveText, "SHA-1");
      const sha256 = await computeSubtleHash(hashLiveText, "SHA-256");
      const sha512 = await computeSubtleHash(hashLiveText, "SHA-512");
      if (!cancelled) {
        setComputedHashes({ md5, sha1, sha256, sha512 });
      }
    }
    updateHashes();
    return () => {
      cancelled = true;
    };
  }, [hashLiveText]);

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

  const wafMutations: WafMutation[] = generateWafMutations(wafInput);
  const matchedHashes = useMemo(() => identifyHash(hashInput), [hashInput]);
  const parsedUrl = useMemo(() => parseTargetUrl(urlInput), [urlInput]);
  const jsonParams = useMemo(() => convertParamsToJson(parsedUrl.params), [parsedUrl.params]);
  const subnetResult = useMemo(() => calculateSubnet(subnetInput), [subnetInput]);

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
                In-app utilities: CVSS, Encoders, JWT, WAF Mutators, Hashes, URL Studio & Subnets
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

        {/* Tab Bar with Horizontal Scrolling */}
        <div className="flex overflow-x-auto border-b border-border bg-slate-900/40 px-5 scrollbar-thin">
          <button
            onClick={() => setActiveTab("cvss")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "cvss"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" /> CVSS Calc
          </button>
          <button
            onClick={() => setActiveTab("encoder")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "encoder"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Binary className="h-3.5 w-3.5" /> Encoders
          </button>
          <button
            onClick={() => setActiveTab("jwt")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "jwt"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" /> JWT Inspector
          </button>
          <button
            onClick={() => setActiveTab("waf")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "waf"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" /> WAF Mutator
          </button>
          <button
            onClick={() => setActiveTab("hashes")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "hashes"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Hash className="h-3.5 w-3.5" /> Hash Inspector
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "url"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Link className="h-3.5 w-3.5" /> URL Studio
          </button>
          <button
            onClick={() => setActiveTab("subnet")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "subnet"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> CIDR Subnet
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

          {/* TAB 3: JWT INSPECTOR, EDITOR & RESIGNER */}
          {activeTab === "jwt" && (
            <div className="space-y-5">
              {/* Raw Token Input */}
              <div className="rounded-xl border border-border/70 bg-slate-900/40 p-3.5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-200">
                      Encoded JWT Token Input
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Paste any token to decode its header and payload into the interactive editors below
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() =>
                        handleRawJwtChange(
                          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIFNlY3VyaXR5IiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                        )
                      }
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      Sample HS256 Token
                    </button>
                    {jwtSignResult.token && (
                      <button
                        onClick={() => handleRawJwtChange(jwtSignResult.token)}
                        className="rounded border border-emerald-500/30 bg-emerald-950/30 px-2 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-900/40"
                      >
                        Load Resigned Token
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={jwtInput}
                  onChange={(e) => handleRawJwtChange(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-border bg-slate-950 p-2 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500 break-all"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              </div>

              {/* Side-by-Side Editors: Header & Payload */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Header Editor */}
                <div className="flex flex-col rounded-xl border border-rose-500/30 bg-slate-900/40 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      Header (Algorithm & Type)
                    </span>
                    <button
                      onClick={setNoneAlg}
                      className="rounded border border-amber-500/30 bg-amber-950/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 hover:bg-amber-900/40"
                      title="Set algorithm to none (CVE-2015-9235 bypass testing)"
                    >
                      Set &quot;alg&quot;: &quot;none&quot;
                    </button>
                  </div>
                  <textarea
                    value={jwtHeaderEdit}
                    onChange={(e) => setJwtHeaderEdit(e.target.value)}
                    rows={6}
                    className="flex-1 w-full rounded-md border border-border bg-slate-950 p-2.5 font-mono text-xs text-rose-300 outline-none focus:border-rose-500 resize-y"
                    placeholder='{"alg": "HS256", "typ": "JWT"}'
                  />
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    Modifying &quot;alg&quot; updates signature computation in real time.
                  </p>
                </div>

                {/* Payload Claims Editor */}
                <div className="flex flex-col rounded-xl border border-violet-500/30 bg-slate-900/40 p-3.5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-bold text-violet-400">
                      Payload (Claims & Privileges)
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={addAdminRole}
                        className="rounded border border-emerald-500/30 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-900/40"
                        title="Inject role=admin and admin=true"
                      >
                        + Admin Role
                      </button>
                      <button
                        onClick={extendOneYear}
                        className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                        title="Extend expiration timestamp (exp) by 1 year"
                      >
                        + 1 Year Exp
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={jwtPayloadEdit}
                    onChange={(e) => setJwtPayloadEdit(e.target.value)}
                    rows={6}
                    className="flex-1 w-full rounded-md border border-border bg-slate-950 p-2.5 font-mono text-xs text-violet-300 outline-none focus:border-violet-500 resize-y"
                    placeholder='{"sub": "123", "role": "admin"}'
                  />
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    Edit user ID, roles, email, or tenant IDs. New signature hashes automatically.
                  </p>
                </div>
              </div>

              {/* Secret Key & Signature Configuration */}
              <div className="rounded-xl border border-border/80 bg-slate-900/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-200">
                    Secret Key & Signature Re-signing Studio
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Signing Algorithm
                    </label>
                    <select
                      value={jwtAlg}
                      onChange={(e) => {
                        const alg = e.target.value as "HS256" | "HS384" | "HS512" | "none";
                        setJwtAlg(alg);
                        try {
                          const h = JSON.parse(jwtHeaderEdit);
                          h.alg = alg;
                          setJwtHeaderEdit(JSON.stringify(h, null, 2));
                        } catch {
                          // ignore
                        }
                      }}
                      className="w-full rounded-md border border-border bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="HS256">HS256 (HMAC-SHA256)</option>
                      <option value="HS384">HS384 (HMAC-SHA384)</option>
                      <option value="HS512">HS512 (HMAC-SHA512)</option>
                      <option value="none">none (Unsigned Token)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-[11px] font-medium text-slate-400">
                        HMAC Secret Key (Used to Sign Token)
                      </label>
                      <div className="flex gap-1 text-[10px]">
                        {["secret", "secret123", "admin", "password", ""].map((sec, i) => (
                          <button
                            key={i}
                            onClick={() => setJwtSecret(sec)}
                            className="rounded bg-slate-800 px-1.5 py-0.2 text-slate-400 hover:text-slate-200"
                          >
                            {sec === "" ? "(blank)" : sec}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={jwtSecret}
                      disabled={jwtAlg === "none"}
                      onChange={(e) => setJwtSecret(e.target.value)}
                      placeholder={jwtAlg === "none" ? "(No secret key needed for 'none' algorithm)" : "Enter secret key to sign..."}
                      className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Status Bar */}
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs">
                  {jwtSignResult.error ? (
                    <span className="text-rose-400 font-medium">⚠️ {jwtSignResult.error}</span>
                  ) : jwtAlg === "none" ? (
                    <span className="text-amber-400 font-medium flex items-center gap-1.5">
                      ⚠️ None Algorithm Active — Token ends with &quot;.&quot; without signature hash
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Live {jwtAlg} Signature Computed using Web Crypto HMAC
                    </span>
                  )}

                  {jwtSignResult.signature && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">Signature:</span>
                      <code className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300 truncate max-w-[180px]">
                        {jwtSignResult.signature}
                      </code>
                      <button
                        onClick={() => copyText(jwtSignResult.signature, "jwt-sig")}
                        className="rounded border border-border bg-slate-800 p-1 text-slate-400 hover:text-slate-200"
                        title="Copy Signature"
                      >
                        {copiedKey === "jwt-sig" ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Re-signed Output Box */}
              <div className="rounded-xl border border-emerald-500/40 bg-slate-900/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      Newly Re-signed JWT Token Output
                    </span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      Ready to Use
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyText(jwtSignResult.token, "jwt-full-token")}
                      className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50"
                    >
                      {copiedKey === "jwt-full-token" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy Re-signed JWT
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs break-all border border-border/80 select-all">
                  {jwtSignResult.token ? (
                    <>
                      <span className="text-rose-400">
                        {jwtSignResult.token.split(".")[0]}
                      </span>
                      <span className="text-slate-500">.</span>
                      <span className="text-violet-400">
                        {jwtSignResult.token.split(".")[1]}
                      </span>
                      <span className="text-slate-500">.</span>
                      <span className="text-emerald-400">
                        {jwtSignResult.token.split(".")[2] || ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 italic">
                      Fix JSON syntax errors in Header or Payload to generate token.
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-rose-400" /> Header
                    <span className="inline-block h-2 w-2 rounded-full bg-violet-400 ml-2" /> Payload
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 ml-2" /> Signature
                  </span>
                  <span>Total Length: {jwtSignResult.token.length} chars</span>
                </div>
              </div>
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

          {/* TAB 5: HASH INSPECTOR & LIVE HASHER */}
          {activeTab === "hashes" && (
            <div className="space-y-6">
              {/* Section 1: Hash Identifier */}
              <div className="rounded-xl border border-border/70 bg-slate-900/40 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">
                      Hash Identifier & Format Analyzer
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Detect hash algorithm by structure, character set, length and signatures
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setHashInput("5f4dcc3b5aa765d61d8327deb882cf99")}
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      MD5
                    </button>
                    <button
                      onClick={() =>
                        setHashInput("$2b$12$e868N305S8i0vN46261L2.S264024222047k/Jm2")
                      }
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      bcrypt
                    </button>
                    <button
                      onClick={() =>
                        setHashInput(
                          "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
                        )
                      }
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      SHA-256
                    </button>
                    <button
                      onClick={() =>
                        setHashInput(
                          "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgTVqlKIZrpA"
                        )
                      }
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      Argon2
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    placeholder="Paste any hash to identify (e.g. MD5, SHA-256, bcrypt, NTLM)..."
                    className="w-full rounded-lg border border-border bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
                  />

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>
                      Length: <strong className="text-slate-200">{hashInput.trim().length}</strong> chars
                    </span>
                    <span>•</span>
                    <span>
                      Hexadecimal:{" "}
                      <strong className="text-slate-200">
                        {/^[a-fA-F0-9]+$/.test(hashInput.trim()) ? "Yes" : "No"}
                      </strong>
                    </span>
                  </div>

                  {matchedHashes.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 bg-slate-950/40 p-4 text-center text-xs text-slate-500">
                      No standard cryptographic or password hash format identified for this string.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {matchedHashes.map((match, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between rounded-lg border border-border/60 bg-slate-950/70 p-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-400">
                                {match.name}
                              </span>
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                                {match.category}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  match.confidence === "High"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-amber-500/20 text-amber-300"
                                }`}
                              >
                                {match.confidence} Confidence
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {match.description}
                            </p>
                          </div>
                          <button
                            onClick={() => copyText(match.name, `hash-name-${i}`)}
                            className="flex shrink-0 items-center gap-1 rounded border border-border bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
                          >
                            {copiedKey === `hash-name-${i}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            Copy Type
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Live Multi-Hash Generator */}
              <div className="rounded-xl border border-border/70 bg-slate-900/40 p-4">
                <div className="mb-3">
                  <h3 className="text-xs font-bold text-slate-200">
                    Live Client-Side Hasher
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time cryptographic hash generation using native browser Web Crypto API
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Plaintext to Hash
                  </label>
                  <input
                    value={hashLiveText}
                    onChange={(e) => setHashLiveText(e.target.value)}
                    placeholder="Enter string to hash..."
                    className="w-full rounded-lg border border-border bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  {[
                    { label: "MD5 (128-bit)", hash: computedHashes.md5 },
                    { label: "SHA-1 (160-bit)", hash: computedHashes.sha1 },
                    { label: "SHA-256 (256-bit)", hash: computedHashes.sha256 },
                    { label: "SHA-512 (512-bit)", hash: computedHashes.sha512 },
                  ].map((h, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 rounded-lg border border-border/60 bg-slate-950 p-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-emerald-400">
                          {h.label}
                        </span>
                        <code className="mt-0.5 block truncate font-mono text-xs text-amber-300 select-all">
                          {h.hash || "Computing..."}
                        </code>
                      </div>
                      <button
                        onClick={() => copyText(h.hash, `live-hash-${i}`)}
                        className="flex shrink-0 items-center gap-1 self-start rounded border border-border bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 sm:self-center"
                      >
                        {copiedKey === `live-hash-${i}` ? (
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

          {/* TAB 6: URL & PARAMETER STUDIO */}
          {activeTab === "url" && (
            <div className="space-y-5">
              {/* URL Input */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-200">
                    Target URL to Deconstruct & Inspect
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() =>
                        setUrlInput(
                          "https://api.target.com/v1/auth?client_id=sec_109&redirect_uri=https%3A%2F%2Fpartner.com%2Fcallback&scope=read+write&state=xyz987#token"
                        )
                      }
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      OAuth URL
                    </button>
                    <button
                      onClick={() =>
                        setUrlInput(
                          "http://internal.service.corp:8080/admin/data?export=csv&filter=all&debug=1&user_id=1337"
                        )
                      }
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      Internal API
                    </button>
                  </div>
                </div>
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste URL (e.g. https://target.com/api?id=123)..."
                  className="w-full rounded-lg border border-border bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              {!parsedUrl.valid ? (
                <div className="rounded-lg border border-dashed border-rose-500/40 bg-rose-500/5 p-4 text-center text-xs text-rose-300">
                  {parsedUrl.error || "Invalid URL format."}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Components Row */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg border border-border/70 bg-slate-900/60 p-2.5">
                      <p className="text-[10px] font-medium text-slate-500 uppercase">Protocol</p>
                      <p className="mt-0.5 font-mono text-xs font-bold text-emerald-400">
                        {parsedUrl.protocol}://
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-slate-900/60 p-2.5">
                      <p className="text-[10px] font-medium text-slate-500 uppercase">Hostname & Port</p>
                      <p className="mt-0.5 truncate font-mono text-xs font-semibold text-slate-200">
                        {parsedUrl.hostname}:{parsedUrl.port}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-slate-900/60 p-2.5">
                      <p className="text-[10px] font-medium text-slate-500 uppercase">Endpoint Path</p>
                      <p className="mt-0.5 truncate font-mono text-xs font-semibold text-slate-200">
                        {parsedUrl.pathname || "/"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-slate-900/60 p-2.5">
                      <p className="text-[10px] font-medium text-slate-500 uppercase">Fragment / Hash</p>
                      <p className="mt-0.5 truncate font-mono text-xs text-slate-400">
                        {parsedUrl.hash || "(none)"}
                      </p>
                    </div>
                  </div>

                  {/* Defanged Section for Reports */}
                  <div className="rounded-lg border border-border/70 bg-slate-900/40 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Safe Defanged URL for Reports
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => copyText(defangString(urlInput), "defanged-url")}
                          className="flex items-center gap-1 rounded border border-border bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
                        >
                          {copiedKey === "defanged-url" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy Defanged
                        </button>
                        <button
                          onClick={() => copyText(refangString(urlInput), "refanged-url")}
                          className="flex items-center gap-1 rounded border border-border bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
                        >
                          {copiedKey === "refanged-url" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy Refanged
                        </button>
                      </div>
                    </div>
                    <code className="block rounded bg-slate-950 p-2 font-mono text-xs text-emerald-300/90 break-all select-all">
                      {defangString(urlInput)}
                    </code>
                  </div>

                  {/* Query Parameters & JSON Converter */}
                  <div className="rounded-lg border border-border/70 bg-slate-900/40 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">
                          Query Parameters ({parsedUrl.params.length})
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Inspect parameter pairs and convert GET query into POST JSON payload
                        </p>
                      </div>
                      {parsedUrl.params.length > 0 && (
                        <button
                          onClick={() => copyText(jsonParams, "params-json")}
                          className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40"
                        >
                          {copiedKey === "params-json" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Code2 className="h-3 w-3 text-emerald-400" />
                          )}
                          Copy as JSON Body
                        </button>
                      )}
                    </div>

                    {parsedUrl.params.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No query parameters found in this URL.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="max-h-48 overflow-y-auto rounded border border-border/60 bg-slate-950">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-border bg-slate-900/80 text-[10px] font-semibold text-slate-400 uppercase">
                              <tr>
                                <th className="px-3 py-1.5">Parameter Key</th>
                                <th className="px-3 py-1.5">Value</th>
                                <th className="px-3 py-1.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 font-mono">
                              {parsedUrl.params.map((p, idx) => (
                                <tr key={idx} className="hover:bg-white/5">
                                  <td className="px-3 py-1.5 font-bold text-amber-300">{p.key}</td>
                                  <td className="px-3 py-1.5 text-slate-300 break-all">{p.value}</td>
                                  <td className="px-3 py-1.5 text-right">
                                    <button
                                      onClick={() => copyText(p.value, `param-val-${idx}`)}
                                      className="rounded p-1 text-slate-400 hover:text-slate-200"
                                      title="Copy value"
                                    >
                                      {copiedKey === `param-val-${idx}` ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* JSON preview */}
                        <div>
                          <p className="mb-1 text-[11px] font-medium text-slate-400">
                            Converted JSON Request Payload:
                          </p>
                          <pre className="max-h-36 overflow-x-auto rounded bg-slate-950 p-2.5 font-mono text-xs text-slate-300 border border-border/60">
                            {jsonParams}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CIDR & SUBNET CALCULATOR */}
          {activeTab === "subnet" && (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">
                      IPv4 CIDR & Subnet Range Calculator
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Calculate network boundaries, broadcast addresses, and usable host counts for scope planning
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSubnetInput("192.168.1.0/24")}
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      /24 (254 hosts)
                    </button>
                    <button
                      onClick={() => setSubnetInput("10.0.0.0/16")}
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      /16 (65k hosts)
                    </button>
                    <button
                      onClick={() => setSubnetInput("172.16.0.0/20")}
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      /20 (Cloud VPC)
                    </button>
                    <button
                      onClick={() => setSubnetInput("127.0.0.1/8")}
                      className="rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                    >
                      Loopback /8
                    </button>
                  </div>
                </div>

                <input
                  value={subnetInput}
                  onChange={(e) => setSubnetInput(e.target.value)}
                  placeholder="Enter IPv4 CIDR (e.g. 192.168.1.100/24 or 10.0.0.1/16)..."
                  className="w-full rounded-lg border border-border bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              {!subnetResult.valid ? (
                <div className="rounded-lg border border-dashed border-rose-500/40 bg-rose-500/5 p-4 text-center text-xs text-rose-300">
                  {subnetResult.error || "Invalid CIDR input."}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border/70 bg-slate-900/60 p-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">
                        Usable Hosts
                      </p>
                      <p className="mt-1 text-lg font-bold text-emerald-400">
                        {subnetResult.usableHosts.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Total: {subnetResult.totalHosts.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-slate-900/60 p-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">
                        Subnet Mask
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-200">
                        {subnetResult.subnetMask}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Prefix: /{subnetResult.prefix}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-slate-900/60 p-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">
                        Network ID
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-amber-300 truncate">
                        {subnetResult.networkAddress}
                      </p>
                      <p className="text-[10px] text-slate-500">Routing Base</p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-slate-900/60 p-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">
                        Broadcast IP
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-200 truncate">
                        {subnetResult.broadcastAddress}
                      </p>
                      <p className="text-[10px] text-slate-500">Broadcast Target</p>
                    </div>
                  </div>

                  {/* Range and Scope details */}
                  <div className="rounded-xl border border-border/70 bg-slate-900/40 p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-200">Subnet Specification</h4>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                      <div className="flex items-center justify-between rounded bg-slate-950 p-2">
                        <span className="text-slate-400">First Usable Host:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {subnetResult.firstUsableIp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded bg-slate-950 p-2">
                        <span className="text-slate-400">Last Usable Host:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {subnetResult.lastUsableIp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded bg-slate-950 p-2">
                        <span className="text-slate-400">Wildcard Mask:</span>
                        <span className="font-mono text-slate-200">
                          {subnetResult.wildcardMask}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded bg-slate-950 p-2">
                        <span className="text-slate-400">Network Scope:</span>
                        <span
                          className={`font-semibold ${
                            subnetResult.isPrivate ? "text-emerald-400" : "text-blue-400"
                          }`}
                        >
                          {subnetResult.isPrivate ? "RFC 1918 Private / Loopback" : "Public Internet"} (Class {subnetResult.ipClass})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Security Testing & Recon Formats */}
                  <div className="rounded-xl border border-border/70 bg-slate-900/40 p-4">
                    <h4 className="text-xs font-bold text-slate-200 mb-2">
                      Target Formats & Obfuscation
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded bg-slate-950 px-3 py-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-slate-400">Nmap Scope String:</span>
                          <code className="ml-2 font-mono font-bold text-amber-300">
                            {subnetResult.networkAddress}/{subnetResult.prefix}
                          </code>
                        </div>
                        <button
                          onClick={() =>
                            copyText(`${subnetResult.networkAddress}/${subnetResult.prefix}`, "nmap-cidr")
                          }
                          className="flex items-center gap-1 rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                        >
                          {copiedKey === "nmap-cidr" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded bg-slate-950 px-3 py-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-slate-400">Dword Decimal Notation:</span>
                          <code className="ml-2 font-mono text-slate-200">
                            {subnetResult.dwordIp}
                          </code>
                        </div>
                        <button
                          onClick={() => copyText(subnetResult.dwordIp, "dword-ip")}
                          className="flex items-center gap-1 rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                        >
                          {copiedKey === "dword-ip" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded bg-slate-950 px-3 py-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-slate-400">Hexadecimal Notation:</span>
                          <code className="ml-2 font-mono text-slate-200">
                            {subnetResult.hexIp}
                          </code>
                        </div>
                        <button
                          onClick={() => copyText(subnetResult.hexIp, "hex-ip")}
                          className="flex items-center gap-1 rounded border border-border bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                        >
                          {copiedKey === "hex-ip" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
