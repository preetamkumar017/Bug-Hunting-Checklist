import { useState } from "react";
import {
  Target,
  Globe,
  Server,
  Zap,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Cloud,
  FolderGit2,
  CheckCircle2,
} from "lucide-react";
import { useTargetContext } from "@/shared/store/useTargetContext";
import { useActiveProfile, useChecklistStore } from "@/shared/store/useChecklistStore";

interface GlobalTargetBarProps {
  onOpenChainer: () => void;
}

export function GlobalTargetBar({ onOpenChainer }: GlobalTargetBarProps) {
  const [expanded, setExpanded] = useState(false);
  const profile = useActiveProfile();
  const renameProfile = useChecklistStore((s) => s.renameProfile);

  const targetDomain = useTargetContext((s) => s.targetDomain);
  const subdomain = useTargetContext((s) => s.subdomain);
  const originIp = useTargetContext((s) => s.originIp);
  const cloudBucket = useTargetContext((s) => s.cloudBucket);
  const protectedPath = useTargetContext((s) => s.protectedPath);

  const setTargetDomain = useTargetContext((s) => s.setTargetDomain);
  const setSubdomain = useTargetContext((s) => s.setSubdomain);
  const setOriginIp = useTargetContext((s) => s.setOriginIp);
  const setCloudBucket = useTargetContext((s) => s.setCloudBucket);
  const setProtectedPath = useTargetContext((s) => s.setProtectedPath);
  const reset = useTargetContext((s) => s.reset);

  const hasAnyTarget = Boolean(
    targetDomain || subdomain || originIp || cloudBucket || protectedPath
  );

  const canSyncProfileName =
    profile &&
    profile.name === "Default" &&
    targetDomain.trim().length > 0 &&
    targetDomain.includes(".");

  return (
    <div className="mb-5 rounded-xl border border-cyan-500/25 bg-slate-900/60 shadow-lg shadow-cyan-950/20 backdrop-blur-md">
      {/* Top Main Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5">
        {/* Left: Target Indicator & Badge */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Target className="h-4 w-4" />
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {profile && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-800/90 px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700">
                Target:{" "}
                <span className="font-mono text-cyan-300">
                  {profile.name}
                </span>
              </span>
            )}

            <span className="text-xs font-bold text-slate-200">
              {targetDomain ? (
                <span className="font-mono text-cyan-300">{targetDomain}</span>
              ) : (
                <span className="text-slate-400">Target Not Set</span>
              )}
            </span>

            {targetDomain && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                <Sparkles className="h-2.5 w-2.5" /> Auto-Replacer Active
              </span>
            )}

            {subdomain && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-border">
                <Globe className="h-2.5 w-2.5 text-cyan-400" /> {subdomain}
              </span>
            )}

            {originIp && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-amber-300 border border-border">
                <Server className="h-2.5 w-2.5 text-amber-400" /> {originIp}
              </span>
            )}

            {canSyncProfileName && (
              <button
                onClick={() => renameProfile(profile.id, targetDomain)}
                title="Update current profile name to match your target domain"
                className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Rename Profile to &quot;{targetDomain}&quot;
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Chainer Launch Button */}
          <button
            onClick={onOpenChainer}
            title="Open Recon & Attack Chainer"
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors shadow-sm"
          >
            <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>Attack Chainer</span>
          </button>

          {/* Quick Reset */}
          {hasAnyTarget && (
            <button
              onClick={() => reset()}
              title="Reset target variables for this profile"
              className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 rounded-lg border border-border bg-slate-800/80 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <span className="text-[11px] font-medium">
              {expanded ? "Hide" : "Set Variables"}
            </span>
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Context Inputs Drawer */}
      {expanded && (
        <div className="border-t border-border/60 bg-slate-950/40 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <p className="text-[11px] text-slate-400">
              Variables entered here are <strong>saved per Target Profile</strong> and{" "}
              <strong>automatically replace</strong>{" "}
              <code className="text-cyan-300">target.com</code>,{" "}
              <code className="text-cyan-300">api.example.com</code>,{" "}
              <code className="text-cyan-300">&#123;TARGET&#125;</code>,{" "}
              <code className="text-cyan-300">&#123;SUBDOMAIN&#125;</code>, and{" "}
              <code className="text-amber-300">&#123;ORIGIN_IP&#125;</code> across all commands,
              payloads, and playbooks in real-time.
            </p>
            <span className="text-[10px] text-cyan-400 font-mono">
              Auto-persisted to &quot;{profile?.name || "Active Profile"}&quot;
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {/* Target Domain Input */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Primary Target Domain
              </label>
              <div className="relative">
                <Target className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-cyan-400" />
                <input
                  type="text"
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value)}
                  placeholder="e.g. salesflare.com or tesla.com"
                  className="w-full rounded-lg border border-border bg-slate-900/80 pl-8 pr-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Active Subdomain Input */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Discovered Subdomain
              </label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-cyan-400" />
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="e.g. api.salesflare.com"
                  className="w-full rounded-lg border border-border bg-slate-900/80 pl-8 pr-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Origin IP Input */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Discovered Origin IP
              </label>
              <div className="relative">
                <Server className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-amber-400" />
                <input
                  type="text"
                  value={originIp}
                  onChange={(e) => setOriginIp(e.target.value)}
                  placeholder="e.g. 198.51.100.25 (WAF bypass IP)"
                  className="w-full rounded-lg border border-border bg-slate-900/80 pl-8 pr-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cloud Bucket */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Cloud Bucket Name (S3 / GCP / Azure)
              </label>
              <div className="relative">
                <Cloud className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-emerald-400" />
                <input
                  type="text"
                  value={cloudBucket}
                  onChange={(e) => setCloudBucket(e.target.value)}
                  placeholder="e.g. salesflare-prod-backups or assets-storage"
                  className="w-full rounded-lg border border-border bg-slate-900/80 pl-8 pr-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Protected Path */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Protected / Admin Path
              </label>
              <div className="relative">
                <FolderGit2 className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-purple-400" />
                <input
                  type="text"
                  value={protectedPath}
                  onChange={(e) => setProtectedPath(e.target.value)}
                  placeholder="e.g. /actuator/env or /api/v1/admin"
                  className="w-full rounded-lg border border-border bg-slate-900/80 pl-8 pr-2.5 py-1.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
