export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type ItemStatus = "not_tested" | "clean" | "vulnerable" | "blocked";

export type Domain = "web" | "api" | "android" | "ios" | "thick_client" | "web3";

/** Tags used by the suggestion engine to link items to detected tech / related deep-dive checks. */
export interface ItemTags {
  tech?: string[]; // e.g. ["php", "aws", "nodejs"]
  relatedItemIds?: string[]; // deep-dive items to suggest when this one is marked vulnerable
  suggestOnClean?: string[]; // advanced item ids to suggest when a category is mostly clean
}

export interface ChecklistItem {
  id: string;
  text: string; // what to test (short)
  how: string; // step-by-step method
  payloads?: string[]; // ready-to-use payloads / commands
  reference?: string; // external cheatsheet/article URL
  severity: Severity;
  tags?: ItemTags;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  items: ChecklistItem[];
}

export interface ChecklistDomain {
  id: Domain;
  label: string;
  emoji: string;
  categories: ChecklistCategory[];
}

/** Per-item saved state, keyed by item id, scoped inside a target profile. */
export interface ItemState {
  status: ItemStatus;
  note?: string;
  updatedAt?: number;
}

export interface Finding {
  id: string;
  itemId: string;
  itemText: string;
  domain: Domain;
  categoryName: string;
  severity: Severity;
  title: string;
  description: string;
  createdAt: number;
}

/** A target/program profile — isolates progress + findings per bug bounty target. */
export interface TargetProfile {
  id: string;
  name: string;
  createdAt: number;
  itemStates: Record<string, ItemState>; // itemId -> state
  findings: Finding[];
}

export interface AppState {
  profiles: Record<string, TargetProfile>;
  activeProfileId: string | null;
}
