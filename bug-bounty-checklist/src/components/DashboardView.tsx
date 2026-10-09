import { useMemo } from "react";
import {
  Award,
  Bug,
  CheckCircle2,
  TrendingUp,
  Target,
  DollarSign,
  Layers,
  ArrowRight,
  Shield,
  ExternalLink,
} from "lucide-react";
import { domains } from "../data/domains";
import { useActiveProfile } from "../store/useChecklistStore";
import { domainProgress } from "../lib/progress";
import { effectiveCatalogue } from '../lib/catalogue';
import type { Domain, Severity } from "../types/checklist";

interface DashboardViewProps {
  onSelectDomain: (d: Domain) => void;
  onSelectView: (v: "checklist" | "findings" | "scope") => void;
}


export function DashboardView({ onSelectDomain, onSelectView }: DashboardViewProps) {
  const profile = useActiveProfile();

  // Aggregate stats across all domains and items
  const stats = useMemo(() => {
    if (!profile) return null;

    const totalItemsList = effectiveCatalogue(profile).flatMap((d) =>
      d.categories.flatMap((c) => c.items.map((i) => ({ ...i, domainId: d.id })))
    );
    const totalChecks = totalItemsList.length;

    let clean = 0;
    let vulnerable = 0;
    let blocked = 0;
    let bookmarked = 0;

    totalItemsList.forEach((item) => {
      const st = profile.itemStates[item.id];
      if (!st) return;
      if (st.status === "clean") clean++;
      else if (st.status === "vulnerable") vulnerable++;
      else if (st.status === "blocked") blocked++;
      if (st.bookmarked) bookmarked++;
    });

    const tested = clean + vulnerable;
    const progressPercent = totalChecks > 0 ? Math.round((tested / totalChecks) * 100) : 0;

    // Findings breakdown
    const findingsBySev: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };


    profile.findings.forEach((f) => {
      const sev = f.severity || "medium";
      findingsBySev[sev] = (findingsBySev[sev] || 0) + 1;
    });

    // Domain breakdown
    const domainStats = domains.map((d) => {
      const { done, total } = domainProgress(d, profile);
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        ...d,
        done,
        total,
        pct,
      };
    });

    return {
      totalChecks,
      tested,
      clean,
      vulnerable,
      blocked,
      bookmarked,
      progressPercent,
      findingsBySev,
      domainStats,
    };
  }, [profile]);

  if (!profile || !stats) return null;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            📊 Security Audit &amp; Bounty Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Checklist progress and recorded findings for{" "}
            <span className="font-semibold text-emerald-400">{profile.name}</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectView("checklist")}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            <span>Continue Testing</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Top KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Estimated Bounty Earnings */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Recorded Findings
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-100">
            {profile.findings.length}
          </p>
          <p className="mt-1 text-[11px] text-emerald-300/80">
            Rewards depend on program validation and policy.
          </p>
        </div>

        {/* Overall Progress */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Checklist Completion
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">{stats.progressPercent}%</span>
            <span className="text-xs text-slate-400">
              ({stats.tested} / {stats.totalChecks})
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-300"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Vulnerabilities Found */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/15 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Vulnerabilities Confirmed
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <Bug className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-200">
            {stats.vulnerable}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-rose-300/80">
            <span>Critical: {stats.findingsBySev.critical}</span>
            <span>·</span>
            <span>High: {stats.findingsBySev.high}</span>
          </div>
        </div>

        {/* Clean & Passed Checks */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Passed / Clean Checks
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-100">
            {stats.clean}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {stats.bookmarked} bookmarked for follow-up
          </p>
        </div>
      </div>

      {/* Findings Breakdown & Bounty Matrix */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Severity Matrix */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              Findings by Severity
            </h2>
            <button
              onClick={() => onSelectView("findings")}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              View Findings <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                sev: "critical" as Severity,
                label: "Critical",
                count: stats.findingsBySev.critical,
                bg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
              },
              {
                sev: "high" as Severity,
                label: "High",
                count: stats.findingsBySev.high,
                bg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
              },
              {
                sev: "medium" as Severity,
                label: "Medium",
                count: stats.findingsBySev.medium,
                bg: "bg-sky-500/20 text-sky-300 border-sky-500/30",
              },
              {
                sev: "low" as Severity,
                label: "Low",
                count: stats.findingsBySev.low,
                bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
              },
              {
                sev: "info" as Severity,
                label: "Info",
                count: stats.findingsBySev.info,
                reward: 0,
                bg: "bg-slate-800 text-slate-300 border-slate-700",
              },
            ].map((item) => (
              <div
                key={item.sev}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-slate-950/40 p-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase border ${item.bg}`}>
                    {item.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {item.count} finding(s)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {item.count} recorded
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/10 p-3 text-[11px] text-amber-300/90">
            <span className="font-semibold flex items-center gap-1">
              <Award className="h-3.5 w-3.5" /> Bounty Hunting Tip:
            </span>
            Chain Medium/Low findings (like CORS misconfiguration + Session fixation) to escalate impact to Critical/High!
          </div>
        </div>

        {/* Domain-by-Domain Progress Bars */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              Methodology Progress by Domain
            </h2>
            <span className="text-[11px] text-slate-400">Click any domain to jump</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {stats.domainStats.map((d) => {
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    onSelectDomain(d.id);
                    onSelectView("checklist");
                  }}
                  className="cursor-pointer rounded-lg border border-border/80 bg-slate-950/50 p-3.5 transition hover:border-emerald-500/60 hover:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{d.emoji}</span>
                      <span>{d.label}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {d.pct}%
                    </span>
                  </div>

                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        d.pct === 100
                          ? "bg-emerald-500"
                          : d.pct > 50
                          ? "bg-sky-500"
                          : d.pct > 0
                          ? "bg-amber-500"
                          : "bg-transparent"
                      }`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{d.done} / {d.total} completed</span>
                    <span className="text-emerald-400 hover:underline">Open &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Target Asset & Scope Summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-400" />
            Target Recon &amp; Scope Overview
          </h2>
          <button
            onClick={() => onSelectView("scope")}
            className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
          >
            Manage Scope &amp; Assets <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-slate-950/40 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              In-Scope Boundaries
            </span>
            <p className="mt-1 font-mono text-xs text-slate-300 line-clamp-3">
              {profile.scope?.inScope || "No in-scope boundaries specified yet."}
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-slate-950/40 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">
              Out-of-Scope / Exclusions
            </span>
            <p className="mt-1 font-mono text-xs text-slate-300 line-clamp-3">
              {profile.scope?.outOfScope || "No exclusions defined."}
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-slate-950/40 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Asset Inventory Summary
            </span>
            <p className="mt-1 text-xs text-slate-300">
              {(profile.assets || []).length} registered assets (
              {(profile.assets || []).filter((a) => a.status === "live").length} live,{" "}
              {(profile.assets || []).filter((a) => a.status === "takeover_risk").length} takeover risk)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
