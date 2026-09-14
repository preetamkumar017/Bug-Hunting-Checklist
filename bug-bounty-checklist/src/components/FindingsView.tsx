import { Trash2 } from "lucide-react";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import { SeverityBadge } from "./SeverityBadge";

export function FindingsView() {
  const profile = useActiveProfile();
  const removeFinding = useChecklistStore((s) => s.removeFinding);

  function exportMarkdown() {
    if (!profile || profile.findings.length === 0) return;
    const md = [
      `# Findings — ${profile.name}`,
      "",
      ...profile.findings.map(
        (f) =>
          `## ${f.title}\n\n- **Severity:** ${f.severity}\n- **Domain:** ${f.domain}\n- **Category:** ${f.categoryName}\n- **Check:** ${f.itemText}\n\n${f.description}\n`
      ),
    ].join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, "_")}_findings.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!profile) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Findings — {profile.name}</h2>
        {profile.findings.length > 0 && (
          <button
            onClick={exportMarkdown}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            Export as Markdown report
          </button>
        )}
      </div>

      {profile.findings.length === 0 ? (
        <p className="text-sm text-slate-500">
          No findings yet. Mark a checklist item as "Vulnerable" to record one.
        </p>
      ) : (
        <div className="space-y-3">
          {profile.findings.map((f) => (
            <div key={f.id} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{f.title}</h3>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={f.severity} />
                  <button
                    onClick={() => removeFinding(f.id)}
                    className="text-slate-500 hover:text-red-400"
                    aria-label="Delete finding"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mb-2 text-[11px] text-slate-500">
                {f.domain} · {f.categoryName} · {f.itemText}
              </p>
              {f.description && <p className="text-xs text-slate-400">{f.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
