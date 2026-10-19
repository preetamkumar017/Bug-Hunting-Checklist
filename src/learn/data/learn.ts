// Learn platform content aggregator.
//
// Type contract + platform legend live in ./types. Advanced, P3/P4-focused
// content lives in per-group files under ./groups (each exports one LearnGroup).
// This file assembles them in learning order into the learnGroups array the UI
// renders, and re-exports the shared contract so consumers import from here.

import type { LearnGroup, LearnTopic, VrtIndexEntry, Lang } from "@/learn/data/types";
import { buildGeneratedLesson, fullVrtPath } from "@/learn/data/generated";
import { vrtIndex } from "@/learn/data/vrtIndex";
import { accessControlGroup } from "@/learn/data/groups/access-control";
import { authenticationGroup } from "@/learn/data/groups/authentication";
import { injectionGroup } from "@/learn/data/groups/injection";
import { xssGroup } from "@/learn/data/groups/xss";
import { ssrfRedirectGroup } from "@/learn/data/groups/ssrf-redirect";
import { csrfCorsGroup } from "@/learn/data/groups/csrf-cors";
import { serverMisconfigGroup } from "@/learn/data/groups/server-misconfig";
import { infoExposureGroup } from "@/learn/data/groups/info-exposure";
import { LEAF_BOUNTY_TIPS } from "@/learn/data/leafBountyTips";

export type { LearnGroup, LearnTopic, LearnMethod, PlatformMapping, VrtPriority } from "@/learn/data/types";
export { PLATFORM_LEGEND } from "@/learn/data/types";

export const learnGroups: LearnGroup[] = [
  accessControlGroup,
  authenticationGroup,
  injectionGroup,
  xssGroup,
  ssrfRedirectGroup,
  csrfCorsGroup,
  serverMisconfigGroup,
  infoExposureGroup,
];

export const learnTopicCount = learnGroups.reduce((n, g) => n + g.topics.length, 0);

// ── Lesson resolution: deep lesson on a strong match, else generated ────────
// "Auto-generate + override": every VRT entry gets a lesson. A hand-written
// deep lesson wins only when its VRT path is exactly the entry's leaf path —
// fuzzy name matching linked unrelated leaves (e.g. "CAPTCHA › Missing" to the
// missing-cookie-flag lesson), so it is deliberately not used.
const deepByPath = new Map<string, LearnTopic>(
  learnGroups.flatMap((g) => g.topics.map((t) => [t.mapping.bugcrowdVrt, t] as const)),
);

export function deepLessonForEntry(entry: VrtIndexEntry): LearnTopic | undefined {
  return deepByPath.get(fullVrtPath(entry));
}

/** A deep lesson is "translated" when its prose fields are trilingual objects, not plain strings. */
function isTranslated(topic: LearnTopic): boolean {
  return typeof topic.intro !== "string";
}

import { getToolkitForTopic } from "@/learn/data/bountyToolkit";

/**
 * Always returns a lesson for a VRT entry — deep where it matches, generated otherwise.
 * In a non-English language, an English-only deep lesson is replaced by the trilingual
 * generated lesson for that exact leaf, so every entry reads in the chosen language.
 * Once a deep lesson gains real translations it is used in all languages automatically.
 */
export function lessonForEntry(entry: VrtIndexEntry, lang: Lang = "en"): LearnTopic {
  const deep = deepLessonForEntry(entry);
  const path = fullVrtPath(entry);
  if (deep && (lang === "en" || isTranslated(deep))) {
    const toolkit = getToolkitForTopic(path, entry.priority);
    return {
      ...deep,
      tools: deep.tools ?? toolkit.tools,
      bountyTips: deep.bountyTips ?? LEAF_BOUNTY_TIPS[deep.id] ?? toolkit.bountyTips,
    };
  }
  return buildGeneratedLesson(entry);
}

/**
 * Resolve a deep topic for display in a language. In Advanced English, or when
 * the topic is already translated, it is returned as-is. In Hindi/Simple an
 * English-only deep topic is swapped for the trilingual generated lesson of the
 * VRT leaf it maps to (exact path); if it maps to no VRT leaf, it stays English.
 */
export function localizedTopic(topic: LearnTopic, lang: Lang): LearnTopic {
  let resolved: LearnTopic;
  if (lang === "en" || isTranslated(topic)) {
    resolved = topic;
  } else {
    const entry = vrtIndex.find((e) => fullVrtPath(e) === topic.mapping.bugcrowdVrt);
    resolved = entry ? buildGeneratedLesson(entry) : topic;
  }
  if (!resolved.tools || !resolved.bountyTips) {
    const toolkit = getToolkitForTopic(resolved.mapping.bugcrowdVrt, resolved.mapping.bugcrowdPriority);
    return {
      ...resolved,
      tools: resolved.tools ?? toolkit.tools,
      bountyTips: resolved.bountyTips ?? LEAF_BOUNTY_TIPS[resolved.id] ?? toolkit.bountyTips,
    };
  }
  return resolved;
}
