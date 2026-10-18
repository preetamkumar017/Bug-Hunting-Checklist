import { useMemo, useState } from "react";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Info,
  Target,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Search,
  Library,
  Wrench,
  Zap,
  Terminal,
} from "lucide-react";
import {
  learnGroups,
  learnTopicCount,
  lessonForEntry,
  localizedTopic,
  PLATFORM_LEGEND,
  type LearnTopic,
  type VrtPriority,
} from "@/learn/data/learn";
import {
  LEARN_DOMAINS,
  LEARN_LANGS,
  LEARN_UI_STRINGS,
  localize,
  type AppLearnDomain,
  type Lang,
  type VrtIndexEntry,
} from "@/learn/data/types";
import { vrtIndex } from "@/learn/data/vrtIndex";

const LANG_KEY = "learn.lang";
function loadLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "en" || v === "simple" || v === "hi") return v;
  } catch {
    /* storage unavailable — fall through */
  }
  return "en";
}

interface LearnViewProps {
  /** Jump to the operational checklist category for this topic. */
  onPractice: (categoryId: string) => void;
}

const PRIORITY_STYLES: Record<VrtPriority, string> = {
  P1: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  P2: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  P3: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  P4: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  P5: "bg-slate-700 text-slate-300 border-slate-600",
  varies: "bg-violet-500/20 text-violet-300 border-violet-500/40",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          },
          () => {},
        );
      }}
      className="shrink-0 rounded p-1 text-slate-500 hover:text-emerald-400"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function PriorityBadge({ p }: { p: VrtPriority }) {
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLES[p]}`}>
      {p === "varies" ? "Varies" : p}
    </span>
  );
}

function TopicDetail({
  topic,
  lang,
  onBack,
  onPractice,
}: {
  topic: LearnTopic;
  lang: Lang;
  onBack: () => void;
  onPractice: (id: string) => void;
}) {
  const m = topic.mapping;
  const t = (k: keyof typeof LEARN_UI_STRINGS) => LEARN_UI_STRINGS[k][lang];
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400">
        <ArrowLeft className="h-3.5 w-3.5" /> {t("back")}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-100">
            <span>{topic.emoji}</span> {topic.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <PriorityBadge p={m.bugcrowdPriority} />
            <span className="text-[11px] text-slate-400">Bugcrowd VRT · {m.cvssSeverity}</span>
          </div>
        </div>
        {topic.checklistCategoryId && (
          <button
            onClick={() => onPractice(topic.checklistCategoryId!)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            {t("practice")} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Intro */}
      <section>
        <h2 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-100">
          <BookOpen className="h-4 w-4 text-emerald-400" /> {t("whatItIs")}
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">{localize(topic.intro, lang)}</p>
        {topic.pending && (
          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-950/15 p-3 text-xs leading-relaxed text-amber-200/90">
            {t("pending")}
          </p>
        )}
      </section>

      {/* How to find */}
      {topic.howToFind.length > 0 && (
      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-100">🔍 {t("howToFind")}</h2>
        <div className="space-y-3">
          {topic.howToFind.map((method, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <p className="mb-1.5 text-xs font-semibold text-emerald-300">{localize(method.title, lang)}</p>
              <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-300">
                {method.steps.map((s, j) => (
                  <li key={j}>{localize(s, lang)}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Recommended Tools & Practical Workflow */}
      {topic.tools && topic.tools.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Wrench className="h-4 w-4 text-sky-400" /> {t("toolsTitle")}
            </h2>
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300 border border-sky-500/20">
              Battle-Tested
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topic.tools.map((tool, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-xl border border-border/80 bg-card/90 p-3.5 shadow-sm transition hover:border-sky-500/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="inline-block rounded bg-sky-950/60 border border-sky-800/40 px-1.5 py-0.5 text-[10px] font-mono text-sky-300 mb-1">
                        {tool.category}
                      </span>
                      <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        {tool.name}
                        {tool.link && (
                          <a
                            href={tool.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-sky-300 transition"
                            title="Documentation"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </h3>
                    </div>
                  </div>

                  {tool.command && (
                    <div className="mb-2.5 flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 font-mono text-[11px] text-emerald-300">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Terminal className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <code className="truncate selection:bg-emerald-800">{tool.command}</code>
                      </div>
                      <CopyButton text={tool.command} />
                    </div>
                  )}

                  <div className="text-[11px] leading-relaxed text-slate-300 bg-slate-900/40 rounded-lg p-2.5 border border-border/40">
                    <span className="font-semibold text-slate-200 block mb-0.5">Execution Steps:</span>
                    <p className="whitespace-pre-line">{localize(tool.steps, lang)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bounty Hunter Pro-Tips (Maximize Your Payout) */}
      {topic.bountyTips && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400/20" /> {t("bountyTipsTitle")}
            </h2>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
              💰 Max Payout Blueprint
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* 🎯 Triage Acceptance Trigger */}
            <div className="flex flex-col rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-950/60 p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-amber-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 text-xs">🎯</span>
                <span className="text-xs font-bold">{t("triageSecretLabel")}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300 flex-1">
                {localize(topic.bountyTips.triageSecret, lang)}
              </p>
            </div>

            {/* ⚡ Impact Multiplier */}
            <div className="flex flex-col rounded-xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 to-slate-950/60 p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-rose-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-500/20 text-xs">⚡</span>
                <span className="text-xs font-bold">{t("impactMultiplierLabel")}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300 flex-1">
                {localize(topic.bountyTips.impactMultiplier, lang)}
              </p>
            </div>

            {/* 🛑 Avoid Duplicates & N/A Traps */}
            <div className="flex flex-col rounded-xl border border-sky-500/30 bg-gradient-to-b from-sky-950/20 to-slate-950/60 p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-sky-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/20 text-xs">🛑</span>
                <span className="text-xs font-bold">{t("avoidDuplicatesLabel")}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300 flex-1">
                {localize(topic.bountyTips.avoidDuplicates, lang)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Payloads */}
      {topic.payloads && topic.payloads.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-100">⚡ {t("payloads")}</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-slate-950/60">
            {topic.payloads.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 last:border-b-0">
                <code className="min-w-0 break-all font-mono text-[11px] text-amber-200">{p}</code>
                <CopyButton text={p} />
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">{t("payloadsNote")}</p>
        </section>
      )}

      {/* Example */}
      {topic.example && (
        <section>
          <h2 className="mb-1.5 text-sm font-bold text-slate-100">💡 {t("example")}</h2>
          <p className="rounded-lg border border-sky-500/20 bg-sky-950/15 p-3 text-xs leading-relaxed text-slate-300">
            {localize(topic.example, lang)}
          </p>
        </section>
      )}

      {/* Platform mapping */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-100">
          <Target className="h-4 w-4 text-violet-400" /> {t("classification")}
        </h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-border">
              <tr className="bg-card">
                <th className="w-32 px-3 py-2 align-top font-semibold text-slate-400">Bugcrowd (VRT)</th>
                <td className="px-3 py-2 text-slate-300">
                  <div className="flex items-start gap-2">
                    <PriorityBadge p={m.bugcrowdPriority} />
                    <span>{m.bugcrowdVrt}</span>
                  </div>
                  {m.bugcrowdCvss && (
                    <code className="mt-1 block font-mono text-[10px] text-slate-500">{m.bugcrowdCvss}</code>
                  )}
                </td>
              </tr>
              <tr className="bg-card">
                <th className="px-3 py-2 align-top font-semibold text-slate-400">HackerOne (CWE)</th>
                <td className="px-3 py-2 text-slate-300">{m.hackeroneCwe}</td>
              </tr>
              <tr className="bg-card">
                <th className="px-3 py-2 align-top font-semibold text-slate-400">Intigriti / YesWeHack</th>
                <td className="px-3 py-2 text-slate-300">CVSS-based · {t("intigriti")} <span className="font-semibold text-slate-200">{m.cvssSeverity}</span></td>
              </tr>
              {m.note && (
                <tr className="bg-amber-950/10">
                  <th className="px-3 py-2 align-top font-semibold text-amber-400">{t("scoringNote")}</th>
                  <td className="px-3 py-2 text-amber-200/90">{localize(m.note, lang)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* References */}
      {topic.references && topic.references.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-100">📚 {t("learnMore")}</h2>
          <ul className="space-y-1">
            {topic.references.map((r, i) => (
              <li key={i}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                >
                  {r.label} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function VrtIndexBrowser({
  domain,
  category,
  priority,
  lang,
  onOpenLesson,
  onResetFilters,
}: {
  domain: AppLearnDomain | "all";
  category: string;
  priority: VrtPriority | "all";
  lang: Lang;
  onOpenLesson: (topic: LearnTopic) => void;
  onResetFilters: () => void;
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vrtIndex.filter((e) => {
      const matchDomain = domain === "all" || e.domain === domain;
      const matchCategory = category === "all" || e.category === category;
      const matchPriority = priority === "all" || e.priority === priority;
      const matchQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.path.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);
      return matchDomain && matchCategory && matchPriority && matchQuery;
    });
  }, [domain, category, priority, query]);

  const byCategory = useMemo(() => {
    const m = new Map<string, VrtIndexEntry[]>();
    for (const e of rows) {
      const arr = m.get(e.category) ?? [];
      arr.push(e);
      m.set(e.category, arr);
    }
    return [...m.entries()];
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search in ${rows.length} VRT entries…`}
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-emerald-500"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-300">{rows.length}</strong> VRT entries · Bugcrowd VRT {PLATFORM_LEGEND.vrtRelease} · every entry has a lesson
        </span>
        {(query || category !== "all" || domain !== "all" || priority !== "all") && (
          <button
            onClick={() => {
              setQuery("");
              onResetFilters();
            }}
            className="text-slate-400 hover:text-slate-200 underline"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {byCategory.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-slate-400">
          No VRT entries match this filter.
        </p>
      ) : (
        byCategory.map(([cat, items]) => (
          <div key={cat}>
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              {cat} ({items.length})
            </h3>
            <div className="overflow-hidden rounded-lg border border-border">
              {items.map((e) => {
                const lesson = lessonForEntry(e, lang);
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 border-b border-border/60 px-3 py-2 last:border-b-0"
                  >
                    <PriorityBadge p={e.priority} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-200">{e.name}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {e.path}
                        {e.cvss ? ` · ${e.cvss}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenLesson(lesson)}
                      className="inline-flex shrink-0 items-center gap-1 rounded border border-emerald-500/30 px-2 py-0.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-950/30"
                    >
                      {LEARN_UI_STRINGS.lessonCta[lang]} <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function LearnView({ onPractice }: LearnViewProps) {
  const [selected, setSelected] = useState<LearnTopic | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [mode, setMode] = useState<"lessons" | "index">("lessons");
  const [domainFilter, setDomainFilter] = useState<AppLearnDomain | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<VrtPriority | "all">("all");
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  };

  const handleDomainChange = (d: AppLearnDomain | "all") => {
    setDomainFilter(d);
    setCategoryFilter("all");
  };

  const handleResetFilters = () => {
    setDomainFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
  };

  // Categories available based on active mode, domain, and priority
  const availableCategories = useMemo(() => {
    const map = new Map<string, number>();
    if (mode === "index") {
      for (const e of vrtIndex) {
        const matchDomain = domainFilter === "all" || e.domain === domainFilter;
        const matchPriority = priorityFilter === "all" || e.priority === priorityFilter;
        if (matchDomain && matchPriority) {
          map.set(e.category, (map.get(e.category) ?? 0) + 1);
        }
      }
    } else {
      for (const g of learnGroups) {
        for (const t of g.topics) {
          const matchPriority = priorityFilter === "all" || t.mapping.bugcrowdPriority === priorityFilter;
          const matchDomain = domainFilter === "all" || domainFilter === "web";
          if (matchPriority && matchDomain) {
            const cat = t.mapping.bugcrowdVrt.split(" › ")[0];
            map.set(cat, (map.get(cat) ?? 0) + 1);
          }
        }
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [mode, domainFilter, priorityFilter]);

  const totalCategoryItems = useMemo(() => {
    return availableCategories.reduce((sum, [, count]) => sum + count, 0);
  }, [availableCategories]);

  // Priority counts based on active mode, domain, and category
  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    if (mode === "index") {
      for (const e of vrtIndex) {
        const matchDomain = domainFilter === "all" || e.domain === domainFilter;
        const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
        if (matchDomain && matchCategory) {
          counts.all += 1;
          counts[e.priority] = (counts[e.priority] ?? 0) + 1;
        }
      }
    } else {
      for (const g of learnGroups) {
        for (const t of g.topics) {
          const matchDomain = domainFilter === "all" || domainFilter === "web";
          const topicCat = t.mapping.bugcrowdVrt.split(" › ")[0];
          const matchCategory =
            categoryFilter === "all" ||
            topicCat.toLowerCase().includes(categoryFilter.toLowerCase()) ||
            t.mapping.bugcrowdVrt.toLowerCase().includes(categoryFilter.toLowerCase());
          if (matchDomain && matchCategory) {
            counts.all += 1;
            const p = t.mapping.bugcrowdPriority;
            counts[p] = (counts[p] ?? 0) + 1;
          }
        }
      }
    }
    return counts;
  }, [mode, domainFilter, categoryFilter]);

  // Groups with topics filtered by the active domain, category, and VRT priority
  const visibleGroups = useMemo(() => {
    if (mode === "index") return [];
    return learnGroups
      .map((g) => {
        const topics = g.topics.filter((t) => {
          const matchDomain = domainFilter === "all" || domainFilter === "web";
          const matchPriority = priorityFilter === "all" || t.mapping.bugcrowdPriority === priorityFilter;
          const topicCat = t.mapping.bugcrowdVrt.split(" › ")[0];
          const matchCategory =
            categoryFilter === "all" ||
            topicCat.toLowerCase().includes(categoryFilter.toLowerCase()) ||
            t.mapping.bugcrowdVrt.toLowerCase().includes(categoryFilter.toLowerCase());
          return matchDomain && matchPriority && matchCategory;
        });
        return { ...g, topics };
      })
      .filter((g) => g.topics.length > 0);
  }, [mode, domainFilter, priorityFilter, categoryFilter]);

  if (selected) {
    return <TopicDetail topic={selected} lang={lang} onBack={() => setSelected(null)} onPractice={onPractice} />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-100">
          <GraduationCap className="h-5 w-5 text-emerald-400" /> Learn Bug Hunting
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {learnTopicCount} topics, organized by the <span className="font-semibold text-slate-200">Bugcrowd VRT</span> (release {PLATFORM_LEGEND.vrtRelease}).
          Each topic shows what it is, how to find it today, and how Bugcrowd, HackerOne, Intigriti &amp; YesWeHack classify it — then sends you to the checklist to practice.
        </p>
      </div>

      {/* Platform & priority legend */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <button
          onClick={() => setLegendOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Info className="h-4 w-4 text-sky-400" /> How the platforms rate severity (P1–P5 &amp; CVSS)
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition ${legendOpen ? "rotate-180" : ""}`} />
        </button>
        {legendOpen && (
          <div className="space-y-4 border-t border-border px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {PLATFORM_LEGEND.priorities.map((p) => (
                <PriorityBadge key={p.id} p={p.id as VrtPriority} />
              ))}
              <span className="text-[11px] text-slate-400">P1 = Critical … P5 = Informational</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PLATFORM_LEGEND.platforms.map((pl) => (
                <div key={pl.name} className="rounded-lg border border-border/60 bg-slate-950/40 p-3">
                  <p className="text-xs font-bold text-slate-100">{pl.name}</p>
                  <p className="text-[11px] font-medium text-emerald-300">{pl.model}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{pl.detail}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Only Bugcrowd publishes a fixed taxonomy; the others score with CVSS, so a bug's band can shift with real-world impact and business context.
            </p>
          </div>
        )}
      </div>

      {/* Language: trilingual lesson content */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">🌐 Language</span>
        <div className="inline-grid grid-cols-3 gap-1 rounded-lg border border-border bg-slate-950/40 p-1">
          {LEARN_LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              title={l.label}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                lang === l.id ? "bg-sky-500/15 text-sky-300" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {l.short}
            </button>
          ))}
        </div>
      </div>

      {/* Mode: deep lessons vs the full VRT index */}
      <div className="grid w-full grid-cols-2 gap-1 rounded-lg border border-border bg-slate-950/40 p-1 sm:inline-grid sm:w-auto">
        <button
          onClick={() => setMode("lessons")}
          className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
            mode === "lessons" ? "bg-emerald-500/15 text-emerald-300" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" /> Lessons ({learnTopicCount})
        </button>
        <button
          onClick={() => setMode("index")}
          className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
            mode === "index" ? "bg-violet-500/15 text-violet-300" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Library className="h-3.5 w-3.5" /> VRT Index ({vrtIndex.length})
        </button>
      </div>

      {/* ── Unified 3-Step VRT Filter Panel ── */}
      <div className="rounded-xl border border-border bg-card/70 p-4 space-y-3.5 shadow-sm">
        {/* Step 1: Domain Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">1</span>
              Domain Section:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {domainFilter === "all" ? "All Domains" : LEARN_DOMAINS.find((d) => d.id === domainFilter)?.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleDomainChange("all")}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                domainFilter === "all"
                  ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-sm"
                  : "border-border text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              🗂️ All Domains ({mode === "lessons" ? learnTopicCount : vrtIndex.length})
            </button>
            {LEARN_DOMAINS.map((d) => {
              const n =
                mode === "lessons"
                  ? (d.id === "web" ? learnTopicCount : 0)
                  : vrtIndex.filter((e) => e.domain === d.id).length;
              if (mode === "lessons" && n === 0) return null;
              return (
                <button
                  key={d.id}
                  onClick={() => handleDomainChange(d.id)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                    domainFilter === d.id
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-sm"
                      : "border-border text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {d.emoji} {d.label} ({n})
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: VRT Category Filter */}
        <div className="space-y-1.5 pt-2.5 border-t border-border/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-500/10 text-violet-400 font-mono text-[10px]">2</span>
              VRT Category Filter:
              <span className="ml-1 text-[11px] font-normal text-slate-400">
                ({availableCategories.length} categories)
              </span>
            </span>
            {categoryFilter !== "all" && (
              <button
                onClick={() => setCategoryFilter("all")}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition underline underline-offset-2"
              >
                Reset to All Categories
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                categoryFilter === "all"
                  ? "border-violet-500/60 bg-violet-500/20 text-violet-200 shadow-sm"
                  : "border-border bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              All Categories ({totalCategoryItems})
            </button>
            {availableCategories.map(([cat, count]) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-md border px-2.5 py-1 text-xs transition flex items-center gap-1.5 ${
                    isSelected
                      ? "border-violet-500/70 bg-violet-500/25 text-violet-100 font-semibold shadow-sm"
                      : "border-border bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected ? "bg-violet-400/20 text-violet-200" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Filter by VRT priority */}
        <div className="space-y-1.5 pt-2.5 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-amber-400 font-mono text-[10px]">3</span>
              Filter by VRT Priority:
            </span>
            {priorityFilter !== "all" && (
              <button
                onClick={() => setPriorityFilter("all")}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition underline underline-offset-2"
              >
                Reset Priority
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setPriorityFilter("all")}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                priorityFilter === "all"
                  ? "border-white/20 bg-white/10 text-slate-100"
                  : "border-border text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({priorityCounts.all})
            </button>
            {(["P1", "P2", "P3", "P4", "P5", "varies"] as VrtPriority[])
              .filter((p) => priorityCounts[p])
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                    priorityFilter === p
                      ? PRIORITY_STYLES[p]
                      : "border-border text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p === "varies" ? "Varies" : p} ({priorityCounts[p]})
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Content: deep lessons or the full VRT index */}
      {mode === "index" ? (
        <VrtIndexBrowser
          domain={domainFilter}
          category={categoryFilter}
          priority={priorityFilter}
          lang={lang}
          onOpenLesson={setSelected}
          onResetFilters={handleResetFilters}
        />
      ) : visibleGroups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-slate-400">
          No topics at this VRT priority yet.
        </p>
      ) : (
        visibleGroups.map((group) => (
        <section key={group.id}>
          <div className="mb-2.5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <span>{group.emoji}</span> {group.name}
            </h2>
            <p className="text-[11px] leading-relaxed text-slate-400">{group.blurb}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.topics.map((topic) => {
              const shown = localizedTopic(topic, lang);
              return (
              <button
                key={topic.id}
                onClick={() => setSelected(shown)}
                className="group flex flex-col rounded-xl border border-border bg-card p-4 text-left transition hover:border-emerald-500/50 hover:bg-white/5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-lg">{shown.emoji}</span>
                  <PriorityBadge p={shown.mapping.bugcrowdPriority} />
                </div>
                <h3 className="text-sm font-bold text-slate-100">{shown.name}</h3>
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-slate-400">{localize(shown.intro, lang)}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  {LEARN_UI_STRINGS.learnCta[lang]} <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </span>
              </button>
              );
            })}
          </div>
        </section>
        ))
      )}
    </div>
  );
}
