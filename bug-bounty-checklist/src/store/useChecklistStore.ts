import { create } from "zustand";
import { getPersistenceWarning, loadState, saveState } from '../lib/persistence';
import { validateProfile } from '../lib/profileValidation';
import { domains } from '../data/domains';
import type {
  AppState,
  ChecklistCategory,
  ChecklistItem,
  Finding,
  ItemStatus,
  TargetAsset,
  TargetProfile,
  TargetScope,
} from "../types/checklist";

function newProfile(name: string): TargetProfile {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    itemStates: {},
    findings: [],
    scope: {
      inScope: "",
      outOfScope: "",
      programPolicy: "",
      bountyTier: "",
    },
    scratchpad: "",
    assets: [],
    customCategories: [],
  };
}

interface ChecklistStore extends AppState {
  storageError: string | null;
  storageWarning: string | null;
  createProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;

  setItemStatus: (itemId: string, status: ItemStatus) => void;
  setItemNote: (itemId: string, note: string) => void;
  toggleBookmark: (itemId: string) => void;
  markCategoryStatus: (itemIds: string[], status: ItemStatus) => void;

  setScope: (scope: TargetScope) => void;
  setScratchpad: (scratchpad: string) => void;

  addAsset: (asset: Omit<TargetAsset, "id" | "updatedAt">) => void;
  updateAsset: (id: string, asset: Partial<TargetAsset>) => void;
  deleteAsset: (id: string) => void;
  bulkAddAssets: (hosts: string[]) => void;

  addCustomCategory: (category: Omit<ChecklistCategory, "id">) => void;
  deleteCustomCategory: (categoryId: string) => void;
  addCustomItem: (categoryId: string, item: Omit<ChecklistItem, "id">) => void;
  deleteCustomItem: (categoryId: string, itemId: string) => void;
  renameCustomItem: (categoryId: string, itemId: string, text: string) => void;

  addFinding: (finding: Omit<Finding, "id" | "createdAt">) => void;
  removeFinding: (findingId: string) => void;
  clearFindingScreenshots: (findingId: string) => void;

  resetActiveProfile: () => void;
  importProfile: (profile: unknown) => void;
}

const DEFAULT_PROFILE = newProfile("Default");

