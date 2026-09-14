import type { Severity } from "../types/checklist";

const styles: Record<Severity, string> = {
  critical: "bg-red-600/15 text-red-500 border-red-600/30",
  high: "bg-orange-600/15 text-orange-500 border-orange-600/30",
  medium: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  low: "bg-blue-600/15 text-blue-500 border-blue-600/30",
  info: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}
