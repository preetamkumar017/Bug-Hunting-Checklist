import { useState, useRef, useMemo, useEffect } from "react";
import { Modal } from "@/shared/components/Modal";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Upload,
  Binary,
  BookOpen,
  Sparkles,
  AlertCircle,
  Terminal,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  analyzeFaviconBytes,
  fetchFaviconBytesFromUrl,
  murmur3_32_signed,
  murmur3_32_unsigned,
  computeBinaryMd5,
  computeBinarySha256,
  PRESET_FAVICONS,
  type FaviconAnalysisResult,
  type PresetFavicon,
} from "@/tools/lib/faviconHash";

interface FaviconHashModalProps {
  open: boolean;
  onClose: () => void;
  defaultUrl?: string;
}

type TabMode = "url" | "upload" | "text" | "presets";

export function FaviconHashModal({ open, onClose, defaultUrl }: FaviconHashModalProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("url");
  const [urlInput, setUrlInput] = useState(defaultUrl || "");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // File upload state
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw text state
  const [textInput, setTextInput] = useState("admin");
  const [seedInput, setSeedInput] = useState(0);

  // Presets search
  const [presetSearch, setPresetSearch] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<PresetFavicon | null>(null);

  // Active analysis result
  const [result, setResult] = useState<FaviconAnalysisResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync default URL if opened with one
  const [prevDefaultUrl, setPrevDefaultUrl] = useState(defaultUrl);
  if (defaultUrl !== prevDefaultUrl) {
    setPrevDefaultUrl(defaultUrl);
    if (defaultUrl) {
      setUrlInput(defaultUrl);
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // ─── 1. FETCH VIA URL ────────────────────────────────────────────────────────
  const handleFetchUrl = async (target?: string) => {
    const toFetch = (target || urlInput).trim();
    if (!toFetch) return;

    setLoading(true);
    setFetchError(null);

    try {
      const { bytes, mimeType, resolvedUrl } = await fetchFaviconBytesFromUrl(toFetch);
      const res = await analyzeFaviconBytes(bytes, resolvedUrl, "url", mimeType);
      setResult(res);
      setSelectedPreset(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch favicon.";
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── 2. HANDLE FILE UPLOAD ───────────────────────────────────────────────────
  const processUploadedFile = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setFetchError(null);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const mime = file.type || "image/x-icon";
      const res = await analyzeFaviconBytes(bytes, file.name, "file", mime);
      setResult(res);
      setSelectedPreset(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error reading uploaded file.";
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // ─── 3. RAW TEXT MURMURHASH CALCULATION ──────────────────────────────────────
  const rawTextHashes = useMemo(() => {
    if (activeTab !== "text") return null;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(textInput);
    const signed = murmur3_32_signed(textInput, seedInput);
    const unsigned = murmur3_32_unsigned(textInput, seedInput);
    const md5 = computeBinaryMd5(bytes);
    return { signed, unsigned, md5, bytesLength: bytes.length };
  }, [textInput, seedInput, activeTab]);

  // Async SHA-256 for text
  const [textSha256, setTextSha256] = useState("");
  useEffect(() => {
    if (activeTab === "text") {
      const bytes = new TextEncoder().encode(textInput);
      computeBinarySha256(bytes).then(setTextSha256);
    }
  }, [textInput, activeTab]);

  // ─── 4. FILTER PRESETS ───────────────────────────────────────────────────────
  const filteredPresets = useMemo(() => {
    const q = presetSearch.toLowerCase().trim();
    if (!q) return PRESET_FAVICONS;
    return PRESET_FAVICONS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.shodanHash).includes(q) ||
        p.attackVectors.some((v) => v.toLowerCase().includes(q))
    );
  }, [presetSearch]);

  const handleSelectPreset = (preset: PresetFavicon) => {
    setSelectedPreset(preset);
    // Build a mock analysis result for the preset
    const dorks = {
      shodan: `http.favicon.hash:${preset.shodanHash}`,
      fofaMmh3: `icon_hash="${preset.shodanHash}"`,
      fofaMd5: preset.md5 ? `icon_hash="${preset.md5}"` : `icon_hash="${preset.shodanHash}"`,
      censysMd5: preset.md5 ? `services.http.response.favicons.md5_hash:"${preset.md5}"` : "",
      censysSha256: "",
      zoomeye: `iconhash:"${preset.shodanHash}"`,
      hunter: preset.md5 ? `web.icon=="${preset.md5}"` : "",
    };

    const searchUrls = {
      shodan: `https://www.shodan.io/search?query=${encodeURIComponent(dorks.shodan)}`,
      fofa: `https://fofa.info/result?qbase64=${encodeURIComponent(btoa(dorks.fofaMmh3))}`,
      censys: dorks.censysMd5
        ? `https://search.censys.io/search?resource=hosts&q=${encodeURIComponent(dorks.censysMd5)}`
        : "",
      zoomeye: `https://www.zoomeye.org/searchResult?q=${encodeURIComponent(dorks.zoomeye)}`,
    };

    setResult({
      sourceType: "preset",
      sourceName: preset.name,
      fileSizeBytes: 0,
      mimeType: "image/x-icon",
      previewDataUri: "",
      shodanHash: preset.shodanHash,
      rawMurmur3Signed: preset.shodanHash,
      rawMurmur3Unsigned: preset.shodanHash >>> 0,
      md5: preset.md5 || "N/A",
      sha256: "Preset Signature",
      base64: "",
      shodanBase64: "",
      dorks,
      searchUrls,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Favicon & MurmurHash3 Generator"
      className="w-full max-w-4xl"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              🎯
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">
                  Favicon & MurmurHash3 Generator
                </h2>
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                  Shodan & FOFA Recon
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Generate Shodan <code className="text-cyan-300">http.favicon.hash</code>, FOFA{" "}
                <code className="text-amber-300">icon_hash</code>, and Censys digests from URL or file upload.
              </p>
            </div>
          </div>
          <button
            aria-label="Close favicon generator"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex overflow-x-auto border-b border-border bg-slate-900/40 px-5 scrollbar-thin">
          <button
            onClick={() => setActiveTab("url")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "url"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> Fetch via URL
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "upload"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="h-3.5 w-3.5" /> Direct File Upload
          </button>

          <button
            onClick={() => setActiveTab("text")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "text"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Binary className="h-3.5 w-3.5" /> Raw String Murmur3
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "presets"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Famous Frameworks Cheat Sheet ({PRESET_FAVICONS.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ─── TAB 1: FETCH VIA URL ─── */}
          {activeTab === "url" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Website or Direct Favicon URL:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                      placeholder="e.g. https://tesla.com or gitlab.com/favicon.ico"
                      className="w-full rounded-lg border border-border bg-slate-900/60 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleFetchUrl()}
                    disabled={loading || !urlInput.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" /> Fetch & Hash
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick try buttons */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Quick demo targets:</span>
                <button
                  onClick={() => {
                    setUrlInput("https://google.com/favicon.ico");
                    handleFetchUrl("https://google.com/favicon.ico");
                  }}
                  className="rounded border border-border/60 bg-slate-800/60 px-2 py-0.5 hover:bg-slate-700 hover:text-slate-200"
                >
                  Google
                </button>
                <button
                  onClick={() => {
                    setUrlInput("https://github.com/favicon.ico");
                    handleFetchUrl("https://github.com/favicon.ico");
                  }}
                  className="rounded border border-border/60 bg-slate-800/60 px-2 py-0.5 hover:bg-slate-700 hover:text-slate-200"
                >
                  GitHub
                </button>
                <button
                  onClick={() => {
                    setUrlInput("https://gitlab.com/favicon.ico");
                    handleFetchUrl("https://gitlab.com/favicon.ico");
                  }}
                  className="rounded border border-border/60 bg-slate-800/60 px-2 py-0.5 hover:bg-slate-700 hover:text-slate-200"
                >
                  GitLab
                </button>
              </div>

              {/* Error Notice with Fallback instructions */}
              {fetchError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">{fetchError}</p>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Web browsers block cross-origin image requests when servers lack CORS headers.
                      </p>
                    </div>
                  </div>

                  <div className="rounded bg-black/40 p-2.5 font-mono text-[11px] text-slate-300 space-y-1">
                    <p className="text-slate-400"># Solution A: Download via cURL and switch to File Upload tab:</p>
                    <div className="flex items-center justify-between text-cyan-300">
                      <code>curl -sL &quot;{urlInput || "https://target.com/favicon.ico"}&quot; -o favicon.ico</code>
                      <button
                        onClick={() =>
                          handleCopy(
                            `curl -sL "${urlInput || "https://target.com/favicon.ico"}" -o favicon.ico`,
                            "curl-cmd"
                          )
                        }
                        className="rounded p-1 text-slate-400 hover:text-slate-200"
                        title="Copy cURL command"
                      >
                        {copiedKey === "curl-cmd" ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    <p className="text-slate-400 pt-1"># Solution B: Compute directly via Python one-liner:</p>
                    <div className="flex items-center justify-between text-cyan-300">
                      <code className="break-all">
                        python3 -c &quot;import mmh3,requests,codecs;print(mmh3.hash(codecs.encode(requests.get(&apos;{urlInput || "https://target.com/favicon.ico"}&apos;).content,&apos;base64&apos;)))&quot;
                      </code>
                      <button
                        onClick={() =>
                          handleCopy(
                            `python3 -c "import mmh3,requests,codecs;print(mmh3.hash(codecs.encode(requests.get('${urlInput || "https://target.com/favicon.ico"}').content,'base64')))"`,
                            "py-cmd"
                          )
                        }
                        className="rounded p-1 text-slate-400 hover:text-slate-200 shrink-0 ml-1"
                        title="Copy Python one-liner"
                      >
                        {copiedKey === "py-cmd" ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 2: DIRECT FILE UPLOAD ─── */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".ico,.png,.svg,.webp,.jpg,.jpeg,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processUploadedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                    : "border-border/80 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/70"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Drop favicon file here or click to browse
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports <code className="text-cyan-300">.ico</code>, <code className="text-cyan-300">.png</code>, <code className="text-cyan-300">.svg</code>, <code className="text-cyan-300">.webp</code> (100% Client-Side Processing, No CORS Issues)
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-border">
                    Select Icon File
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: RAW STRING MURMURHASH3 ─── */}
          {activeTab === "text" && rawTextHashes && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Input String / Text / Parameter:
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={3}
                    placeholder="Enter raw text to compute MurmurHash3..."
                    className="w-full rounded-lg border border-border bg-slate-900/60 p-2.5 font-mono text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Seed Value:
                  </label>
                  <input
                    type="number"
                    value={seedInput}
                    onChange={(e) => setSeedInput(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-border bg-slate-900/60 p-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default: 0</p>
                </div>
              </div>

              {/* Text Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Signed 32-bit (Default / mmh3) */}
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
                  <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold mb-1">
                    <span>MurmurHash3 (Signed 32-bit)</span>
                    <button
                      onClick={() => handleCopy(String(rawTextHashes.signed), "txt-signed")}
                      className="rounded p-1 text-slate-400 hover:text-slate-200"
                    >
                      {copiedKey === "txt-signed" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-base font-bold text-slate-100">
                    {rawTextHashes.signed}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Matches Python <code className="text-cyan-300">mmh3.hash(&apos;...&apos;)</code>
                  </p>
                </div>

                {/* Unsigned 32-bit */}
                <div className="rounded-lg border border-border bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>MurmurHash3 (Unsigned 32-bit)</span>
                    <button
                      onClick={() => handleCopy(String(rawTextHashes.unsigned), "txt-unsigned")}
                      className="rounded p-1 text-slate-400 hover:text-slate-200"
                    >
                      {copiedKey === "txt-unsigned" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-base font-bold text-slate-100">
                    {rawTextHashes.unsigned}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hex: <code className="text-slate-300">0x{rawTextHashes.unsigned.toString(16)}</code>
                  </p>
                </div>

                {/* MD5 */}
                <div className="rounded-lg border border-border bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>MD5 Digest</span>
                    <button
                      onClick={() => handleCopy(rawTextHashes.md5, "txt-md5")}
                      className="rounded p-1 text-slate-400 hover:text-slate-200"
                    >
                      {copiedKey === "txt-md5" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-100 break-all">
                    {rawTextHashes.md5}
                  </div>
                </div>

                {/* SHA-256 */}
                <div className="rounded-lg border border-border bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>SHA-256 Digest</span>
                    <button
                      onClick={() => handleCopy(textSha256, "txt-sha256")}
                      className="rounded p-1 text-slate-400 hover:text-slate-200"
                    >
                      {copiedKey === "txt-sha256" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-100 break-all">
                    {textSha256 || "Computing..."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 4: PRESETS CHEAT SHEET ─── */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search preset by name, category, or hash..."
                  className="w-full rounded-lg border border-border bg-slate-900/60 pl-8 pr-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`cursor-pointer rounded-lg border p-3 transition-all ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-500/10 shadow-md shadow-cyan-500/10"
                          : "border-border/70 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-900/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{preset.name}</h4>
                          <span className="inline-block mt-0.5 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-cyan-300">
                            {preset.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-amber-300">
                            {preset.shodanHash}
                          </span>
                          <span className="block text-[9px] text-slate-500">Shodan MMH3</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                        {preset.notes.en}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                        <span className="text-cyan-400 font-medium">Click to load dorks →</span>
                        <a
                          href={`https://www.shodan.io/search?query=http.favicon.hash%3A${preset.shodanHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-slate-400 hover:text-cyan-300"
                        >
                          Shodan <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── LIVE RESULTS CARD (For URL, Upload & Selected Preset) ─── */}
          {result && (
            <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 space-y-4">
              {/* Header preview & details */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div className="flex items-center gap-3">
                  {/* Favicon Visual Thumbnail */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] bg-[length:12px_12px] p-1.5 shadow-inner"
                    title="Favicon Visual Preview"
                  >
                    {result.previewDataUri ? (
                      <img
                        src={result.previewDataUri}
                        alt="Favicon preview"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Sparkles className="h-6 w-6 text-cyan-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100 max-w-[320px] truncate">
                        {result.sourceName}
                      </h4>
                      <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300 uppercase">
                        {result.sourceType}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {result.fileSizeBytes > 0 && (
                        <span>{(result.fileSizeBytes / 1024).toFixed(2)} KB • </span>
                      )}
                      <span>{result.mimeType}</span>
                    </p>
                  </div>
                </div>

                {/* Primary Shodan Big Badge */}
                <div className="flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2">
                  <div>
                    <span className="block text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                      Shodan MMH3 Hash
                    </span>
                    <span className="font-mono text-base font-extrabold text-white">
                      {result.shodanHash}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(String(result.shodanHash), "main-shodan-hash")}
                    className="rounded p-1.5 text-cyan-300 hover:bg-cyan-500/20"
                    title="Copy Shodan hash"
                  >
                    {copiedKey === "main-shodan-hash" ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Ready-to-Execute Search Dorks */}
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
                  One-Click Recon Queries (Shodan, FOFA & Censys)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* Shodan Query */}
                  <div className="rounded-lg border border-border bg-slate-950/60 p-2.5">
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span className="font-semibold text-red-400">Shodan Dork</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(result.dorks.shodan, "dork-shodan")}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
                        >
                          {copiedKey === "dork-shodan" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                        <a
                          href={result.searchUrls.shodan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-[10px] text-red-400 hover:underline ml-1"
                        >
                          Open <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                    <code className="block rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-slate-200 select-all">
                      {result.dorks.shodan}
                    </code>
                  </div>

                  {/* FOFA Query */}
                  <div className="rounded-lg border border-border bg-slate-950/60 p-2.5">
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span className="font-semibold text-amber-400">FOFA Dork</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(result.dorks.fofaMmh3, "dork-fofa")}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
                        >
                          {copiedKey === "dork-fofa" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                        <a
                          href={result.searchUrls.fofa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-[10px] text-amber-400 hover:underline ml-1"
                        >
                          Open <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                    <code className="block rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-slate-200 select-all">
                      {result.dorks.fofaMmh3}
                    </code>
                  </div>

                  {/* Censys MD5 Query */}
                  <div className="rounded-lg border border-border bg-slate-950/60 p-2.5">
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span className="font-semibold text-sky-400">Censys MD5</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(result.dorks.censysMd5, "dork-censys")}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
                        >
                          {copiedKey === "dork-censys" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                        {result.searchUrls.censys && (
                          <a
                            href={result.searchUrls.censys}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[10px] text-sky-400 hover:underline ml-1"
                          >
                            Open <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <code className="block rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-slate-200 select-all">
                      {result.dorks.censysMd5}
                    </code>
                  </div>

                  {/* ZoomEye Query */}
                  <div className="rounded-lg border border-border bg-slate-950/60 p-2.5">
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span className="font-semibold text-emerald-400">ZoomEye Dork</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(result.dorks.zoomeye, "dork-zoomeye")}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200"
                        >
                          {copiedKey === "dork-zoomeye" ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                        <a
                          href={result.searchUrls.zoomeye}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-[10px] text-emerald-400 hover:underline ml-1"
                        >
                          Open <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                    <code className="block rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-slate-200 select-all">
                      {result.dorks.zoomeye}
                    </code>
                  </div>
                </div>
              </div>

              {/* Complete Hashes Inspection Table */}
              <div className="rounded-lg border border-border bg-slate-950/40 p-3 text-xs space-y-2">
                <span className="block font-bold text-[11px] uppercase tracking-wider text-slate-400">
                  Cryptographic & Murmur Hash Fingerprints
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="flex items-center justify-between rounded bg-slate-900/60 px-2.5 py-1.5">
                    <span className="text-slate-400">Raw Murmur3 (Signed):</span>
                    <span className="text-cyan-300 font-bold">{result.rawMurmur3Signed}</span>
                  </div>

                  <div className="flex items-center justify-between rounded bg-slate-900/60 px-2.5 py-1.5">
                    <span className="text-slate-400">Raw Murmur3 (Unsigned):</span>
                    <span className="text-slate-200">{result.rawMurmur3Unsigned}</span>
                  </div>

                  <div className="flex items-center justify-between rounded bg-slate-900/60 px-2.5 py-1.5 sm:col-span-2">
                    <span className="text-slate-400 shrink-0 mr-2">MD5 (Raw Bytes):</span>
                    <div className="flex items-center gap-1 overflow-hidden">
                      <span className="text-amber-300 truncate">{result.md5}</span>
                      <button
                        onClick={() => handleCopy(result.md5, "hash-md5")}
                        className="text-slate-400 hover:text-slate-200 shrink-0"
                      >
                        {copiedKey === "hash-md5" ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded bg-slate-900/60 px-2.5 py-1.5 sm:col-span-2">
                    <span className="text-slate-400 shrink-0 mr-2">SHA-256:</span>
                    <div className="flex items-center gap-1 overflow-hidden">
                      <span className="text-slate-300 truncate">{result.sha256}</span>
                      <button
                        onClick={() => handleCopy(result.sha256, "hash-sha256")}
                        className="text-slate-400 hover:text-slate-200 shrink-0"
                      >
                        {copiedKey === "hash-sha256" ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preset Specific Attack Vectors (if selected from cheat sheet) */}
              {selectedPreset && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Terminal className="h-3.5 w-3.5" /> High-Yield Attack Vectors for {selectedPreset.name}:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                    {selectedPreset.attackVectors.map((v, i) => (
                      <li key={i}>
                        <code className="text-amber-200">{v}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
