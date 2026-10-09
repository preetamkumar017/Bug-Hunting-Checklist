import { domains } from '../data/domains';
import type { ChecklistDomain, TargetProfile } from '../types/checklist';

/** A built-in category ID in customCategories stores only its extra checks. */
export function effectiveCategories(domain: ChecklistDomain, profile?: TargetProfile | null) {
  const custom = profile?.customCategories ?? [];
  return [
    ...domain.categories.map(category => {
      const extras = custom.find(c => c.id === category.id);
      return extras ? { ...category, items: [...category.items, ...extras.items] } : category;
    }),
    ...custom.filter(c => !domains.some(d => d.categories.some(base => base.id === c.id)) && (c.domainId ?? 'web') === domain.id),
  ];
}

export function effectiveCatalogue(profile?: TargetProfile | null) {
  return domains.map(domain => ({ ...domain, categories: effectiveCategories(domain, profile) }));
}
