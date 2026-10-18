// Learn platform content aggregator.
//
// Type contract + platform legend live in ./types. Advanced, P3/P4-focused
// content lives in per-group files under ./groups (each exports one LearnGroup).
// This file assembles them in learning order into the learnGroups array the UI
// renders, and re-exports the shared contract so consumers import from here.

import type { LearnGroup } from "@/learn/data/types";
import { accessControlGroup } from "@/learn/data/groups/access-control";
import { authenticationGroup } from "@/learn/data/groups/authentication";
import { injectionGroup } from "@/learn/data/groups/injection";
import { xssGroup } from "@/learn/data/groups/xss";
import { ssrfRedirectGroup } from "@/learn/data/groups/ssrf-redirect";
import { csrfCorsGroup } from "@/learn/data/groups/csrf-cors";
import { serverMisconfigGroup } from "@/learn/data/groups/server-misconfig";
import { infoExposureGroup } from "@/learn/data/groups/info-exposure";

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
