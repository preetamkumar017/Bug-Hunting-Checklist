import {
  Zap,
  Database,
  Search,
  Sparkles,
  Settings,
  Wrench,
  Command,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ToolsViewProps {
  onOpenAnalyzer: () => void;
  onOpenWordlists: () => void;
  onOpenDorks: () => void;
  onOpenReportDrafter: () => void;
  onOpenBurpRules: () => void;
  onOpenTools: () => void;
  onOpenCommandPalette: () => void;
}

interface ToolCard {
  id: string;
  title: string;
  emoji: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  onOpen: () => void;
}

export function ToolsView({
  onOpenAnalyzer,
  onOpenWordlists,
  onOpenDorks,
  onOpenReportDrafter,
  onOpenBurpRules,
  onOpenTools,
  onOpenCommandPalette,
}: ToolsViewProps) {
  const tools: ToolCard[] = [
    {
      id: "analyzer",
      title: "HTTP Request Analyzer",
      emoji: "⚡",
      description:
        "Paste a raw HTTP request and surface likely attack vectors, parameters, and the checks to run against it.",
      icon: Zap,
      accent: "emerald",
      onOpen: onOpenAnalyzer,
    },
    {
      id: "wordlists",
      title: "Payloads & Wordlists",
      emoji: "🗂️",
      description:
        "Curated fuzzing wordlists and payload packs for XSS, SSRF, SQLi, LFI, discovery, and more.",
      icon: Database,
      accent: "sky",
      onOpen: onOpenWordlists,
    },
    {
      id: "dorks",
      title: "Google Dork Generator",
      emoji: "🔎",
      description:
        "Build targeted Google dorks for exposed files, panels, secrets, and subdomains of your target.",
      icon: Search,
      accent: "violet",
      onOpen: onOpenDorks,
    },
    {
      id: "report",
      title: "Report Drafter",
      emoji: "✍️",
      description:
        "Draft an impact-first vulnerability report with structured sections and CVSS scoring.",
      icon: Sparkles,
      accent: "amber",
      onOpen: onOpenReportDrafter,
    },
    {
      id: "burp",
      title: "Burp / Caido Rules",
      emoji: "🎯",
      description:
        "Generate Match & Replace rules for Burp Suite and Caido to automate header and body rewrites.",
      icon: Settings,
      accent: "amber",
      onOpen: onOpenBurpRules,
    },
    {
      id: "swiss",
      title: "Swiss Army Knife",
      emoji: "🛠️",
      description:
        "Encoders, decoders, hashers, and quick converters — the everyday utilities for request tampering.",
      icon: Wrench,
      accent: "slate",
      onOpen: onOpenTools,
    },
    {
      id: "palette",
      title: "Command Palette",
      emoji: "⌘",
      description:
        "Jump to any domain, view, tool, or category instantly. Also opens with Cmd/Ctrl + K.",
      icon: Command,
      accent: "purple",
      onOpen: onOpenCommandPalette,
    },
  ];

  const accentClasses: Record<string, { border: string; bg: string; icon: string; hover: string }> = {
    emerald: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10 text-emerald-400",
      icon: "text-emerald-400",
      hover: "hover:border-emerald-500/60",
    },
    sky: {
      border: "border-sky-500/30",
      bg: "bg-sky-500/10 text-sky-400",
      icon: "text-sky-400",
      hover: "hover:border-sky-500/60",
    },
    violet: {
      border: "border-violet-500/30",
      bg: "bg-violet-500/10 text-violet-400",
      icon: "text-violet-400",
      hover: "hover:border-violet-500/60",
    },
    amber: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10 text-amber-400",
      icon: "text-amber-400",
      hover: "hover:border-amber-500/60",
    },
    purple: {
      border: "border-purple-500/30",
      bg: "bg-purple-500/10 text-purple-400",
      icon: "text-purple-400",
      hover: "hover:border-purple-500/60",
    },
    slate: {
      border: "border-border",
      bg: "bg-slate-500/10 text-slate-300",
      icon: "text-slate-300",
      hover: "hover:border-slate-500/60",
    },
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-100">
          🧰 Tools
        </h1>
        <p className="text-xs text-slate-400">
          Every tool in one place. Pick one to open it — each runs fully offline in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const a = accentClasses[tool.accent] ?? accentClasses.slate;
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={tool.onOpen}
              className={`group flex flex-col rounded-xl border ${a.border} ${a.hover} bg-card p-4 text-left transition hover:bg-white/5`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.bg}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
              </div>
              <h2 className="text-sm font-bold text-slate-100">
                {tool.emoji} {tool.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{tool.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
