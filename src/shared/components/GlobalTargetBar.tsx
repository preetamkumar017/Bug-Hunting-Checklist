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
} from "lucide-react";
import { useTargetContext } from "@/shared/store/useTargetContext";

interface GlobalTargetBarProps {
  onOpenChainer: () => void;
}

export function GlobalTargetBar({ onOpenChainer }: GlobalTargetBarProps) {
  const [expanded, setExpanded] = useState(false);

  const targetDomain = useTargetContext((s) => s.targetDomain);
  const subdomain = useTargetContext((s) => s.subdomain);
  const originIp = useTargetContext((s) => s.originIp);

  const setTargetDomain = useTargetContext((s) => s.setTargetDomain);
  const setSubdomain = useTargetContext((s) => s.setSubdomain);
  const setOriginIp = useTargetContext((s) => s.setOriginIp);
  const reset = useTargetContext((s) => s.reset);

  const hasAnyTarget = Boolean(targetDomain || subdomain || originIp);

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
              title="Reset target variables"
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
          <p className="text-[11px] text-slate-400 mb-2.5">
            Variables entered here will <strong>automatically replace</strong>{" "}
            <code className="text-cyan-300">target.com</code>,{" "}
            <code className="text-cyan-300">&#123;TARGET&#125;</code>,{" "}
            <code className="text-cyan-300">&#123;SUBDOMAIN&#125;</code>, and{" "}
            <code className="text-amber-300">&#123;ORIGIN_IP&#125;</code> across all commands,
            payloads, and playbooks in real-time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  placeholder="e.g. uber.com or starbucks.com"
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
                  placeholder="e.g. dev.uber.com or api.target.com"
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
        </div>
      )}
    </div>
  );
}
