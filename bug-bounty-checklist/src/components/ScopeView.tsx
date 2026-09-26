import { useState } from "react";
import { ShieldCheck, ShieldX, FileText, Award, Save, Check } from "lucide-react";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import type { TargetProfile } from "../types/checklist";

function ScopeEditor({ profile }: { profile: TargetProfile }) {
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
          <h1 className="text-xl font-bold text-slate-100">
            🎯 Scope & Policy — {profile.name}
          </h1>
          <p className="text-xs text-slate-400">
            Define boundaries, in-scope assets, out-of-scope targets, and rules of engagement for this target.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved to Profile!" : "Save Scope"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* IN SCOPE */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <h2 className="text-sm font-semibold">In-Scope Assets & Endpoints</h2>
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
            <h2 className="text-sm font-semibold">Out-of-Scope Assets & Restrictions</h2>
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
            <h2 className="text-sm font-semibold">Bounty Rewards / Tier</h2>
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
            <h2 className="text-sm font-semibold">Rules of Engagement & Test Accounts</h2>
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

export function ScopeView() {
  const profile = useActiveProfile();
  if (!profile) return null;
  return <ScopeEditor key={profile.id} profile={profile} />;
}
