import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { ChecklistCategory, ChecklistDomain, ChecklistItem, ItemStatus } from "../types/checklist";
import { SeverityBadge } from "./SeverityBadge";
import { StatusSelect } from "./StatusSelect";
import { useChecklistStore, useActiveProfile } from "../store/useChecklistStore";

export function ChecklistItemRow({
  item,
  category,
  domain,
}: {
  item: ChecklistItem;
  category: ChecklistCategory;
  domain: ChecklistDomain;
}) {
  const [open, setOpen] = useState(false);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [findingTitle, setFindingTitle] = useState("");
  const [findingDesc, setFindingDesc] = useState("");

  const profile = useActiveProfile();
  const setItemStatus = useChecklistStore((s) => s.setItemStatus);
  const setItemNote = useChecklistStore((s) => s.setItemNote);
  const addFinding = useChecklistStore((s) => s.addFinding);

  const state = profile?.itemStates[item.id];
  const status: ItemStatus = state?.status ?? "not_tested";

  function handleStatusChange(next: ItemStatus) {
    setItemStatus(item.id, next);
    if (next === "vulnerable") {
      setShowFindingForm(true);
      setOpen(true);
    }
  }

  function saveFinding() {
    if (!findingTitle.trim()) return;
    addFinding({
      itemId: item.id,
      itemText: item.text,
      domain: domain.id,
      categoryName: category.name,
      severity: item.severity,
      title: findingTitle.trim(),
      description: findingDesc.trim(),
    });
    setFindingTitle("");
    setFindingDesc("");
    setShowFindingForm(false);
  }

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-0.5 shrink-0 text-slate-500 hover:text-slate-300"
          aria-label="Toggle details"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <div className="min-w-0 flex-1">
          <button onClick={() => setOpen((o) => !o)} className="block w-full text-left">
            <p className="text-sm text-slate-200">{item.text}</p>
          </button>

          <div className="mt-2 flex items-center gap-2 sm:hidden">
            <SeverityBadge severity={item.severity} />
            <StatusSelect value={status} onChange={handleStatusChange} severity={item.severity} />
          </div>

          {open && (
            <div className="mt-3 space-y-2 rounded-md bg-black/20 p-3 text-xs text-slate-400">
              <div>
                <span className="font-semibold text-slate-300">How: </span>
                {item.how}
              </div>
              {item.payloads && item.payloads.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-300">Payloads / Commands:</span>
                  <ul className="mt-1 space-y-1.5">
                    {item.payloads.map((p, i) => (
                      <li key={i}>
                        <code className="block whitespace-pre-wrap rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-emerald-400">
                          {p}
                        </code>
                        {item.payloadNotes?.[i] && (
                          <p className="mt-0.5 text-[11px] text-slate-500">{item.payloadNotes[i]}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {item.expectedResponse && (
                <div className="space-y-1.5 rounded border border-border/60 p-2">
                  <p className="font-semibold text-slate-300">Reading the result:</p>
                  <p>
                    <span className="font-medium text-red-400">🔴 Vulnerable if: </span>
                    {item.expectedResponse.vulnerable}
                  </p>
                  <p>
                    <span className="font-medium text-emerald-400">🟢 Safe if: </span>
                    {item.expectedResponse.safe}
                  </p>
                </div>
              )}
              {(item.reference ?? category.reference) && (
                <a
                  href={item.reference ?? category.reference}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                >
                  Reference <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <div>
                <span className="font-semibold text-slate-300">Note:</span>
                <textarea
                  defaultValue={state?.note ?? ""}
                  onBlur={(e) => setItemNote(item.id, e.target.value)}
                  placeholder={
                    item.severity === "info"
                      ? "Paste findings/output here (subdomain list, scan results, etc.)..."
                      : "Payload used, response observed, POC link..."
                  }
                  className="mt-1 w-full resize-y rounded border border-border/60 bg-transparent p-2 text-xs text-slate-300 outline-none focus:border-slate-500"
                  rows={2}
                />
              </div>

              {showFindingForm && (
                <div className="space-y-2 rounded border border-red-600/30 bg-red-950/20 p-3">
                  <p className="text-xs font-semibold text-red-400">New finding</p>
                  <input
                    value={findingTitle}
                    onChange={(e) => setFindingTitle(e.target.value)}
                    placeholder="Finding title"
                    className="w-full rounded border border-border/60 bg-transparent px-2 py-1 text-xs text-slate-200 outline-none"
                  />
                  <textarea
                    value={findingDesc}
                    onChange={(e) => setFindingDesc(e.target.value)}
                    placeholder="Description / impact / steps to reproduce"
                    rows={3}
                    className="w-full resize-y rounded border border-border/60 bg-transparent px-2 py-1 text-xs text-slate-200 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveFinding}
                      className="rounded bg-red-600/80 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
                    >
                      Save to Findings
                    </button>
                    <button
                      onClick={() => setShowFindingForm(false)}
                      className="rounded border border-border/60 px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <SeverityBadge severity={item.severity} />
          <StatusSelect value={status} onChange={handleStatusChange} severity={item.severity} />
        </div>
      </div>
    </div>
  );
}
