import { getItemById, domains } from "../data/domains";
import type { TargetProfile } from "../types/checklist";

export interface Suggestion {
  id: string;
  reason: string;
  itemIds: string[];
}

/**
 * Rule-based "what should I do next" engine, driven purely by item results
 * already recorded in the active profile. No network calls — fast and offline.
 * Designed so a future LLM-backed version can slot in behind the same return type.
 */
export function computeSuggestions(profile: TargetProfile): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const states = profile.itemStates;

  // 1. Vulnerable item -> suggest its tagged related deep-dive items, if not yet tested.
  for (const [itemId, state] of Object.entries(states)) {
    if (state.status !== "vulnerable") continue;
    const found = getItemById(itemId);
    const related = found?.item.tags?.relatedItemIds ?? [];
    const untested = related.filter((id) => states[id]?.status !== "vulnerable" && states[id]?.status !== "clean");
    if (untested.length > 0) {
      suggestions.push({
        id: `related-${itemId}`,
        reason: `"${found?.item.text}" is vulnerable — try these related deep-dive checks`,
        itemIds: untested,
      });
    }
  }

  // 2. Category mostly clean -> nudge toward remaining untested items in same category.
  for (const domain of domains) {
    for (const category of domain.categories) {
      const itemIds = category.items.map((i) => i.id);
      const tested = itemIds.filter((id) => states[id]?.status && states[id]?.status !== "not_tested");
      const clean = itemIds.filter((id) => states[id]?.status === "clean");
      const untested = itemIds.filter((id) => !states[id]?.status || states[id]?.status === "not_tested");
      if (tested.length >= itemIds.length * 0.6 && clean.length >= tested.length * 0.7 && untested.length > 0) {
        suggestions.push({
          id: `finish-${category.id}`,
          reason: `${category.name} is mostly clean — finish the remaining ${untested.length} check(s) here`,
          itemIds: untested,
        });
      }
    }
  }

  // 3. Blocked items -> suggest WAF bypass category if it exists and has untested items.
  const blockedCount = Object.values(states).filter((s) => s.status === "blocked").length;
  if (blockedCount > 0) {
    const wafCategory = domains
      .find((d) => d.id === "web")
      ?.categories.find((c) => c.name.toLowerCase().includes("waf"));
    if (wafCategory) {
      const untested = wafCategory.items
        .map((i) => i.id)
        .filter((id) => !states[id]?.status || states[id]?.status === "not_tested");
      if (untested.length > 0) {
        suggestions.push({
          id: "waf-bypass",
          reason: `${blockedCount} check(s) got blocked — try WAF bypass techniques`,
          itemIds: untested,
        });
      }
    }
  }

  return suggestions;
}

/** Next recommended category in the flow: first category with untested items, in defined order. */
export function nextRecommendedCategory(profile: TargetProfile) {
  const states = profile.itemStates;
  for (const domain of domains) {
    for (const category of domain.categories) {
      const untested = category.items.filter(
        (i) => !states[i.id]?.status || states[i.id]?.status === "not_tested"
      );
      if (untested.length > 0) {
        return { domain, category, remaining: untested.length };
      }
    }
  }
  return null;
}
