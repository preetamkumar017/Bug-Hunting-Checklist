import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  createProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;

  setItemStatus: (itemId: string, status: ItemStatus) => void;
  setItemNote: (itemId: string, note: string) => void;
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

  addFinding: (finding: Omit<Finding, "id" | "createdAt">) => void;
  removeFinding: (findingId: string) => void;

  resetActiveProfile: () => void;
  importProfile: (profile: TargetProfile) => void;
}

const DEFAULT_PROFILE = newProfile("Default");

export const useChecklistStore = create<ChecklistStore>()(
  persist(
    (set) => ({
      profiles: { [DEFAULT_PROFILE.id]: DEFAULT_PROFILE },
      activeProfileId: DEFAULT_PROFILE.id,

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

      setActiveProfile: (id) => set({ activeProfileId: id }),

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
            [itemId]: { status, note: prevState?.note, updatedAt: Date.now() },
          };
          return {
            profiles: { ...s.profiles, [activeId]: { ...profile, itemStates } },
          };
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
                status: "200 OK",
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
          return {
            profiles: {
              ...s.profiles,
              [activeId]: { ...profile, customCategories },
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
          const customCategories = (profile.customCategories || []).map((cat) => {
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
              [activeId]: { ...profile, customCategories },
            },
          };
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

      importProfile: (profile) => {
        set((s) => ({
          profiles: { ...s.profiles, [profile.id]: profile },
          activeProfileId: profile.id,
        }));
      },
    }),
    { name: "bbc-store" }
  )
);

export function useActiveProfile() {
  return useChecklistStore((s) =>
    s.activeProfileId ? s.profiles[s.activeProfileId] : null
  );
}
