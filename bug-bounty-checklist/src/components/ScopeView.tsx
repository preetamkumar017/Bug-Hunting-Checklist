import { useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  FileText,
  Award,
  Save,
  Check,
  Globe,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Edit3,
  FileSpreadsheet,
  AlertTriangle,
  Server,
  Smartphone,
  Code,
} from "lucide-react";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import type { TargetProfile, TargetAsset } from "../types/checklist";

function ScopePoliciesTab({ profile }: { profile: TargetProfile }) {
  const setScope = useChecklistStore((s) => s.setScope);

  const [inScope, setInScope] = useState(profile.scope?.inScope || "");
  const [outOfScope, setOutOfScope] = useState(profile.scope?.outOfScope || "");
  const [programPolicy, setProgramPolicy] = useState(profile.scope?.programPolicy || "");
  const [bountyTier, setBountyTier] = useState(profile.scope?.bountyTier || "");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setScope({
      inScope,
      outOfScope,
      programPolicy,
      bountyTier,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">
            Rules of Engagement &amp; Scope Boundaries
          </h2>
          <p className="text-xs text-slate-400">
            Define boundaries, in-scope assets, out-of-scope targets, and rules of engagement for {profile.name}.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4 text-white" />}
          {saved ? "Saved to Profile!" : "Save Scope"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* IN SCOPE */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="text-sm font-semibold">In-Scope Assets &amp; Endpoints</h3>
          </div>
          <p className="mb-2 text-[11px] text-slate-400">
            One URL or wildcard per line (e.g. *.example.com, api.example.com, mobile app bundle IDs).
          </p>
          <textarea
            value={inScope}
            onChange={(e) => setInScope(e.target.value)}
            rows={8}
            placeholder="https://example.com&#10;*.api.example.com&#10;com.company.mobileapp"
            className="w-full rounded-md border border-border/80 bg-slate-950 p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
          />
        </div>

        {/* OUT OF SCOPE */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-rose-400">
            <ShieldX className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Out-of-Scope Assets &amp; Restrictions</h3>
          </div>
          <p className="mb-2 text-[11px] text-slate-400">
            Excluded third parties, rate-limit forbidden endpoints, or sensitive production portals.
          </p>
          <textarea
            value={outOfScope}
            onChange={(e) => setOutOfScope(e.target.value)}
            rows={8}
            placeholder="thirdparty-payments.com&#10;status.example.com&#10;Do not test DoS or brute force"
            className="w-full rounded-md border border-border/80 bg-slate-950 p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-rose-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* BOUNTY TIER / REWARD MATRIX */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-400">
            <Award className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Bounty Rewards / Tier</h3>
          </div>
          <textarea
            value={bountyTier}
            onChange={(e) => setBountyTier(e.target.value)}
            rows={5}
            placeholder="Critical: $3,000&#10;High: $1,500&#10;Medium: $500&#10;Low: $150"
            className="w-full rounded-md border border-border bg-slate-950 p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-amber-500"
          />
        </div>

        {/* PROGRAM POLICY & ROE */}
        <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-sky-400">
            <FileText className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Rules of Engagement &amp; Test Accounts</h3>
          </div>
          <textarea
            value={programPolicy}
            onChange={(e) => setProgramPolicy(e.target.value)}
            rows={5}
            placeholder="Headers required: 'X-Bug-Bounty: hacker_username'&#10;Test Accounts: user1@target.com / user2@target.com&#10;Safe harbor guidelines: report within 24h of discovery"
            className="w-full rounded-md border border-border bg-slate-950 p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-sky-500"
          />
        </div>
      </div>
    </div>
  );
}

function AssetInventoryTab({ profile }: { profile: TargetProfile }) {
  const addAsset = useChecklistStore((s) => s.addAsset);
  const deleteAsset = useChecklistStore((s) => s.deleteAsset);
  const updateAsset = useChecklistStore((s) => s.updateAsset);
  const bulkAddAssets = useChecklistStore((s) => s.bulkAddAssets);

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [hostInput, setHostInput] = useState("");
  const [typeInput, setTypeInput] = useState<TargetAsset["type"]>("subdomain");
  const [portsInput, setPortsInput] = useState("");
  const [techInput, setTechInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const assets = profile.assets || [];

  function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!hostInput.trim()) return;

    addAsset({
      host: hostInput.trim(),
      type: typeInput,
      status: "live",
      ports: portsInput.trim() || undefined,
      tech: techInput ? techInput.split(",").map((t) => t.trim()).filter(Boolean) : [],
      notes: notesInput.trim() || undefined,
    });

    setHostInput("");
    setPortsInput("");
    setTechInput("");
    setNotesInput("");
  }

  function handleBulkImport() {
    if (!bulkText.trim()) return;
    const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    bulkAddAssets(lines);
    setBulkText("");
    setBulkMode(false);
  }

  async function copyText(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const filteredAssets = assets.filter((a) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      a.host.toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q) ||
      a.tech?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-400" />
            Asset &amp; Subdomain Inventory ({assets.length})
          </h2>
          <p className="text-xs text-slate-400">
            Track live subdomains, exposed APIs, cloud IPs, and takeover candidates for {profile.name}.
          </p>
        </div>
        <button
          onClick={() => setBulkMode(!bulkMode)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
        >
          <FileSpreadsheet className="h-4 w-4 text-sky-400" />
          {bulkMode ? "Close Bulk Paste" : "Bulk Import List"}
        </button>
      </div>

      {bulkMode && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-950/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-300">
              Paste newline-separated targets (subdomains, IPs, URLs)
            </span>
            <span className="text-[11px] text-slate-400">Auto-detects IP vs Subdomain vs API</span>
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={5}
            placeholder={`api.example.com\nadmin.example.com\n192.168.1.1\nsso.example.com`}
            className="w-full rounded-md border border-border bg-slate-950 p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-sky-500"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setBulkMode(false)}
              className="rounded-md px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkImport}
              className="rounded-md bg-sky-600 px-3.5 py-1 text-xs font-semibold text-white hover:bg-sky-500"
            >
              Import {bulkText.split(/\r?\n/).filter((l) => l.trim()).length} Assets
            </button>
          </div>
        </div>
      )}

      {/* Add Single Asset Form */}
      <form onSubmit={handleAddSingle} className="rounded-xl border border-border bg-card p-4">
        <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          + Add New Target Asset
        </span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <input
              type="text"
              required
              value={hostInput}
              onChange={(e) => setHostInput(e.target.value)}
              placeholder="Host: e.g. api.target.com or 10.0.0.1"
              className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <select
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value as TargetAsset["type"])}
              className="w-full rounded-md border border-border bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            >
              <option value="subdomain">Subdomain</option>
              <option value="domain">Root Domain</option>
              <option value="api">API Endpoint</option>
              <option value="ip">IP / Host</option>
              <option value="mobile_app">Mobile App</option>
              <option value="repo">Source Repo</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              value={portsInput}
              onChange={(e) => setPortsInput(e.target.value)}
              placeholder="Ports: 80, 443, 8443"
              className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="Tech: Nginx, Next.js, AWS"
              className="w-full rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <input
            type="text"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Quick testing notes: e.g. 403 bypass candidate, uses AWS S3 bucket..."
            className="flex-1 rounded-md border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            <Plus className="h-3.5 w-3.5" /> Add Asset
          </button>
        </div>
      </form>

      {/* Asset Table / List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter assets by name, technology, or notes..."
            className="w-72 rounded-md border border-border bg-card px-3 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
          />
          <span className="text-[11px] text-slate-500">{filteredAssets.length} matching asset(s)</span>
        </div>

        {assets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-slate-500">
            No assets in inventory yet. Add subdomains or use Bulk Import to populate your target inventory!
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="rounded-xl border border-border p-6 text-center text-xs text-slate-400">
            No assets match &quot;{searchFilter}&quot;.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Asset Target</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Tech &amp; Ports</th>
                  <th className="px-4 py-2.5">Notes</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAssets.map((asset) => {
                  return (
                    <tr key={asset.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-4 py-2.5 font-mono text-slate-200 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span>{asset.host}</span>
                          <button
                            onClick={() => copyText(asset.host, asset.id)}
                            className="text-slate-500 hover:text-slate-300"
                            title="Copy asset address"
                          >
                            {copiedId === asset.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          {asset.host.includes(".") && !asset.host.startsWith("10.") && (
                            <a
                              href={asset.host.startsWith("http") ? asset.host : `https://${asset.host}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-emerald-400"
                              title="Open in new browser tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1 text-[11px] text-slate-300">
                          {asset.type === "api" ? (
                            <Code className="h-3 w-3 text-sky-400" />
                          ) : asset.type === "ip" ? (
                            <Server className="h-3 w-3 text-purple-400" />
                          ) : asset.type === "mobile_app" ? (
                            <Smartphone className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Globe className="h-3 w-3 text-amber-400" />
                          )}
                          {asset.type || "subdomain"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={asset.status || "live"}
                          onChange={(e) =>
                            updateAsset(asset.id, {
                              status: e.target.value,
                            })
                          }
                          className={`rounded px-2 py-0.5 text-[11px] font-semibold border outline-none ${
                            asset.status === "takeover_risk"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : asset.status === "live" || asset.status === "200 OK"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : asset.status === "dead"
                              ? "bg-slate-800 text-slate-400 border-slate-700"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          <option value="live" className="bg-slate-900 text-emerald-300">
                            Live (200)
                          </option>
                          <option value="takeover_risk" className="bg-slate-900 text-rose-300">
                            Takeover Risk!
                          </option>
                          <option value="unconfirmed" className="bg-slate-900 text-amber-300">
                            Unconfirmed
                          </option>
                          <option value="dead" className="bg-slate-900 text-slate-400">
                            Dead / Inactive
                          </option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {asset.ports && (
                            <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                              :{asset.ports}
                            </span>
                          )}
                          {asset.tech?.map((tech: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] text-emerald-300 border border-emerald-500/20"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
                        {asset.status === "takeover_risk" && (
                          <span className="mr-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-400">
                            <AlertTriangle className="h-3 w-3" /> Potential CNAME dangling!
                          </span>
                        )}
                        <span className="text-[11px]">{asset.notes || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="rounded p-1 text-slate-500 hover:bg-rose-950/40 hover:text-rose-400"
                          title="Delete asset"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ScratchpadTab({ profile }: { profile: TargetProfile }) {
  const setScratchpad = useChecklistStore((s) => s.setScratchpad);
  const [text, setText] = useState(profile.scratchpad || "");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleTextChange(val: string) {
    setText(val);
    setScratchpad(val);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function insertTemplate(templateType: "matrix" | "subdomains" | "jwt") {
    let snippet = "";
    if (templateType === "matrix") {
      snippet = `\n### 👥 Testing Account Matrix
- Account A (Victim - Org 1):
  - Email: victim@target.com
  - User ID: 1042
  - Org ID: 501
  - Auth Token / Cookie: Bearer ...
- Account B (Attacker - Org 2):
  - Email: attacker@target.com
  - User ID: 2099
  - Org ID: 702
  - Auth Token / Cookie: Bearer ...
- Account C (Low Priv): guest@target.com\n`;
    } else if (templateType === "subdomains") {
      snippet = `\n### 🌐 Discovered Endpoints & Secrets
- Internal API Gateway: https://gateway-internal.target.com
- S3 Bucket: https://company-production-assets.s3.amazonaws.com
- Admin Portal: https://admin.target.com/login (SSO SAML)
- Leaked Tokens:
  - Mapbox / Algolia: ...\n`;
    } else {
      snippet = `\n### ⚡ Active Attack Log & Notes
- [ ] Test IDOR on /api/v2/invoices/:id
- [ ] Test Race condition on /api/cart/checkout coupon code
- [ ] Test SSRF on /api/webhooks/validate with AWS IMDSv2
- [ ] Test JWT alg: none on auth header\n`;
    }

    const updated = text ? `${text}\n${snippet}` : snippet.trimStart();
    handleTextChange(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-emerald-400" />
            Hacker Scratchpad &amp; Test Notes — {profile.name}
          </h2>
          <p className="text-xs text-slate-400">
            Auto-saving scratchpad for test credentials, internal IPs, Burp snippets, and active thoughts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Auto-saved
            </span>
          )}
          <button
            onClick={copyAll}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-slate-100"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            Copy Notes
          </button>
        </div>
      </div>

      {/* Quick Insert Snippets */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-card p-2">
        <span className="text-[11px] font-medium text-slate-400">Insert Templates:</span>
        <button
          onClick={() => insertTemplate("matrix")}
          className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-emerald-400"
        >
          + Account Matrix (Victim vs Attacker)
        </button>
        <button
          onClick={() => insertTemplate("subdomains")}
          className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-sky-400"
        >
          + Discovered Endpoints &amp; Secrets
        </button>
        <button
          onClick={() => insertTemplate("jwt")}
          className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-amber-400"
        >
          + Active Attack Log
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        rows={16}
        placeholder={`Write anything here... Test tokens, credentials, internal paths, raw response snippets. Auto-saves locally.`}
        className="w-full rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-200 outline-none focus:border-emerald-500"
      />
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>{text.split(/\r?\n/).length} lines · {text.length} characters</span>
        <span>Persisted securely in browser profile storage</span>
      </div>
    </div>
  );
}

export function ScopeView() {
  const profile = useActiveProfile();
  const [activeTab, setActiveTab] = useState<"scope" | "assets" | "scratchpad">("scope");

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Scope Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("scope")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "scope"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Scope &amp; Rules of Engagement
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "assets"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Globe className="h-4 w-4" />
          Subdomain &amp; Asset Inventory
          {profile.assets && profile.assets.length > 0 && (
            <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
              {profile.assets.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("scratchpad")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "scratchpad"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Edit3 className="h-4 w-4" />
          Hacker Scratchpad
        </button>
      </div>

      {activeTab === "scope" ? (
        <ScopePoliciesTab profile={profile} />
      ) : activeTab === "assets" ? (
        <AssetInventoryTab profile={profile} />
      ) : (
        <ScratchpadTab profile={profile} />
      )}
    </div>
  );
}
