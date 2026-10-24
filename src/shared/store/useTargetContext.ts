import { create } from "zustand";
import type { TargetContextValues, TargetProfile } from "@/shared/types/checklist";
import { extractDomainFromText, deriveSubdomain } from "@/shared/lib/domainExtractor";

export type { TargetContextValues };

export interface TargetContextState extends TargetContextValues {
  setTargetDomain: (val: string) => void;
  setSubdomain: (val: string) => void;
  setOriginIp: (val: string) => void;
  setCloudBucket: (val: string) => void;
  setProtectedPath: (val: string) => void;
  setTechStack: (val: string) => void;
  setTokenOrSecret: (val: string) => void;
  setAll: (patch: Partial<TargetContextValues>) => void;
  loadContext: (values: TargetContextValues) => void;
  reset: () => void;
}

const STORAGE_KEY = "bbc-target-context";

export const DEFAULT_TARGET_CONTEXT: TargetContextValues = {
  targetDomain: "",
  subdomain: "",
  originIp: "",
  cloudBucket: "",
  protectedPath: "",
  techStack: "",
  tokenOrSecret: "",
};

export function loadLegacyTargetContext(): TargetContextValues {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      return { ...DEFAULT_TARGET_CONTEXT, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_TARGET_CONTEXT;
}

function saveLegacyTargetContext(values: TargetContextValues) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    }
  } catch {
    // ignore
  }
}

type ProfileSyncListener = (values: TargetContextValues) => void;
let syncListener: ProfileSyncListener | null = null;
let isSyncing = false;

/**
 * Register a listener so changes in useTargetContext update the active profile in useChecklistStore.
 */
export function registerTargetContextProfileSync(fn: ProfileSyncListener) {
  syncListener = fn;
}

export const useTargetContext = create<TargetContextState>((set) => {
  const initial = loadLegacyTargetContext();

  const persist = (updater: (prev: TargetContextState) => Partial<TargetContextState>) => {
    set((state) => {
      const patch = updater(state);
      const next = { ...state, ...patch };
      const values: TargetContextValues = {
        targetDomain: next.targetDomain,
        subdomain: next.subdomain,
        originIp: next.originIp,
        cloudBucket: next.cloudBucket,
        protectedPath: next.protectedPath,
        techStack: next.techStack,
        tokenOrSecret: next.tokenOrSecret,
      };

      saveLegacyTargetContext(values);

      if (!isSyncing && syncListener) {
        syncListener(values);
      }

      return patch;
    });
  };

  return {
    ...initial,

    setTargetDomain: (val) => persist(() => ({ targetDomain: val.trim() })),
    setSubdomain: (val) => persist(() => ({ subdomain: val.trim() })),
    setOriginIp: (val) => persist(() => ({ originIp: val.trim() })),
    setCloudBucket: (val) => persist(() => ({ cloudBucket: val.trim() })),
    setProtectedPath: (val) => persist(() => ({ protectedPath: val.trim() })),
    setTechStack: (val) => persist(() => ({ techStack: val.trim() })),
    setTokenOrSecret: (val) => persist(() => ({ tokenOrSecret: val.trim() })),

    setAll: (patch) =>
      persist(() => ({
        ...patch,
      })),

    loadContext: (values) =>
      set(() => ({
        targetDomain: values.targetDomain || "",
        subdomain: values.subdomain || "",
        originIp: values.originIp || "",
        cloudBucket: values.cloudBucket || "",
        protectedPath: values.protectedPath || "",
        techStack: values.techStack || "",
        tokenOrSecret: values.tokenOrSecret || "",
      })),

    reset: () =>
      persist(() => ({
        ...DEFAULT_TARGET_CONTEXT,
      })),
  };
});

/**
 * Synchronize the target context store from an active TargetProfile.
 * Automatically seeds targetDomain and subdomain from the profile name or assets
 * if they are not already set in profile.targetContext.
 */
