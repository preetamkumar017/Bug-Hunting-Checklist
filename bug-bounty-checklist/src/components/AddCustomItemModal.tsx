import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useChecklistStore } from "../store/useChecklistStore";
import type { Severity } from "../types/checklist";

export function AddCustomItemModal({
  categoryId,
  categoryName,
  open,
  onClose,
}: {
  categoryId: string;
  categoryName: string;
  open: boolean;
  onClose: () => void;
}) {
  const addCustomItem = useChecklistStore((s) => s.addCustomItem);

  const [text, setText] = useState("");
  const [how, setHow] = useState("");
  const [payloads, setPayloads] = useState("");
  const [severity, setSeverity] = useState<Severity>("high");
  const [vulnerableVerdict, setVulnerableVerdict] = useState("");
  const [safeVerdict, setSafeVerdict] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !how.trim()) return;

    addCustomItem(categoryId, {
      text: text.trim(),
      how: how.trim(),
      payloads: payloads
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
      severity,
      expectedResponse:
        vulnerableVerdict || safeVerdict
          ? {
              vulnerable: vulnerableVerdict.trim() || "Vulnerability confirmed.",
              safe: safeVerdict.trim() || "System properly protected.",
            }
          : undefined,
    });

    onClose();
    setText("");
    setHow("");
    setPayloads("");
    setVulnerableVerdict("");
    setSafeVerdict("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Add Custom Checklist Item</h3>
            <p className="text-[11px] text-slate-400">Category: {categoryName}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Check Title / Summary *
            </label>
            <input
              type="text"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Unauthenticated access on /api/v2/export"
              className="w-full rounded border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Testing Methodology (How to test) *
            </label>
            <textarea
              required
              value={how}
              onChange={(e) => setHow(e.target.value)}
              rows={3}
              placeholder="Step-by-step procedure to test this issue..."
              className="w-full rounded border border-border bg-slate-950 p-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Severity Rating
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full rounded border border-border bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payloads (one per line)
              </label>
              <input
                type="text"
                value={payloads}
                onChange={(e) => setPayloads(e.target.value)}
                placeholder="curl -X POST ... or ' OR 1=1"
                className="w-full rounded border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Expected Vulnerable Indicator
            </label>
            <input
              type="text"
              value={vulnerableVerdict}
              onChange={(e) => setVulnerableVerdict(e.target.value)}
              placeholder="e.g. Returns 200 OK with internal user JSON records"
              className="w-full rounded border border-border bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none"
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
              <Plus className="h-3.5 w-3.5" />
              Add Check
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
