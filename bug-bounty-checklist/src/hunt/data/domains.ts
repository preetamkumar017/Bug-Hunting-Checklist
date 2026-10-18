import type { ChecklistDomain } from "@/shared/types/checklist";
import { webCategories } from "@/hunt/data/web";
import { apiCategories } from "@/hunt/data/api";
import { cloudCategories } from "@/hunt/data/cloud";
import { aiCategories } from "@/hunt/data/ai";
import { androidCategories } from "@/hunt/data/android";
import { iosCategories } from "@/hunt/data/ios";
import { thickClientCategories } from "@/hunt/data/thickclient";
import { web3Categories } from "@/hunt/data/web3";
import { networkAdCategories } from "@/hunt/data/networkAd";
import { binarySafetyCategories } from "@/hunt/data/binarySafety";
import { socForensicsCategories } from "@/hunt/data/socForensics";

export const domains: ChecklistDomain[] = [
  { id: "web", label: "Web", emoji: "🌐", categories: webCategories },
  { id: "api", label: "API", emoji: "🔌", categories: apiCategories },
  { id: "cloud", label: "Cloud & CI/CD", emoji: "☁️", categories: cloudCategories },
  { id: "ai", label: "AI & LLM", emoji: "🤖", categories: aiCategories },
  { id: "network_ad", label: "Network & Active Directory", emoji: "🏢", categories: networkAdCategories },
  { id: "binary_re", label: "Binary & Memory Safety", emoji: "🧩", categories: binarySafetyCategories },
  { id: "soc_forensics", label: "SOC & Threat Hunting", emoji: "🛡️", categories: socForensicsCategories },
  { id: "android", label: "Android", emoji: "📱", categories: androidCategories },
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
