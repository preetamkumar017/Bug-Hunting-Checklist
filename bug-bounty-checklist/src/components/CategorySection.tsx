import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { ChecklistCategory, ChecklistDomain } from "../types/checklist";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { useActiveProfile } from "../store/useChecklistStore";
import { categoryProgress } from "../lib/progress";

export function CategorySection({
  category,
  domain,
  defaultOpen = false,
}: {
  category: ChecklistCategory;
  domain: ChecklistDomain;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const profile = useActiveProfile();
  const { done, total } = profile
    ? categoryProgress(category, profile)
    : { done: 0, total: category.items.length };

  return (
    <div id={category.id} className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-90" : ""}`} />
          <span>{category.emoji}</span>
          <span className="text-sm font-semibold text-slate-200">{category.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {done}/{total}
          </span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-emerald-500"
              style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </button>
      {open && (
        <div>
          {category.items.map((item) => (
            <ChecklistItemRow key={item.id} item={item} category={category} domain={domain} />
          ))}
        </div>
      )}
    </div>
  );
}
