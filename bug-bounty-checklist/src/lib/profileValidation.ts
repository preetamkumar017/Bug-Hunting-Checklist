import type { AppState, TargetProfile } from '../types/checklist';
import { domains } from '../data/domains';
import { isSafeDataImage } from './reportSafety';
import { calcCvss, parseCvssVector } from './cvss';
import { calcCvss4, parseCvss4Vector } from './cvss4';

export const MAX_IMPORT_BYTES = 3_000_000;
export const MAX_SCREENSHOT_BYTES = 250_000;
export const MAX_SCREENSHOTS = 4;
export const MAX_RECOVERY_BYTES = 20_000_000;
export interface ValidationOptions { recovery?: boolean; clone?: boolean }
const builtinItemIds = new Set(domains.flatMap(d => d.categories.flatMap(c => c.items.map(i => i.id))));
const builtinCategoryIds = new Set(domains.flatMap(d => d.categories.map(c => c.id)));
const domainIds = new Set<string>(domains.map(d => d.id));
const statuses = ['not_tested', 'clean', 'vulnerable', 'blocked'];
const severities = ['critical', 'high', 'medium', 'low', 'info'];
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function object(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && !Array.isArray(value), 'Expected an object');
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 100_000): asserts value is string { assert(typeof value === 'string' && value.length <= max, 'Invalid or oversized text'); }
function id(value: unknown) { text(value, 200); assert(value.length && !['__proto__', 'constructor', 'prototype'].includes(value), 'Invalid ID'); }
function array(value: unknown, max: number): unknown[] { assert(Array.isArray(value) && value.length <= max, 'Invalid or oversized list'); return value; }
function optionalTextFields(value: Record<string, unknown>, keys: string[]) { for (const key of keys) if (value[key] !== undefined) text(value[key]); }
function optionalLists(value: Record<string, unknown>, keys: string[]) { for (const key of keys) if (value[key] !== undefined) array(value[key], 500).forEach(entry => text(entry)); }
function response(value: unknown) { const r = object(value); text(r.vulnerable); text(r.safe); }
function reference(value: unknown) {
  text(value);
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('References must be valid HTTP or HTTPS URLs'); }
  assert(url.protocol === 'http:' || url.protocol === 'https:', 'References must use HTTP or HTTPS');
}
function validateCheck(value: Record<string, unknown>) {
  optionalTextFields(value, ['reference', 'cweId', 'owaspCategory', 'remediation']);
  if (value.reference !== undefined) reference(value.reference);
  if (value.expectedResponse !== undefined) response(value.expectedResponse);
  if (value.isCustom !== undefined) assert(typeof value.isCustom === 'boolean', 'Invalid custom flag');
  if (value.bountyPotential !== undefined) assert(['critical', 'high', 'medium', 'low'].includes(value.bountyPotential as string), 'Invalid bounty potential');
  if (value.tags !== undefined) optionalLists(object(value.tags), ['tech', 'relatedItemIds', 'suggestOnClean']);
  if (value.methods !== undefined) for (const entry of array(value.methods, 100)) {
    const method = object(entry); text(method.title); array(method.steps, 500).forEach(v => text(v));
    optionalTextFields(method, ['id', 'scenario', 'tips']); optionalLists(method, ['tools', 'payloads', 'prerequisites', 'evidence', 'limitations', 'safety', 'references']);
    if (method.references !== undefined) (method.references as unknown[]).forEach(reference);
    if (method.expectedResponse !== undefined) response(method.expectedResponse);
    if (method.verification !== undefined) assert(['reviewed', 'needs_adaptation', 'lab_verified'].includes(method.verification as string), 'Invalid verification');
  }
  if (value.useCases !== undefined) for (const entry of array(value.useCases, 100)) { const scenario = object(entry); text(scenario.title); text(scenario.description); optionalTextFields(scenario, ['targetContext', 'impactExample']); }
}
function tree(value: unknown, depth = 0, recovery = false) {
  assert(depth < 20, 'Import nesting limit exceeded');
  if (typeof value === 'string') text(value, recovery ? MAX_RECOVERY_BYTES : 400_000);
  else if (Array.isArray(value)) { assert(value.length <= 20_000, 'List limit exceeded'); value.forEach(v => tree(v, depth + 1, recovery)); }
  else if (value && typeof value === 'object') for (const [key, v] of Object.entries(value)) { id(key); tree(v, depth + 1, recovery); }
}
export function validateScreenshot(value: unknown, options: ValidationOptions = {}): string {
  text(value, options.recovery ? 14_000_000 : Math.ceil(MAX_SCREENSHOT_BYTES * 4 / 3) + 100);
  assert(isSafeDataImage(value), 'Screenshot must be a canonical raster image matching its declared MIME type');
  if (!options.recovery) {
    assert(!value.startsWith('data:image/gif;'), 'New screenshots must be PNG, JPEG or WebP images');
    const base64 = value.slice(value.indexOf(',') + 1);
    const bytes = base64.length * 3 / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    assert(bytes <= MAX_SCREENSHOT_BYTES, 'Screenshot exceeds 250 KB');
  }
  return value;
}
export function validateProfile(input: unknown, options: ValidationOptions = {}): TargetProfile {
  assert(new TextEncoder().encode(JSON.stringify(input)).length <= (options.recovery ? MAX_RECOVERY_BYTES : MAX_IMPORT_BYTES), options.recovery ? 'Profile exceeds the 20 MB recovery limit' : 'Profile exceeds the 3 MB limit');
  tree(input, 0, options.recovery);
  const p = object(input); id(p.id); text(p.name, 200); assert(p.name.trim(), 'Profile name is required');
  assert(typeof p.createdAt === 'number' && Number.isFinite(p.createdAt), 'Invalid creation date');
  const states = object(p.itemStates);
  assert(Object.keys(states).length <= 20_000, 'Too many item states');
  for (const s of Object.values(states)) { const state = object(s); assert(statuses.includes(state.status as string), 'Invalid item status'); if (state.note !== undefined) text(state.note); if (state.bookmarked !== undefined) assert(typeof state.bookmarked === 'boolean', 'Invalid bookmark'); if (state.updatedAt !== undefined) assert(typeof state.updatedAt === 'number' && Number.isFinite(state.updatedAt), 'Invalid state date'); }
  const unique = (list: unknown[]) => { const seen = new Set(); for (const entry of list) { const o = object(entry); id(o.id); assert(!seen.has(o.id), 'Duplicate ID'); seen.add(o.id); } };
  const findings = array(p.findings, 1000); unique(findings);
  for (const finding of findings) optionalTextFields(object(finding), ['cweId', 'owaspCategory', 'remediation']);
  for (const f of findings) {
    const v = object(f);
    for (const k of ['itemId', 'itemText', 'categoryName', 'title', 'description']) text(v[k]);
    assert(severities.includes(v.severity as string), 'Invalid severity');
    assert(domainIds.has(v.domain as string), 'Invalid domain');
    assert(typeof v.createdAt === 'number' && Number.isFinite(v.createdAt), 'Invalid finding date');
    if (v.screenshots !== undefined) array(v.screenshots, options.recovery ? 1000 : MAX_SCREENSHOTS).forEach(image => validateScreenshot(image, options));
    if (v.cvss !== undefined) {
      const cvss = object(v.cvss); text(cvss.vector, 300);
      assert(typeof cvss.score === 'number' && cvss.score >= 0 && cvss.score <= 10, 'Invalid CVSS score');
      if (!options.recovery) {
        const v3 = parseCvssVector(cvss.vector); const v4 = parseCvss4Vector(cvss.vector);
        const score = v3 ? calcCvss(v3).score : v4 ? calcCvss4(v4).score : null;
        assert(score !== null && score === cvss.score, 'CVSS vector is invalid or its score does not match the vector');
      }
    }
  }
  if (p.scope !== undefined) { const scope = object(p.scope); for (const k of ['inScope', 'outOfScope', 'programPolicy']) text(scope[k]); if (scope.bountyTier !== undefined) text(scope.bountyTier); }
  if (p.scratchpad !== undefined) text(p.scratchpad);
  const assets = array(p.assets ?? [], 5000); unique(assets);
  for (const asset of assets) { const value = object(asset); if (value.type !== undefined) assert(['domain', 'subdomain', 'ip', 'api', 'mobile_app', 'repo'].includes(value.type as string), 'Invalid asset type'); }
  for (const entry of assets) { const a = object(entry); text(a.host, 2000); for (const k of ['status', 'ports', 'notes']) if (a[k] !== undefined) text(a[k]); if (a.tech !== undefined) array(a.tech, 100).forEach(v => text(v, 200)); assert(typeof a.updatedAt === 'number', 'Invalid asset date'); }
  const cats = array(p.customCategories ?? [], 500); unique(cats);
  for (const entry of cats) {
    const category = object(entry);
    if (category.reference !== undefined) reference(category.reference);
    for (const item of array(category.items, 2000)) validateCheck(object(item));
  }
  const itemIds = new Set<string>();
  for (const entry of cats) {
    const c = object(entry); text(c.name, 200);
    if (c.domainId !== undefined) assert(domainIds.has(c.domainId as string), 'Invalid category domain');
    for (const k of ['description', 'emoji', 'reference']) if (c[k] !== undefined) text(c[k]);
    for (const entry of array(c.items, 2000)) {
      const i = object(entry); id(i.id);
      assert(!builtinItemIds.has(i.id as string) && !itemIds.has(i.id as string), 'Duplicate check ID'); itemIds.add(i.id as string);
      text(i.text, 2000); text(i.how); assert(severities.includes(i.severity as string), 'Invalid check severity');
      for (const k of ['payloads', 'payloadNotes', 'recommendedTools']) if (i[k] !== undefined) array(i[k], 500).forEach(v => text(v));
      if (!options.recovery && i.payloadNotes !== undefined) assert((i.payloadNotes as unknown[]).length === (i.payloads as unknown[] | undefined)?.length, 'Payload notes must match payload count');
    }
  }
  if (options.clone === false) return input as TargetProfile;
  const profile = structuredClone(input) as TargetProfile;
  profile.customCategories = profile.customCategories?.map(category => ({ ...category, isCustom: !builtinCategoryIds.has(category.id), items: category.items.map(item => ({ ...item, isCustom: true })) }));
  return profile;
}
export function parseProfileImport(json: string): TargetProfile { assert(new TextEncoder().encode(json).length <= MAX_IMPORT_BYTES, 'Import exceeds 3 MB'); return validateProfile(JSON.parse(json)); }
export function validatePersistedState(input: unknown, options: ValidationOptions = {}): AppState {
  const state = object(input); const profiles = object(state.profiles);
  assert(Object.keys(profiles).length <= 50, 'Profile limit exceeded');
  const valid: AppState['profiles'] = {};
  for (const [key, value] of Object.entries(profiles)) { const p = validateProfile(value, options); assert(key === p.id, 'Profile ID mismatch'); valid[key] = p; }
  assert(state.activeProfileId === null || typeof state.activeProfileId === 'string' && Object.hasOwn(valid, state.activeProfileId), 'Invalid active profile');
  return { profiles: valid, activeProfileId: state.activeProfileId as string | null };
}
