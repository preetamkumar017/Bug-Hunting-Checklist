import type { ItemStatus } from "../types/checklist";

const options: { value: ItemStatus; label: string; className: string }[] = [
  { value: "not_tested", label: "Not Tested", className: "text-slate-400 border-slate-600" },
  { value: "clean", label: "Clean", className: "text-emerald-400 border-emerald-600" },
  { value: "vulnerable", label: "Vulnerable", className: "text-red-400 border-red-600" },
  { value: "blocked", label: "Blocked / N/A", className: "text-slate-400 border-slate-600" },
];

export function StatusSelect({
  value,
  onChange,
}: {
  value: ItemStatus;
  onChange: (v: ItemStatus) => void;
}) {
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
