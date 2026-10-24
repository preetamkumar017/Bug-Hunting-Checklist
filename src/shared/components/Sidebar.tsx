import { useState, useMemo } from "react";
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  X,
  Target,
  Wrench,
  FolderPlus,
  LayoutDashboard,
  GraduationCap,
  Command,
  ArrowDownAZ,
  Zap,
  CreditCard,
  Cloud,
  Flame,
  LockOpen,
  Server,
  KeyRound,
  Database,
  Timer,
  FileCode,
  Share2,
  Radio,
  Cpu,
  Globe,
  ShoppingBag,
} from "lucide-react";
import { domains } from "@/hunt/data/domains";
import { useActiveProfile, useChecklistStore } from "@/shared/store/useChecklistStore";
import { effectiveCategories, effectiveCatalogue } from '@/shared/lib/catalogue';
import { MAX_IMPORT_BYTES, parseProfileImport } from '@/shared/lib/profileValidation';
import { domainProgress, categoryProgress } from "@/shared/lib/progress";
import type { Domain } from "@/shared/types/checklist";
import { ProfileSwitcher } from "@/shared/components/ProfileSwitcher";

export function Sidebar({
  activeDomain,
  onSelectDomain,
  view,
  onSelectView,
  onOpenCommandPalette,
  onOpenAddCategory,
  onJumpToCategory,
  open,
  onClose,
}: {
  activeDomain: Domain;
  onSelectDomain: (d: Domain) => void;
  view: "checklist" | "dashboard" | "findings" | "scope" | "tools" | "learn" | "playbook" | "fintech" | "ecommerce" | "saas" | "cloudflare" | "forbidden" | "awswaf" | "otpbypass" | "cache" | "race" | "pdfssrf" | "graphql" | "oauthsso" | "websocket" | "prototype" | "takeover";
  onSelectView: (v: "checklist" | "dashboard" | "findings" | "scope" | "tools" | "learn" | "playbook" | "fintech" | "ecommerce" | "saas" | "cloudflare" | "forbidden" | "awswaf" | "otpbypass" | "cache" | "race" | "pdfssrf" | "graphql" | "oauthsso" | "websocket" | "prototype" | "takeover") => void;
  onOpenCommandPalette?: () => void;
  onOpenAddCategory: () => void;
  onJumpToCategory?: (categoryId: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const profile = useActiveProfile();
  const resetActiveProfile = useChecklistStore((s) => s.resetActiveProfile);
  const deleteProfile = useChecklistStore((s) => s.deleteProfile);
  const profiles = useChecklistStore((s) => s.profiles);

  // The two worlds stay separate: only one world's navigation shows at a time.
  // Dashboard is the Hunt world's home.
  const world: "hunt" | "knowledge" = view === "learn" || view === "tools" || view === "playbook" || view === "fintech" || view === "ecommerce" || view === "saas" || view === "cloudflare" || view === "forbidden" || view === "awswaf" || view === "otpbypass" || view === "cache" || view === "race" || view === "pdfssrf" || view === "graphql" || view === "oauthsso" || view === "websocket" || view === "prototype" || view === "takeover" ? "knowledge" : "hunt";

  const [sortAlphabetical, setSortAlphabetical] = useState(true);
  const [showSubCategories, setShowSubCategories] = useState(true);

  // Domains sorted alphabetically (A-Z) by default
  const displayedDomains = useMemo(() => {
    if (!sortAlphabetical) return domains;
    return [...domains].sort((a, b) => a.label.localeCompare(b.label));
  }, [sortAlphabetical]);

  // Active domain sub-categories, sorted alphabetically (A-Z)
  const activeSubCategories = useMemo(() => {
    const curDomain = domains.find((d) => d.id === activeDomain);
    if (!curDomain) return [];
    const all = effectiveCategories(curDomain, profile);
    return [...all].sort((a, b) => a.name.localeCompare(b.name));
  }, [activeDomain, profile]);

  function handleDeleteProfile() {
    if (!profile) return;
    const confirmed = confirm(
      `Delete target profile "${profile.name}"?\n\nThis permanently removes its checklist progress, scope, and findings from this browser (localStorage).\n\nType OK to confirm.`
    );
    if (!confirmed) return;
    if (prompt(`Type the profile name ("${profile.name}") to confirm deletion:`) === profile.name) {
      deleteProfile(profile.id);
    } else {
      alert("Name didn't match — profile not deleted.");
    }
  }

  const allItems = effectiveCatalogue(profile).flatMap(d => d.categories.flatMap(c => c.items));
  const totalItems = allItems.length;

  const totalDone = profile
    ? allItems.filter(
        (item) => ['clean', 'vulnerable'].includes(profile.itemStates[item.id]?.status)
      ).length
    : 0;

  function exportJson() {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, "_")}_checklist_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { alert('Import exceeds the 3 MB limit'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseProfileImport(reader.result as string);
        useChecklistStore.getState().importProfile(parsed);
        alert('Profile imported. Conflicting IDs are imported as a separate copy.');
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Unable to import profile');
      }
    };
    reader.onerror = () => alert('Unable to read import file');
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 -translate-x-full flex-col overflow-y-auto border-r border-border bg-card p-4 transition-transform duration-200 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="mb-4 flex items-center gap-2.5">
          <img
            src="/shakti-logo.png?v=3"
            alt="Shakti Code Labs"
            className="h-9 w-auto object-contain rounded"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-slate-100 flex items-center gap-1">
              <span>Shakti Code</span>
              <span className="text-emerald-400">Labs</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Bug Bounty Suite • {totalDone}/{totalItems}
            </p>
          </div>
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden lg:flex items-center gap-1 rounded border border-border bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition"
              title="Open Command Palette (Cmd+K)"
            >
              <Command className="h-3 w-3" />K
            </button>
          )}
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-200 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* World switch — Hunt and Knowledge stay separate; only one shows at a time */}
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-border bg-slate-950/40 p-1">
          <button
            onClick={() => {
              onSelectView("dashboard");
              onClose();
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold transition ${
              world === "hunt"
                ? "bg-emerald-500/15 text-emerald-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🎯 Hunt
          </button>
          <button
            onClick={() => {
              onSelectView("learn");
              onClose();
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold transition ${
              world === "knowledge"
                ? "bg-violet-500/15 text-violet-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📚 Learn
          </button>
        </div>

        {world === "hunt" ? (
          <>
            <ProfileSwitcher />
            <div className="my-3 h-px bg-border" />
            <nav className="mb-3 space-y-1">
              <button
                onClick={() => {
                  onSelectView("dashboard");
                  onClose();
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                  view === "dashboard"
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" /> 📊 Dashboard
              </button>
              <button
                onClick={() => {
                  onSelectView("checklist");
                  onClose();
                }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                  view === "checklist"
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                ✅ Checklist
              </button>
              <button
                onClick={() => {
                  onSelectView("scope");
                  onClose();
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                  view === "scope"
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Target className="h-4 w-4" /> Target / Scope
              </button>
              <button
                onClick={() => {
                  onSelectView("findings");
                  onClose();
                }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                  view === "findings"
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                🐞 Findings ({profile?.findings.length ?? 0})
              </button>
            </nav>
          </>
        ) : (
          <nav className="mb-3 space-y-1">
            <button
              onClick={() => {
                onSelectView("learn");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "learn"
                  ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <GraduationCap className="h-4 w-4 text-violet-400" /> 🎓 Learn
            </button>
            <button
              onClick={() => {
                onSelectView("tools");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "tools"
                  ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Wrench className="h-4 w-4 text-amber-400" /> 🧰 Tools
            </button>
            <button
              onClick={() => {
                onSelectView("playbook");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "playbook"
                  ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Zap className="h-4 w-4 text-emerald-400" /> 🎯 Bounty Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("fintech");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "fintech"
                  ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <CreditCard className="h-4 w-4 text-cyan-400" /> 🏦 Fintech Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("ecommerce");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "ecommerce"
                  ? "bg-amber-500/10 text-amber-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <ShoppingBag className="h-4 w-4 text-amber-400" /> 🛒 E-Commerce Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("saas");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "saas"
                  ? "bg-indigo-500/10 text-indigo-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Cloud className="h-4 w-4 text-indigo-400" /> ☁️ SaaS Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("cloudflare");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "cloudflare"
                  ? "bg-amber-500/10 text-amber-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Flame className="h-4 w-4 text-amber-400" /> 🛡️ Cloudflare Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("forbidden");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "forbidden"
                  ? "bg-rose-500/10 text-rose-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <LockOpen className="h-4 w-4 text-rose-400" /> 🚪 403 Bypass Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("awswaf");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "awswaf"
                  ? "bg-amber-500/10 text-amber-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Server className="h-4 w-4 text-amber-400" /> ☁️ AWS WAF Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("otpbypass");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "otpbypass"
                  ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <KeyRound className="h-4 w-4 text-emerald-400" /> 🔐 2FA & OTP Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("cache");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "cache"
                  ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Database className="h-4 w-4 text-cyan-400" /> ⚡ Web Cache Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("race");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "race"
                  ? "bg-violet-500/10 text-violet-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Timer className="h-4 w-4 text-violet-400" /> 🏎️ Race Conditions Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("pdfssrf");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "pdfssrf"
                  ? "bg-rose-500/10 text-rose-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <FileCode className="h-4 w-4 text-rose-400" /> 🖼️ PDF & SSRF Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("graphql");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "graphql"
                  ? "bg-fuchsia-500/10 text-fuchsia-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Share2 className="h-4 w-4 text-fuchsia-400" /> 🔀 GraphQL Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("oauthsso");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "oauthsso"
                  ? "bg-sky-500/10 text-sky-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <KeyRound className="h-4 w-4 text-sky-400" /> 🔑 OAuth SSO Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("websocket");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "websocket"
                  ? "bg-amber-500/10 text-amber-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Radio className="h-4 w-4 text-amber-400" /> 🌐 WebSocket Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("prototype");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "prototype"
                  ? "bg-lime-500/10 text-lime-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Cpu className="h-4 w-4 text-lime-400" /> 🧬 Prototype Pollution Playbook
            </button>
            <button
              onClick={() => {
                onSelectView("takeover");
                onClose();
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                view === "takeover"
                  ? "bg-red-500/10 text-red-400 font-semibold"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Globe className="h-4 w-4 text-red-400" /> ☁️ Subdomain Takeover
            </button>
          </nav>
        )}

        {world === "hunt" && (
        <>
        <div className="my-1 h-px bg-border" />

        <div className="mb-2 mt-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Categories ({domains.length})
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSortAlphabetical((s) => !s)}
              title={
                sortAlphabetical
                  ? "Sorted Alphabetically (A-Z). Click for original methodology order."
                  : "Click to sort categories alphabetically (A-Z)."
              }
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition ${
                sortAlphabetical
                  ? "bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowDownAZ className="h-3 w-3" />
              <span>A-Z</span>
            </button>
            <button
              onClick={onOpenAddCategory}
              title="Create Custom Category"
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
            >
              <FolderPlus className="h-3 w-3" /> + Custom
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {displayedDomains.map((d) => {
            const { done, total } = profile ? domainProgress(d, profile) : { done: 0, total: 0 };
            const isActive = view === "checklist" && activeDomain === d.id;

            return (
              <div key={d.id} className="space-y-0.5">
                <button
                  onClick={() => {
                    onSelectView("checklist");
                    onSelectDomain(d.id);
                    if (activeDomain === d.id) {
                      setShowSubCategories((prev) => !prev);
                    } else {
                      setShowSubCategories(true);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-white/10 text-slate-100 font-medium"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span>{d.emoji}</span>
                    <span className="truncate">{d.label}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500">
                      {done}/{total}
                    </span>
                    {isActive && (
                      <span className="text-[10px] text-slate-400">
                        {showSubCategories ? "▴" : "▾"}
                      </span>
                    )}
                  </div>
                </button>

                {/* Sub-categories under active domain (Alphabetically sorted) */}
                {isActive && showSubCategories && activeSubCategories.length > 0 && (
                  <div className="ml-3 my-1 space-y-0.5 border-l border-slate-700/60 pl-2">
                    {activeSubCategories.map((cat) => {
                      const catProg = profile
                        ? categoryProgress(cat, profile)
                        : { done: 0, total: cat.items.length };
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (onJumpToCategory) {
                              onJumpToCategory(cat.id);
                            } else {
                              requestAnimationFrame(() => {
                                document
                                  .getElementById(cat.id)
                                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                              });
                            }
                            onClose();
                          }}
                          className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-emerald-400 transition group"
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <span className="text-[11px]">{cat.emoji || "📋"}</span>
                            <span className="truncate group-hover:text-emerald-300">
                              {cat.name}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-slate-500">
                            {catProg.done}/{catProg.total}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-auto space-y-1 pt-4">
          <button
            onClick={exportJson}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" /> Export profile (JSON)
          </button>
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200">
            <Upload className="h-3.5 w-3.5" /> Import profile
            <input type="file" accept="application/json" onChange={importJson} className="hidden" />
          </label>
          <button
            onClick={() => {
              if (confirm("Reset all progress for this profile?")) resetActiveProfile();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-400/80 hover:bg-red-950/30"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset profile
          </button>
          <button
            onClick={handleDeleteProfile}
            disabled={!profile}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-500 hover:bg-red-950/40 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete profile permanently
          </button>
        </div>
        </>
        )}
        <p className="mt-3 text-center text-[10px] text-slate-600">
          {Object.keys(profiles).length} profile(s) · offline &amp; encrypted locally
        </p>
      </aside>
    </>
  );
}