export const useChecklistStore = create<ChecklistStore>()(
    (rawSet, get) => {
      let initial: AppState = { profiles: { [DEFAULT_PROFILE.id]: DEFAULT_PROFILE }, activeProfileId: DEFAULT_PROFILE.id };
      let hydrationError: string | null = null;
      try { initial = loadState() ?? initial; } catch (error) { hydrationError = `Saved data could not be loaded; original storage is preserved. ${error instanceof Error ? error.message : String(error)}`; }
      const set = (update: Partial<ChecklistStore> | ((state: ChecklistStore) => Partial<ChecklistStore>)) => {
        try {
          if (hydrationError) throw new Error('Saved data is unreadable. Recover or clear bbc-store in browser storage before editing.');
          const previous = get();
          const patch = typeof update === 'function' ? update(previous) : update;
          const next = { ...previous, ...patch };
          // Commit to durable storage first: failure never leaves a falsely saved in-memory edit.
          saveState({ profiles: next.profiles, activeProfileId: next.activeProfileId });
          rawSet({ ...patch, storageError: null, storageWarning: getPersistenceWarning() });
        } catch (error) {
          rawSet({ storageError: error instanceof Error ? error.message : 'Unable to save local data' });
          throw error;
        }
      };
      return ({
      ...initial,
      storageError: hydrationError,
      storageWarning: getPersistenceWarning(),

      createProfile: (name) => {
        const p = newProfile(name);
        set((s) => ({
          profiles: { ...s.profiles, [p.id]: p },
          activeProfileId: p.id,
        }));
      },

      deleteProfile: (id) => {
        set((s) => {
          const profiles = { ...s.profiles };
          delete profiles[id];
          const remainingIds = Object.keys(profiles);
          const activeProfileId =
            s.activeProfileId === id ? remainingIds[0] ?? null : s.activeProfileId;
          return { profiles, activeProfileId };
        });
      },

      setActiveProfile: (id) => { if (Object.hasOwn(get().profiles, id)) set({ activeProfileId: id }); },

      renameProfile: (id, name) => {
        set((s) => {
          const profile = s.profiles[id];
          if (!profile) return s;
          return { profiles: { ...s.profiles, [id]: { ...profile, name } } };
        });
      },

      setItemStatus: (itemId, status) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const prevState = profile.itemStates[itemId];
          const itemStates = {
            ...profile.itemStates,
            [itemId]: { ...prevState, status, updatedAt: Date.now() },
          };
          return {
            profiles: { ...s.profiles, [activeId]: { ...profile, itemStates } },
          };
        });
      },

      toggleBookmark: (itemId) => {
        set(s => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const previous = profile.itemStates[itemId];
          return { profiles: { ...s.profiles, [activeId]: { ...profile, itemStates: {
            ...profile.itemStates, [itemId]: { ...previous, status: previous?.status ?? 'not_tested', bookmarked: !previous?.bookmarked, updatedAt: Date.now() },
          } } } };
        });
      },

      setItemNote: (itemId, note) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const prevState = profile.itemStates[itemId];
          const itemStates = {
            ...profile.itemStates,
            [itemId]: {
              ...prevState,
              status: prevState?.status ?? "not_tested",
              note,
              updatedAt: Date.now(),
            },
          };
          return {
            profiles: { ...s.profiles, [activeId]: { ...profile, itemStates } },
          };
        });
      },

      markCategoryStatus: (itemIds, status) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const itemStates = { ...profile.itemStates };
          const now = Date.now();
          for (const id of itemIds) {
            itemStates[id] = {
              ...itemStates[id],
              status,
              note: itemStates[id]?.note,
              updatedAt: now,
            };
          }
          return {
            profiles: { ...s.profiles, [activeId]: { ...profile, itemStates } },
          };
        });
      },

      setScope: (scope) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, scope },
            },
          };
        });
      },

      setScratchpad: (scratchpad) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, scratchpad },
            },
          };
        });
      },

      addAsset: (asset) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const newAsset: TargetAsset = {
            ...asset,
            id: `asset-${crypto.randomUUID()}`,
            updatedAt: Date.now(),
          };
          const assets = [...(profile.assets || []), newAsset];
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, assets },
            },
          };
        });
      },

      updateAsset: (id, partial) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const assets = (profile.assets || []).map((a) =>
            a.id === id ? { ...a, ...partial, updatedAt: Date.now() } : a
          );
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, assets },
            },
          };
        });
      },

      deleteAsset: (id) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const assets = (profile.assets || []).filter((a) => a.id !== id);
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, assets },
            },
          };
        });
      },

      bulkAddAssets: (hosts) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const now = Date.now();
          const existing = new Set((profile.assets || []).map((a) => a.host.toLowerCase()));
          const newAssets: TargetAsset[] = [];

          for (const raw of hosts) {
            const clean = raw.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
            if (clean && !existing.has(clean.toLowerCase())) {
              existing.add(clean.toLowerCase());
              newAssets.push({
                id: `asset-${crypto.randomUUID()}`,
                host: clean,
                 status: "Unverified",
                updatedAt: now,
              });
            }
          }

          return {
            profiles: {
              ...s.profiles,
              [activeId]: {
                ...profile,
                assets: [...(profile.assets || []), ...newAssets],
              },
            },
          };
        });
      },

      addCustomCategory: (category) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const newCat: ChecklistCategory = {
            ...category,
            id: `custom-cat-${crypto.randomUUID()}`,
            isCustom: true,
          };
          const customCategories = [...(profile.customCategories || []), newCat];
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, customCategories },
            },
          };
        });
      },

      deleteCustomCategory: (categoryId) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const customCategories = (profile.customCategories || []).filter(
            (c) => c.id !== categoryId
          );
          const itemStates = { ...profile.itemStates };
          profile.customCategories?.find(c => c.id === categoryId)?.items.forEach(i => delete itemStates[i.id]);
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, customCategories, itemStates },
            },
          };
        });
      },

      addCustomItem: (categoryId, item) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const newItem: ChecklistItem = {
            ...item,
            id: `custom-item-${crypto.randomUUID()}`,
            isCustom: true,
          };
          const categories = [...(profile.customCategories || [])];
          if (!categories.some(c => c.id === categoryId)) {
            const domain = domains.find(d => d.categories.some(c => c.id === categoryId));
            const base = domain?.categories.find(c => c.id === categoryId);
            if (!base) throw new Error('Category not found');
            categories.push({ ...base, domainId: domain!.id, items: [] });
          }
          const customCategories = categories.map((cat) => {
            if (cat.id === categoryId) {
              return { ...cat, items: [...cat.items, newItem] };
            }
            return cat;
          });
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, customCategories },
            },
          };
        });
      },

      deleteCustomItem: (categoryId, itemId) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const itemStates = { ...profile.itemStates };
          delete itemStates[itemId];
          const customCategories = (profile.customCategories || []).map((cat) => {
            if (cat.id === categoryId) {
              return {
                ...cat,
                items: cat.items.filter((i) => i.id !== itemId),
              };
            }
            return cat;
          });
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, customCategories, itemStates },
            },
          };
        });
      },

      renameCustomItem: (categoryId, itemId, text) => {
        if (!text.trim()) return;
        set(s => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const customCategories = profile.customCategories?.map(category => category.id === categoryId ? { ...category, items: category.items.map(item => item.id === itemId ? { ...item, text: text.trim() } : item) } : category);
          return { profiles: { ...s.profiles, [activeId]: { ...profile, customCategories } } };
        });
      },

      addFinding: (finding) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          const full: Finding = {
            ...finding,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          };
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, findings: [...profile.findings, full] },
            },
          };
        });
      },

      removeFinding: (findingId) => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          return {
            profiles: {
              ...s.profiles,
              [activeId]: {
                ...profile,
                findings: profile.findings.filter((f) => f.id !== findingId),
              },
            },
          };
        });
      },

      clearFindingScreenshots: (findingId) => {
        set(s => {
          const id = s.activeProfileId;
          if (!id) return s;
          const profile = s.profiles[id];
          return { profiles: { ...s.profiles, [id]: { ...profile, findings: profile.findings.map(finding => finding.id === findingId ? { ...finding, screenshots: [] } : finding) } } };
        });
      },

      resetActiveProfile: () => {
        set((s) => {
          const activeId = s.activeProfileId;
          if (!activeId) return s;
          const profile = s.profiles[activeId];
          return {
            profiles: {
              ...s.profiles,
              [activeId]: {
                ...profile,
                itemStates: {},
                findings: [],
                assets: [],
                scratchpad: "",
              },
            },
          };
        });
      },

      importProfile: (input) => {
        const profile = validateProfile(input);
        if (get().profiles[profile.id]) {
          profile.id = crypto.randomUUID();
          profile.name = `${profile.name.slice(0, 180)} (imported copy)`;
        }
        set((s) => ({
          profiles: { ...s.profiles, [profile.id]: profile },
          activeProfileId: profile.id,
        }));
      },
    });
  }
);

export function useActiveProfile() {
  return useChecklistStore((s) =>
    s.activeProfileId ? s.profiles[s.activeProfileId] : null
  );
}
