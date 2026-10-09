import type { ChecklistCategory, ChecklistDomain, ChecklistItem, TestingMethod } from "../types/checklist";
import { createItemMethod, resolveItemPlaybookStrategy } from "./playbookStrategies";
import { getCuratedItemMethod } from "./playbookRecipes";
export { getCuratedItemMethod, auditRecipeRoutes, playbookRecipeRoutes } from "./playbookRecipes";
export { resolvePlaybookStrategy, resolveItemPlaybookStrategy } from "./playbookStrategies";

/** Explicit content wins. Names and payload substrings never select an attack. */
export function getItemPlaybook(item: ChecklistItem, category: ChecklistCategory, domain: ChecklistDomain): { methods: TestingMethod[] } {
  const fallback = createItemMethod(item, category, domain.id);
  const curated = getCuratedItemMethod(item, category, domain.id);
  // Authored/user methods stay authoritative. A recipe supplements the baseline only
  // for a reviewed exact catalogue tuple, never an unknown/custom keyword match.
  const methods = item.methods?.length ? item.methods : curated ? [fallback, curated] : [fallback];
  return { methods: methods.map(method => ({
    ...method,
    verification: method.verification ?? "needs_adaptation",
    expectedResponse: method.expectedResponse ?? item.expectedResponse ?? fallback.expectedResponse,
    prerequisites: method.prerequisites ?? fallback.prerequisites,
    evidence: method.evidence ?? fallback.evidence,
    limitations: method.limitations ?? fallback.limitations,
    safety: method.safety ?? fallback.safety,
    references: method.references ?? fallback.references,
  })) };
}
export function classifyItemPlaybook(item: ChecklistItem, category: ChecklistCategory, domain: ChecklistDomain) {
  const strategy = resolveItemPlaybookStrategy(item, category, domain.id);
  const methods = getItemPlaybook(item, category, domain).methods;
  return {
    itemId: item.id, categoryId: category.id, domainId: domain.id,
    source: item.methods?.length ? "explicit" as const : strategy.categoryMatched && !item.isCustom && !category.isCustom ? "category" as const : "adaptation" as const,
    strategy: strategy.id, methodCount: methods.length, verification: methods.map(method => method.verification),
    hasExpectedResults: methods.every(method => !!method.expectedResponse), hasEvidence: methods.every(method => !!method.evidence?.length),
  };
}
/** Full inventory; fallback and unverified entries remain visible. */
export function auditPlaybookCoverage(domains: ChecklistDomain[]) {
  return domains.flatMap(domain => domain.categories.flatMap(category => category.items.map(item => classifyItemPlaybook(item, category, domain))));
}
