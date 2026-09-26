import { useState } from "react";
import { X, FolderPlus } from "lucide-react";
import { useChecklistStore } from "../store/useChecklistStore";
import type { Domain } from "../types/checklist";

export function AddCustomCategoryModal({
  activeDomain,
  open,
  onClose,
}: {
  activeDomain: Domain;
  open: boolean;
  onClose: () => void;
}) {
  const addCustomCategory = useChecklistStore((s) => s.addCustomCategory);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [domainId, setDomainId] = useState<Domain>(activeDomain);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    addCustomCategory({
      name: name.trim(),
      emoji: emoji.trim() || "📁",
      description: description.trim() || undefined,
      reference: reference.trim() || undefined,
      domainId,
      items: [],
    });

    onClose();
    setName("");
    setDescription("");
    setReference("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Create Custom Category</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="w-full text-center rounded border border-border bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Internal Admin Endpoints"
                className="w-full rounded border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Domain</label>
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value as Domain)}
              className="w-full rounded border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="web">🌐 Web</option>
              <option value="api">🔌 API</option>
              <option value="cloud">☁️ Cloud & CI/CD</option>
              <option value="ai">🤖 AI & LLM</option>
              <option value="android">📱 Android</option>
              <option value="ios">🍏 iOS</option>
              <option value="thick_client">🖥️ Thick Client</option>
              <option value="web3">⛓️ Web3</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Short description of what to test in this category..."
              className="w-full rounded border border-border bg-slate-950 p-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reference URL</label>
            <input
              type="url"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="https://..."
              className="w-full rounded border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
