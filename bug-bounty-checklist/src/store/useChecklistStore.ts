import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppState, Finding, ItemStatus, TargetProfile } from "../types/checklist";

function newProfile(name: string): TargetProfile {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    itemStates: {},
    findings: [],
  };
}

interface ChecklistStore extends AppState {
  createProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;

  setItemStatus: (itemId: string, status: ItemStatus) => void;
  setItemNote: (itemId: string, note: string) => void;

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
              [activeId]: { ...profile, itemStates: {}, findings: [] },
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
