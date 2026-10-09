import type { AppState, TargetProfile } from '../types/checklist';
import { MAX_RECOVERY_BYTES, validatePersistedState, validateProfile } from './profileValidation';

export const STORAGE_KEY = 'bbc-store';
export const STORAGE_VERSION = 1;
export const MAX_STORAGE_BYTES = 4_000_000;
let lastRead: string | null = null;
let lastState: AppState | null = null;
let warning: string | null = null;
// Store updates replace profile objects; unchanged immutable profiles need no
// repeated screenshot decoding or full schema traversal on unrelated edits.
const strictResults = new WeakMap<TargetProfile, string | null>();
const bytes = (value: string) => new TextEncoder().encode(value).length;
const serialize = (state: AppState) => JSON.stringify({ state, version: STORAGE_VERSION });

function strictError(profile: TargetProfile): string | null {
  if (strictResults.has(profile)) return strictResults.get(profile)!;
  let error: string | null = null;
  try { validateProfile(profile, { clone: false }); }
  catch (cause) { error = cause instanceof Error ? cause.message : 'Legacy profile needs review'; }
  strictResults.set(profile, error);
  return error;
}

function recoveryWarning(state: AppState): string | null {
  const reason = Object.values(state.profiles).map(strictError).find(Boolean);
  if (!reason && bytes(serialize(state)) <= MAX_STORAGE_BYTES) return null;
  return `Recovery mode: existing data is preserved and readable. ${reason ?? 'Saved data exceeds the current 4 MB limit.'} Export a backup, then delete old findings, remove their screenshots, or delete profiles to reduce storage. Profiles that fail current validation are otherwise read-only; no evidence is removed automatically.`;
}

/** The warning is advisory; load never rewrites or discards legacy evidence. */
export function getPersistenceWarning(): string | null { return warning; }

export function loadState(): AppState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  lastRead = raw;
  lastState = null;
  warning = null;
  if (!raw) return null;
  if (bytes(raw) > MAX_RECOVERY_BYTES) throw new Error('Saved data exceeds the 20 MB recovery limit. Original browser storage is unchanged; export it through browser storage tools.');
  const envelope = JSON.parse(raw);
  if (envelope.version !== undefined && envelope.version !== 0 && envelope.version !== STORAGE_VERSION) throw new Error('Unsupported saved-data version');
  // Recovery retains safe raster evidence (including historical GIFs), oversized
  // profiles, and historical scores/notes. Strict imports do not use this mode.
  lastState = validatePersistedState(envelope.state, { recovery: true });
  warning = recoveryWarning(lastState);
  return lastState;
}

/** Recovery writes may remove findings/screenshots, never substitute new evidence. */
function isEvidenceReduction(previous: TargetProfile, next: TargetProfile): boolean {
  const { findings: oldFindings, ...oldFields } = previous;
  const { findings: newFindings, ...newFields } = next;
  if (JSON.stringify(oldFields) !== JSON.stringify(newFields)) return false;
  return newFindings.every(finding => {
    const old = oldFindings.find(candidate => candidate.id === finding.id);
    if (!old) return false;
    const { screenshots: oldImages = [], ...oldFields } = old;
    const { screenshots: newImages = [], ...newFields } = finding;
    if (JSON.stringify(oldFields) !== JSON.stringify(newFields)) return false;
    const available = [...oldImages];
    return newImages.every(image => {
      const index = available.indexOf(image);
      if (index < 0) return false;
      available.splice(index, 1);
      return true;
    });
  });
}

export function saveState(state: AppState) {
  if (localStorage.getItem(STORAGE_KEY) !== lastRead) throw new Error('Data changed in another tab. Reload this tab before editing to avoid overwriting those changes.');
  if (Object.keys(state.profiles).length > 50 || (state.activeProfileId !== null && !Object.hasOwn(state.profiles, state.activeProfileId))) throw new Error('Invalid profile selection or profile limit exceeded');
  for (const [id, profile] of Object.entries(state.profiles)) {
    if (profile.id !== id) throw new Error('Profile ID mismatch');
    const error = strictError(profile);
    if (!error) continue;
    const previous = lastState?.profiles[id];
    if (previous === profile) continue;
    if (!previous || !isEvidenceReduction(previous, profile)) throw new Error(`This legacy profile is read-only until repaired: ${error}. Export it or remove screenshots/findings first.`);
    validateProfile(profile, { recovery: true, clone: false });
  }
  const json = serialize(state);
  const size = bytes(json);
  if (size > MAX_RECOVERY_BYTES || (size > MAX_STORAGE_BYTES && (!lastState || size > bytes(serialize(lastState))))) throw new Error('Local storage limit (4 MB) reached. Export a backup and remove screenshots, findings or old profiles. Recovery writes cannot increase oversized storage.');
  localStorage.setItem(STORAGE_KEY, json);
  lastRead = json;
  lastState = state;
  warning = recoveryWarning(state);
}
