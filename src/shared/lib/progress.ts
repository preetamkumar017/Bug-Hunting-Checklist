import type { ChecklistCategory, ChecklistDomain, TargetProfile } from "@/shared/types/checklist";
import { effectiveCategories } from '@/shared/lib/catalogue';

export function categoryProgress(category: ChecklistCategory, profile: TargetProfile) {
  const total = category.items.length;
  const done = category.items.filter((i) => {
    const st = profile.itemStates[i.id]?.status;
    return st === "clean" || st === "vulnerable";
  }).length;
  return { done, total };
}

export function domainProgress(domain: ChecklistDomain, profile: TargetProfile) {
  const items = effectiveCategories(domain, profile).flatMap((c) => c.items);
  const total = items.length;
  const done = items.filter((i) => {
    const st = profile.itemStates[i.id]?.status;
    return st === "clean" || st === "vulnerable";
  }).length;
  return { done, total };
}
