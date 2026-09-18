import type { CvssMetrics } from "../lib/cvss";
import { calcCvss, cvssSeverityLabel } from "../lib/cvss";

const OPTIONS: { key: keyof CvssMetrics; label: string; choices: [string, string][] }[] = [
  { key: "av", label: "Attack Vector", choices: [["N", "Network"], ["A", "Adjacent"], ["L", "Local"], ["P", "Physical"]] },
  { key: "ac", label: "Attack Complexity", choices: [["L", "Low"], ["H", "High"]] },
  { key: "pr", label: "Privileges Req.", choices: [["N", "None"], ["L", "Low"], ["H", "High"]] },
  { key: "ui", label: "User Interaction", choices: [["N", "None"], ["R", "Required"]] },
  { key: "s", label: "Scope", choices: [["U", "Unchanged"], ["C", "Changed"]] },
  { key: "c", label: "Confidentiality", choices: [["N", "None"], ["L", "Low"], ["H", "High"]] },
  { key: "i", label: "Integrity", choices: [["N", "None"], ["L", "Low"], ["H", "High"]] },
  { key: "a", label: "Availability", choices: [["N", "None"], ["L", "Low"], ["H", "High"]] },
];

export function CvssPicker({ value, onChange }: { value: CvssMetrics; onChange: (m: CvssMetrics) => void }) {
  const { score, vector } = calcCvss(value);

  return (
    <div className="space-y-2 rounded border border-border/60 p-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-300">CVSS 3.1</p>
        <p className="text-xs">
          <span className="font-mono font-semibold text-amber-400">{score.toFixed(1)}</span>{" "}
          <span className="text-slate-500">({cvssSeverityLabel(score)})</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {OPTIONS.map((opt) => (
          <label key={opt.key} className="text-[10px] text-slate-500">
            {opt.label}
            <select
              value={value[opt.key]}
              onChange={(e) => onChange({ ...value, [opt.key]: e.target.value as never })}
              className="mt-0.5 block w-full rounded border border-border/60 bg-transparent px-1 py-0.5 text-[11px] text-slate-300 outline-none"
            >
              {opt.choices.map(([v, label]) => (
                <option key={v} value={v} className="bg-slate-900">
                  {v} — {label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="font-mono text-[10px] text-slate-600">{vector}</p>
    </div>
  );
}
