import type { ChecklistDomain } from "../types/checklist";
import { webCategories } from "./web";
import { apiCategories } from "./api";
import { androidCategories } from "./android";
import { iosCategories } from "./ios";
import { thickClientCategories } from "./thickclient";
import { web3Categories } from "./web3";

export const domains: ChecklistDomain[] = [
  { id: "web", label: "Web", emoji: "🌐", categories: webCategories },
  { id: "api", label: "API", emoji: "🔌", categories: apiCategories },
  { id: "android", label: "Android", emoji: "🤖", categories: androidCategories },
  { id: "ios", label: "iOS", emoji: "🍏", categories: iosCategories },
  { id: "thick_client", label: "Thick Client", emoji: "🖥️", categories: thickClientCategories },
  { id: "web3", label: "Web3", emoji: "⛓️", categories: web3Categories },
];

export function getAllItems() {
  return domains.flatMap((d) =>
    d.categories.flatMap((c) =>
      c.items.map((item) => ({ item, category: c, domain: d }))
    )
  );
}

export function getItemById(itemId: string) {
  for (const d of domains) {
    for (const c of d.categories) {
      const item = c.items.find((i) => i.id === itemId);
      if (item) return { item, category: c, domain: d };
    }
  }
  return null;
}
