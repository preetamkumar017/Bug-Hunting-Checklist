import { useState, useEffect } from "react";
import { ChevronRight, CheckCircle2, RotateCcw, Plus, Trash2, ExternalLink } from "lucide-react";
import type { ChecklistCategory, ChecklistDomain } from "../types/checklist";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import { categoryProgress } from "../lib/progress";
import { AddCustomItemModal } from "./AddCustomItemModal";

export function CategorySection({
  category,
  domain,
  index,
  defaultOpen = false,
  jumpSequence,
  filtered = false,
}: {
  category: ChecklistCategory;
  domain: ChecklistDomain;
  index?: number;
  defaultOpen?: boolean;
  jumpSequence?: number;
  filtered?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [dismissedJump, setDismissedJump] = useState<number | undefined>();
  const expanded = open || (jumpSequence !== undefined && jumpSequence !== dismissedJump);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const profile = useActiveProfile();
  const markCategoryStatus = useChecklistStore((s) => s.markCategoryStatus);
  const deleteCustomCategory = useChecklistStore((s) => s.deleteCustomCategory);

  useEffect(() => {
    if (jumpSequence !== undefined) document.getElementById(category.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [category.id, jumpSequence]);

  const { done, total } = profile
    ? categoryProgress(category, profile)
    : { done: 0, total: category.items.length };

  const itemIds = category.items.map((i) => i.id);

  function handleMarkAllClean(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Mark ${category.items.length} ${filtered ? 'shown' : ''} checks in "${category.name}" as Clean?`)) {
      markCategoryStatus(itemIds, "clean");
    }
  }

  function handleResetCategory(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Reset ${category.items.length} ${filtered ? 'shown' : ''} checks in "${category.name}" to Not Tested?`)) {
      markCategoryStatus(itemIds, "not_tested");
    }
  }

  return (
    <>
      <div id={category.id} className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
        <div
          className="flex cursor-pointer items-center justify-between gap-2 px-3 py-3 hover:bg-white/[0.02] sm:gap-3 sm:px-4 select-none"
        >
          <button type="button" aria-expanded={expanded} aria-controls={`${category.id}-items`} onClick={() => { setOpen(!expanded); setDismissedJump(jumpSequence); }} className="flex min-w-0 items-center gap-2 text-left">
            <ChevronRight
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
            {index !== undefined && (
              <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                {String(index).padStart(2, "0")}
              </span>
            )}
            <span className="shrink-0">{category.emoji || "📋"}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-slate-200">
                  {category.name}
                </span>
                {category.isCustom && (
                  <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                    Custom
                  </span>
                )}
              </div>
              {category.description && (
                <p className="hidden sm:block truncate text-[11px] text-slate-500">
                  {category.description}
                </p>
              )}
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Bulk Action Buttons on hover/mobile */}
            <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleMarkAllClean}
                title="Mark all items clean"
                className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-emerald-400/80 hover:bg-emerald-950/30 hover:text-emerald-300"
              >
                <CheckCircle2 className="h-3 w-3" />
                Clean
              </button>
              <button
                onClick={handleResetCategory}
                title="Reset category to not tested"
                className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-slate-500 hover:bg-white/5 hover:text-slate-300"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <button
                onClick={() => setAddModalOpen(true)}
                title="Add custom check to this category"
                className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-slate-400 hover:bg-white/5 hover:text-slate-200"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              {category.isCustom && (
                <button
                  onClick={() => {
                    if (confirm(`Delete custom category "${category.name}"?`)) {
                      deleteCustomCategory(category.id);
                    }
                  }}
                  title="Delete category"
                  className="rounded p-1 text-red-400/70 hover:bg-red-950/30 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500 font-mono">
              {done}/{total}{filtered ? ' shown' : ''}
            </span>
            <div className="h-1.5 w-10 overflow-hidden rounded-full bg-white/5 sm:w-16">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>

        {expanded && (
          <div id={`${category.id}-items`} className="border-t border-border/50">
            {filtered && <p className="px-4 py-2 text-xs text-slate-400">Counts and bulk actions apply only to the checks shown by this filter.</p>}
            {category.reference && (
              <div className="bg-slate-900/40 px-4 py-1.5 flex items-center justify-between text-[11px] border-b border-border/40">
                <span className="text-slate-400 truncate">{category.description}</span>
                <a
                  href={category.reference}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-400/80 hover:text-emerald-300 shrink-0 ml-2"
                >
                  Guide <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            )}

            {category.items.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No items in this category. Click &quot;+&quot; to add a check.
              </div>
            ) : (
              category.items.map((item, itemIdx) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  category={category}
                  domain={domain}
                  itemIndex={itemIdx + 1}
                />
              ))
            )}

            {/* Mobile friendly Add Check & Bulk Bar */}
            <div className="sm:hidden flex items-center justify-between border-t border-border/40 bg-slate-900/30 px-3 py-2 text-xs">
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-1 text-slate-300"
              >
                <Plus className="h-3.5 w-3.5 text-emerald-400" /> Add check
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllClean}
                  className="text-emerald-400 text-[11px]"
                >
                  Mark clean
                </button>
                <button
                  onClick={handleResetCategory}
                  className="text-slate-500 text-[11px]"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {addModalOpen && <AddCustomItemModal
        categoryId={category.id}
        categoryName={category.name}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />}
    </>
  );
}
