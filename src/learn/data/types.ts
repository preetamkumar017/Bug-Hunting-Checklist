// Shared contract for the Learn platform content.
//
// The backbone is Bugcrowd's Vulnerability Rating Taxonomy (VRT), release
// 2026-07-08 (github.com/bugcrowd/vulnerability-rating-taxonomy). Priorities
// (P1 = Critical … P5 = Informational) and the default CVSS v3.1 base vectors
// are copied from that published taxonomy, NOT invented.
//
// Each topic carries the Bugcrowd VRT path + priority, the CWE id HackerOne
// uses, and the CVSS-derived severity band the CVSS-based platforms land on.

export type VrtPriority = "P1" | "P2" | "P3" | "P4" | "P5" | "varies";

// ── Localization ──────────────────────────────────────────────────────────
// Lesson text can be a plain string (English only) or a trilingual object.
// Plain strings keep every existing hand-written lesson valid; the generator
// and newer lessons fill all three languages.
export type Lang = "en" | "simple" | "hi";
export type Localized = string | { en: string; simple?: string; hi?: string };

/** Resolve a Localized value to one language, degrading gracefully. */
export function localize(value: Localized | undefined, lang: Lang): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (lang === "simple") return value.simple ?? value.en;
  if (lang === "hi") return value.hi ?? value.simple ?? value.en;
  return value.en;
}

export const LEARN_LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "en", label: "Advanced English", short: "EN" },
  { id: "simple", label: "Simple English", short: "Simple" },
  { id: "hi", label: "हिंदी", short: "हिंदी" },
];

/** UI chrome strings for the Learn detail view, per language. */
export const LEARN_UI_STRINGS: Record<
  "back" | "whatItIs" | "howToFind" | "payloads" | "payloadsNote" | "example" | "classification" | "scoringNote" | "learnMore" | "practice" | "intigriti" | "learnCta" | "lessonCta" | "pending",
  Record<Lang, string>
> = {
  back: { en: "Back to all topics", simple: "Back to all topics", hi: "सभी टॉपिक पर वापस" },
  whatItIs: { en: "What it is & why it pays", simple: "What it is & why it pays", hi: "यह क्या है और पैसे क्यों देता है" },
  howToFind: { en: "How to find it", simple: "How to find it", hi: "इसे कैसे ढूंढें" },
  payloads: { en: "Starter payloads", simple: "Starter payloads", hi: "शुरुआती पेलोड" },
  payloadsNote: {
    en: "Use only against in-scope assets. Prove impact with benign markers / OOB callbacks — never touch real data.",
    simple: "Only use on targets that are in scope. Prove the bug with safe markers — never touch real data.",
    hi: "सिर्फ़ scope वाले targets पर इस्तेमाल करें। impact safe markers / OOB callbacks से साबित करें — असली data कभी न छुएं।",
  },
  example: { en: "Real-world example", simple: "Real-world example", hi: "असल दुनिया का उदाहरण" },
  classification: { en: "Platform classification", simple: "Platform classification", hi: "प्लेटफ़ॉर्म वर्गीकरण" },
  scoringNote: { en: "Scoring note", simple: "Scoring note", hi: "स्कोरिंग नोट" },
  learnMore: { en: "Learn more", simple: "Learn more", hi: "और सीखें" },
  practice: { en: "Practice on checklist", simple: "Practice on checklist", hi: "चेकलिस्ट पर अभ्यास करें" },
  intigriti: { en: "typically", simple: "usually", hi: "आम तौर पर" },
  learnCta: { en: "Learn", simple: "Learn", hi: "सीखें" },
  lessonCta: { en: "Lesson", simple: "Lesson", hi: "लेसन" },
  pending: {
    en: "Detailed hunting steps for this exact VRT leaf are not written yet. Only the verified classification below is shown — nothing here is guessed.",
    simple: "Step-by-step hunting notes for this exact item are not written yet. Below you only see the checked facts — nothing is guessed.",
    hi: "इस exact VRT leaf के detailed hunting steps अभी लिखे नहीं गए हैं। नीचे सिर्फ़ verified classification दिख रही है — कुछ भी अंदाज़े से नहीं लिखा।",
  },
};

export interface PlatformMapping {
  /** Bugcrowd VRT path, e.g. "Server-Side Injection › SQL Injection". */
  bugcrowdVrt: string;
  bugcrowdPriority: VrtPriority;
  /** Default CVSS v3.1 base vector from the VRT, when the leaf defines one. */
  bugcrowdCvss?: string;
  /** CWE id + title — the weakness HackerOne (and NVD) classify under. */
  hackeroneCwe: string;
  /** Severity band the CVSS-based platforms (Intigriti/YesWeHack/H1) typically land on. */
  cvssSeverity: string;
  /** Nuance a one-line band can't capture (what pushes it up or down). */
  note?: Localized;
}

