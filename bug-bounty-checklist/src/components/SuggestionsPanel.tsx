import { Sparkles, ArrowRight } from "lucide-react";
import { useActiveProfile } from "../store/useChecklistStore";
import { computeSuggestions, nextRecommendedCategory } from "../lib/suggestions";
import { getItemById } from "../data/domains";

export function SuggestionsPanel({
  onJumpToCategory,
}: {
  onJumpToCategory: (categoryId: string) => void;
}) {
  const profile = useActiveProfile();
  if (!profile) return null;

  const suggestions = computeSuggestions(profile);
  const next = nextRecommendedCategory(profile);

  if (suggestions.length === 0 && !next) return null;

  return (
    <div className="mb-4 space-y-2 rounded-lg border border-violet-600/30 bg-violet-950/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-violet-300">
        <Sparkles className="h-4 w-4" /> Suggested next steps
      </div>

      {next && (
        <button
          onClick={() => onJumpToCategory(next.category.id)}
          className="flex w-full items-center justify-between rounded-md bg-white/5 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/10"
        >
          <span>
            Continue the flow: <b>{next.category.name}</b> ({next.remaining} untested)
          </span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}

      {suggestions.map((s) => {
        const firstItem = getItemById(s.itemIds[0]);
        return (
          <button
            key={s.id}
            onClick={() => firstItem && onJumpToCategory(firstItem.category.id)}
            className="flex w-full items-center justify-between rounded-md bg-white/5 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/10"
          >
            <span>{s.reason}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
