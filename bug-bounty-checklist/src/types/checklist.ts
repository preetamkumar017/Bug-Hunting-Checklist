export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type ItemStatus = "not_tested" | "clean" | "vulnerable" | "blocked";

export type Domain = "web" | "api" | "cloud" | "ai" | "android" | "ios" | "thick_client" | "web3" | "network_ad" | "binary_re" | "soc_forensics";

/** Tags used by the suggestion engine to link items to detected tech / related deep-dive checks. */
export interface ItemTags {
  tech?: string[]; // e.g. ["php", "aws", "nodejs"]
  relatedItemIds?: string[]; // deep-dive items to suggest when this one is marked vulnerable
  suggestOnClean?: string[]; // advanced item ids to suggest when a category is mostly clean
}

/** What to look for in the response, mapped to a verdict. */
export interface ExpectedResponse {
  vulnerable: string; // response/behavior that indicates the target IS vulnerable
  safe: string; // response/behavior that indicates the target is NOT vulnerable (properly protected)
}

export interface TestingMethod {
  id?: string;
  title: string;
  scenario?: string; // Where this method applies
  tools?: string[]; // e.g. ["Burp Suite", "Caido", "Curl", "DevTools"]
  steps: string[]; // Step-by-step testing instructions
  payloads?: string[];
  tips?: string;
}

export interface UseCaseScenario {
  title: string;
  description: string;
  targetContext?: string; // e.g. "User Settings, Invoices, Reset Password, API Webhooks"
  impactExample?: string; // Realistic impact description
}

export interface TargetAsset {
  id: string;
  host: string; // e.g. "api.target.com"
  type?: "domain" | "subdomain" | "ip" | "api" | "mobile_app" | "repo";
  status?: string; // e.g. "200 OK", "403 Forbidden", "Takeover Risk", "Unresolved"
  tech?: string[]; // e.g. ["Cloudflare", "Next.js", "AWS"]
  ports?: string; // e.g. "80, 443, 8443"
  notes?: string;
  updatedAt: number;
}

export interface ChecklistItem {
  id: string;
  text: string; // what to test (short)
  how: string; // step-by-step method
  payloads?: string[]; // ready-to-use payloads / commands
  payloadNotes?: string[]; // one explanation per payloads[] entry (same order/length) — what that command/payload does
  expectedResponse?: ExpectedResponse; // how to read the result: vulnerable vs safe
  reference?: string; // external cheatsheet/article URL
  severity: Severity;
  tags?: ItemTags;
  isCustom?: boolean;
  methods?: TestingMethod[]; // Multiple testing methods
  useCases?: UseCaseScenario[]; // Real-world use cases & attack scenarios
  cweId?: string; // e.g. "CWE-79", "CWE-639", "CWE-918"
  owaspCategory?: string; // e.g. "A01:2021-Broken Access Control"
  remediation?: string; // Secure coding patch & fix advice
  recommendedTools?: string[]; // e.g. ["Burp Suite", "Autorize", "Turbo Intruder"]
  bountyPotential?: "critical" | "high" | "medium" | "low";
}

export interface ChecklistCategory {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  /** Fallback reference link used by items in this category that don't set their own. */
  reference?: string;
  items: ChecklistItem[];
  domainId?: Domain;
  isCustom?: boolean;
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
  bookmarked?: boolean;
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
  cvss?: { vector: string; score: number };
  screenshots?: string[]; // base64 data URLs, stored locally
  cweId?: string;
  owaspCategory?: string;
  remediation?: string;
}

export interface TargetScope {
  inScope: string;
  outOfScope: string;
  programPolicy: string;
  bountyTier?: string;
}

/** A target/program profile — isolates progress + findings per bug bounty target. */
export interface TargetProfile {
  id: string;
  name: string;
  createdAt: number;
  itemStates: Record<string, ItemState>; // itemId -> state
  findings: Finding[];
  scope?: TargetScope;
  scratchpad?: string; // Persistent markdown notes, credentials, and test scratchpad
  assets?: TargetAsset[]; // Subdomain & asset inventory
  customCategories?: ChecklistCategory[];
}

export interface AppState {
  profiles: Record<string, TargetProfile>;
  activeProfileId: string | null;
}