export interface LearnMethod {
  title: Localized;
  steps: Localized[];
}

export interface LearnTopic {
  id: string;
  name: string;
  emoji: string;
  /** Advanced orientation: the mechanism and the edge that makes it findable/escalatable. */
  intro: Localized;
  /** Current (2025-era) ways to find it. Multiple options where they exist. */
  howToFind: LearnMethod[];
  payloads?: string[];
  /** A concrete, realistic example of the bug landing. */
  example?: Localized;
  mapping: PlatformMapping;
  /** Web checklist category id to open from "Practice on checklist". */
  checklistCategoryId?: string;
  /** Generated lesson whose per-leaf content is not written yet (verified facts only). */
  pending?: boolean;
  references?: { label: string; url: string }[];
}

/**
 * Per-leaf lesson content for a VRT entry that has no hand-written deep lesson.
 * Lives in src/learn/data/topics/*.ts, keyed by the FULL VRT path
 * ("Category › Subcategory › Leaf"). Every text field is trilingual.
 * Priority, CVSS and the official CWE are NOT stored here — they come from the
 * VRT index / vrtCwe so they can never drift from the published taxonomy.
 */
export interface TopicContent {
  /** The mechanism of THIS leaf: what is broken and why it is a security issue (2–4 sentences). */
  what: Localized;
  /** Concrete ways to find this specific leaf (1–2 methods, 2–4 steps each). */
  find: LearnMethod[];
  /** What evidence triage needs for this leaf, and what makes it N/A / out of scope. */
  proof: Localized;
  /** How it moves to a neighbouring VRT leaf/priority — only where the VRT itself supports it. */
  escalate?: Localized;
  /** "CWE-xxx: Name" — only for leaves absent from Bugcrowd's official CWE mapping. */
  cwe?: string;
  references?: { label: string; url: string }[];
}

export interface LearnGroup {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  topics: LearnTopic[];
}

// ── VRT reference index (auto-generated from the full Bugcrowd VRT) ────────────
// Covers every in-domain VRT entry across all priorities, so the platform spans
// all domains even where no deep lesson exists yet. Deep lessons link in by name.

export type AppLearnDomain = "web" | "mobile" | "web3" | "cloud" | "ai" | "network" | "thick-client";

export interface VrtIndexEntry {
  id: string;
  /** Leaf name of the VRT entry. */
  name: string;
  /** Top-level VRT category name. */
  category: string;
  /** Full path "Category › Subcategory › Leaf". */
  path: string;
  priority: VrtPriority;
  /** Default CVSS v3.1 base vector, when the VRT leaf defines one. */
  cvss?: string;
  domain: AppLearnDomain;
}

export const LEARN_DOMAINS: { id: AppLearnDomain; label: string; emoji: string }[] = [
  { id: "web", label: "Web & API", emoji: "🌐" },
  { id: "mobile", label: "Mobile", emoji: "📱" },
  { id: "web3", label: "Web3", emoji: "⛓️" },
  { id: "cloud", label: "Cloud", emoji: "☁️" },
  { id: "ai", label: "AI", emoji: "🤖" },
  { id: "network", label: "Network & AD", emoji: "🖥️" },
  { id: "thick-client", label: "Thick Client", emoji: "💽" },
];

export const PLATFORM_LEGEND = {
  vrtRelease: "2026-07-08",
  priorities: [
    { id: "P1", label: "P1 — Critical", color: "rose" },
    { id: "P2", label: "P2 — High", color: "amber" },
    { id: "P3", label: "P3 — Medium", color: "sky" },
    { id: "P4", label: "P4 — Low", color: "emerald" },
    { id: "P5", label: "P5 — Informational", color: "slate" },
    { id: "varies", label: "Varies — depends on impact/variant", color: "slate" },
  ],
  platforms: [
    {
      name: "Bugcrowd",
      model: "VRT (Vulnerability Rating Taxonomy)",
      detail:
        "The only platform with a published, versioned taxonomy. Maps each bug variant to a fixed priority P1–P5 with a default CVSS v3.1 vector. This app uses VRT release 2026-07-08.",
    },
    {
      name: "HackerOne",
      model: "CWE weakness + CVSS",
      detail:
        "Replaced its old 18 vulnerability types with a CWE-based weakness list. Reporters pick a CWE; severity is set with the CVSS calculator.",
    },
    {
      name: "Intigriti",
      model: "CVSS v3 (v4 optional) + business-impact modifier",
      detail:
        "CVSS is the baseline. A business-impact modifier can downgrade by at most one band, or upgrade to any band, and is disclosed to the researcher.",
    },
    {
      name: "YesWeHack",
      model: "CVSS v3.1",
      detail: "Severity is driven by the CVSS v3.1 base score agreed at triage.",
    },
  ],
};