export function syncTargetContextFromProfile(profile?: TargetProfile | null) {
  if (!profile) return;
  isSyncing = true;
  try {
    const raw = profile.targetContext;
    const extracted = extractDomainFromText(profile.name);
    const assetDomain = !extracted && profile.assets && profile.assets.length > 0
      ? extractDomainFromText(profile.assets[0].host)
      : "";
    const domain = raw?.targetDomain?.trim() || extracted || assetDomain || "";
    const sub = raw?.subdomain?.trim() || deriveSubdomain(domain);

    const values: TargetContextValues = {
      targetDomain: domain,
      subdomain: sub,
      originIp: raw?.originIp || "",
      cloudBucket: raw?.cloudBucket || "",
      protectedPath: raw?.protectedPath || "",
      techStack: raw?.techStack || "",
      tokenOrSecret: raw?.tokenOrSecret || "",
    };

    useTargetContext.getState().loadContext(values);
  } finally {
    isSyncing = false;
  }
}

/**
 * Smart Variable Interpolator
 * Replaces placeholders like {TARGET}, {DOMAIN}, {SUBDOMAIN}, {ORIGIN_IP},
 * {IP}, {BUCKET}, {PATH}, {TARGET_URL}, {URL} and standard dummy domains (target.com, api.target.com, api.example.com)
 * with the active hunter context.
 */
export function interpolateTargetVars(
  template: string,
  context?: Partial<TargetContextValues>
): string {
  if (!template) return "";

  // If no context given, fetch current store snapshot
  const ctx = context || useTargetContext.getState();

  const target = ctx.targetDomain?.trim() || "";
  const sub = ctx.subdomain?.trim() || (target ? `api.${target}` : "");
  const ip = ctx.originIp?.trim() || "";
  const bucket = ctx.cloudBucket?.trim() || "";
  const path = ctx.protectedPath?.trim() || "";
  const token = ctx.tokenOrSecret?.trim() || "";

  let out = template;

  if (target) {
    // Explicit uppercase tokens
    out = out.replace(/\{TARGET\}/g, target);
    out = out.replace(/\{DOMAIN\}/g, target);
    out = out.replace(/\{TARGET_DOMAIN\}/g, target);
    out = out.replace(/\{TARGET_URL\}/g, `https://${target}`);
    out = out.replace(/\{URL\}/g, `https://${target}`);

    // Dummy standard URLs in templates
    out = out.replace(/\bapi\.target\.com\b/g, sub || `api.${target}`);
    out = out.replace(/\bapi\.example\.com\b/g, sub || `api.${target}`);
    out = out.replace(/\bapp\.example\.com\b/g, sub ? `app.${target}` : `app.${target}`);
    out = out.replace(/\bclient\.example\.com\b/g, sub ? `client.${target}` : `client.${target}`);
    out = out.replace(/\btarget\.com\b/g, target);
    out = out.replace(/\bexample\.com\b/g, target);
    out = out.replace(/\bcompany\.com\b/g, target);
  }

  if (sub) {
    out = out.replace(/\{SUBDOMAIN\}/g, sub);
    out = out.replace(/\{HOST\}/g, sub);
  }

  if (ip) {
    out = out.replace(/\{ORIGIN_IP\}/g, ip);
    out = out.replace(/\{IP\}/g, ip);
    out = out.replace(/\b198\.51\.100\.25\b/g, ip);
    out = out.replace(/\b104\.22\.0\.1\b/g, ip);
  }

  if (bucket) {
    out = out.replace(/\{BUCKET\}/g, bucket);
    out = out.replace(/\{S3_BUCKET\}/g, bucket);
    out = out.replace(/\btarget-assets\b/g, bucket);
  }

  if (path) {
    // Normalize path to have leading slash if needed
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    out = out.replace(/\{PATH\}/g, normalizedPath);
  }

  if (token) {
    out = out.replace(/\{TOKEN\}/g, token);
    out = out.replace(/\{SECRET\}/g, token);
    out = out.replace(/\{KEY\}/g, token);
  }

  return out;
}
