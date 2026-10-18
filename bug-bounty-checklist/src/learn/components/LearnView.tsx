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
} from "lucide-react";
import {
  learnGroups,
  learnTopicCount,
  PLATFORM_LEGEND,
  type LearnTopic,
  type VrtPriority,
} from "@/learn/data/learn";
import { LEARN_DOMAINS, type AppLearnDomain, type VrtIndexEntry } from "@/learn/data/types";
import { vrtIndex } from "@/learn/data/vrtIndex";

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

function TopicDetail({ topic, onBack, onPractice }: { topic: LearnTopic; onBack: () => void; onPractice: (id: string) => void }) {
  const m = topic.mapping;
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to all topics
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
            Practice on checklist <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Intro */}
      <section>
        <h2 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-100">
          <BookOpen className="h-4 w-4 text-emerald-400" /> What it is &amp; why it pays
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">{topic.intro}</p>
      </section>

      {/* How to find */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-slate-100">🔍 How to find it</h2>
        <div className="space-y-3">
          {topic.howToFind.map((method, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <p className="mb-1.5 text-xs font-semibold text-emerald-300">{method.title}</p>
              <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-300">
                {method.steps.map((s, j) => (
                  <li key={j}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Payloads */}
      {topic.payloads && topic.payloads.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-100">⚡ Starter payloads</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-slate-950/60">
            {topic.payloads.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 last:border-b-0">
                <code className="min-w-0 break-all font-mono text-[11px] text-amber-200">{p}</code>
                <CopyButton text={p} />
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">Use only against in-scope assets. Prove impact with benign markers / OOB callbacks — never touch real data.</p>
        </section>
      )}

      {/* Example */}
      {topic.example && (
        <section>
          <h2 className="mb-1.5 text-sm font-bold text-slate-100">💡 Real-world example</h2>
          <p className="rounded-lg border border-sky-500/20 bg-sky-950/15 p-3 text-xs leading-relaxed text-slate-300">
            {topic.example}
          </p>
        </section>
      )}

      {/* Platform mapping */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-100">
          <Target className="h-4 w-4 text-violet-400" /> Platform classification
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
                <td className="px-3 py-2 text-slate-300">CVSS-based · typically <span className="font-semibold text-slate-200">{m.cvssSeverity}</span></td>
              </tr>
              {m.note && (
                <tr className="bg-amber-950/10">
                  <th className="px-3 py-2 align-top font-semibold text-amber-400">Scoring note</th>
                  <td className="px-3 py-2 text-amber-200/90">{m.note}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* References */}
      {topic.references && topic.references.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-100">📚 Learn more</h2>
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
  priority,
  lessonFor,
  onOpenLesson,
}: {
  priority: VrtPriority | "all";
  lessonFor: (entry: VrtIndexEntry) => LearnTopic | undefined;
  onOpenLesson: (topic: LearnTopic) => void;
}) {
  const [domain, setDomain] = useState<AppLearnDomain>("web");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vrtIndex.filter(
      (e) =>
        e.domain === domain &&
        (priority === "all" || e.priority === priority) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          e.path.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)),
    );
  }, [domain, priority, query]);

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
      {/* Domain pills */}
      <div className="flex flex-wrap gap-1.5">
        {LEARN_DOMAINS.map((d) => {
          const n = vrtIndex.filter((e) => e.domain === d.id).length;
          return (
            <button
              key={d.id}
              onClick={() => setDomain(d.id)}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                domain === d.id
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                  : "border-border text-slate-400 hover:text-slate-200"
              }`}
            >
              {d.emoji} {d.label} ({n})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search VRT entries…"
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-emerald-500"
        />
      </div>

      <p className="text-[11px] text-slate-500">
        {rows.length} entries · Bugcrowd VRT {PLATFORM_LEGEND.vrtRelease} · deep lessons linked where available
      </p>

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
                const lesson = lessonFor(e);
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
                    {lesson && (
                      <button
                        onClick={() => onOpenLesson(lesson)}
                        className="inline-flex shrink-0 items-center gap-1 rounded border border-emerald-500/30 px-2 py-0.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-950/30"
                      >
                        Lesson <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
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
  const [priorityFilter, setPriorityFilter] = useState<VrtPriority | "all">("all");

  // Link a VRT index entry to a deep lesson in the same VRT category (exact leaf
  // match if one exists, otherwise the category's representative lesson).
  const lessonFor = useMemo(() => {
    const flat = learnGroups.flatMap((g) => g.topics.map((t) => ({ t, vrt: t.mapping.bugcrowdVrt })));
    return (entry: VrtIndexEntry): LearnTopic | undefined => {
      const sameCat = flat.filter((x) => x.vrt.startsWith(entry.category));
      return (sameCat.find((x) => x.vrt.includes(entry.name)) ?? sameCat[0])?.t;
    };
  }, []);

  // Priority pill counts reflect the active mode's dataset.
  const counts: Record<string, number> = { all: 0 };
  if (mode === "lessons") {
    for (const g of learnGroups) {
      for (const t of g.topics) {
        counts.all += 1;
        const p = t.mapping.bugcrowdPriority;
        counts[p] = (counts[p] ?? 0) + 1;
      }
    }
  } else {
    for (const e of vrtIndex) {
      counts.all += 1;
      counts[e.priority] = (counts[e.priority] ?? 0) + 1;
    }
  }

  // Groups with topics filtered by the active VRT priority (empty groups dropped).
  const visibleGroups =
    priorityFilter === "all"
      ? learnGroups
      : learnGroups
          .map((g) => ({ ...g, topics: g.topics.filter((t) => t.mapping.bugcrowdPriority === priorityFilter) }))
          .filter((g) => g.topics.length > 0);

  if (selected) {
    return <TopicDetail topic={selected} onBack={() => setSelected(null)} onPractice={onPractice} />;
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

      {/* VRT priority filter (shared across both modes) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium text-slate-400">Filter by VRT priority:</span>
        <button
          onClick={() => setPriorityFilter("all")}
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
            priorityFilter === "all"
              ? "border-white/20 bg-white/10 text-slate-100"
              : "border-border text-slate-400 hover:text-slate-200"
          }`}
        >
          All ({counts.all})
        </button>
        {(["P1", "P2", "P3", "P4", "P5", "varies"] as VrtPriority[])
          .filter((p) => counts[p])
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
              {p === "varies" ? "Varies" : p} ({counts[p]})
            </button>
          ))}
      </div>

      {/* Content: deep lessons or the full VRT index */}
      {mode === "index" ? (
        <VrtIndexBrowser priority={priorityFilter} lessonFor={lessonFor} onOpenLesson={setSelected} />
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
            {group.topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelected(topic)}
                className="group flex flex-col rounded-xl border border-border bg-card p-4 text-left transition hover:border-emerald-500/50 hover:bg-white/5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-lg">{topic.emoji}</span>
                  <PriorityBadge p={topic.mapping.bugcrowdPriority} />
                </div>
                <h3 className="text-sm font-bold text-slate-100">{topic.name}</h3>
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-slate-400">{topic.intro}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  Learn <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
        </section>
        ))
      )}
    </div>
  );
}
