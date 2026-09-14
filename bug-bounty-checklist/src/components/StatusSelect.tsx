import type { ItemStatus, Severity } from "../types/checklist";

const standardOptions: { value: ItemStatus; label: string; className: string }[] = [
  { value: "not_tested", label: "Not Tested", className: "text-slate-400 border-slate-600" },
  { value: "clean", label: "Clean", className: "text-emerald-400 border-emerald-600" },
  { value: "vulnerable", label: "Vulnerable", className: "text-red-400 border-red-600" },
  { value: "blocked", label: "Blocked / N/A", className: "text-slate-400 border-slate-600" },
];

// Info-severity items are usually recon/discovery steps (e.g. "enumerate subdomains") —
// "Vulnerable" reads oddly there, so use recon-flavored labels on the same underlying status values.
const reconOptions: { value: ItemStatus; label: string; className: string }[] = [
  { value: "not_tested", label: "Not Done", className: "text-slate-400 border-slate-600" },
  { value: "clean", label: "Done", className: "text-emerald-400 border-emerald-600" },
  { value: "vulnerable", label: "Found Something", className: "text-red-400 border-red-600" },
  { value: "blocked", label: "Blocked / N/A", className: "text-slate-400 border-slate-600" },
];

export function StatusSelect({
  value,
  onChange,
  severity,
}: {
  value: ItemStatus;
  onChange: (v: ItemStatus) => void;
  severity?: Severity;
}) {
  const options = severity === "info" ? reconOptions : standardOptions;
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ItemStatus)}
      className={`rounded border bg-transparent px-2 py-1 text-xs font-medium outline-none ${current.className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-slate-900 text-slate-200">
          {o.label}
        </option>
      ))}
    </select>
  );
}
