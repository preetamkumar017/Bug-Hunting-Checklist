import { useState } from "react";
import { Plus } from "lucide-react";
import { useChecklistStore } from "../store/useChecklistStore";

export function ProfileSwitcher() {
  const profiles = useChecklistStore((s) => s.profiles);
  const activeProfileId = useChecklistStore((s) => s.activeProfileId);
  const setActiveProfile = useChecklistStore((s) => s.setActiveProfile);
  const createProfile = useChecklistStore((s) => s.createProfile);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Target
      </p>
      <div className="flex items-center gap-1">
        <select
          value={activeProfileId ?? ""}
          onChange={(e) => setActiveProfile(e.target.value)}
          className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-sm text-slate-200 outline-none"
        >
          {Object.values(profiles).map((p) => (
            <option key={p.id} value={p.id} className="bg-slate-900">
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setAdding((a) => !a)}
          className="shrink-0 rounded-md border border-border p-1.5 text-slate-400 hover:text-slate-200"
          aria-label="Add target profile"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {adding && (
        <div className="mt-2 flex gap-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                createProfile(name.trim());
                setName("");
                setAdding(false);
              }
            }}
            placeholder="e.g. acme.com"
            className="w-full rounded-md border border-border bg-transparent px-2 py-1 text-xs text-slate-200 outline-none"
          />
          <button
            onClick={() => {
              if (name.trim()) {
                createProfile(name.trim());
                setName("");
                setAdding(false);
              }
            }}
            className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-xs text-slate-200"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
