import { useState } from "react";
import { ChevronDown, ExternalLink, HelpCircle, Paperclip, X } from "lucide-react";
import type { ChecklistCategory, ChecklistDomain, ChecklistItem, ItemStatus } from "../types/checklist";
import { SeverityBadge } from "./SeverityBadge";
import { StatusSelect } from "./StatusSelect";
import { CommandHelpModal } from "./CommandHelpModal";
import { CvssPicker } from "./CvssPicker";
import { findReferencedCommands } from "../lib/commandRef";
import { DEFAULT_CVSS, calcCvss, type CvssMetrics } from "../lib/cvss";
import { useChecklistStore, useActiveProfile } from "../store/useChecklistStore";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const [findingCvss, setFindingCvss] = useState<CvssMetrics>(DEFAULT_CVSS);
  const [findingScreenshots, setFindingScreenshots] = useState<string[]>([]);
  const [helpCommands, setHelpCommands] = useState<string[] | null>(null);

  const profile = useActiveProfile();
  const setItemStatus = useChecklistStore((s) => s.setItemStatus);
  const setItemNote = useChecklistStore((s) => s.setItemNote);
  const addFinding = useChecklistStore((s) => s.addFinding);

  const state = profile?.itemStates[item.id];
  const status: ItemStatus = state?.status ?? "not_tested";

  function handleStatusChange(next: ItemStatus) {
    setItemStatus(item.id, next);
    if (next === "vulnerable") {
      setFindingTitle((t) => t || item.text);
      setFindingDesc((d) => d || state?.note?.trim() || "");
      setShowFindingForm(true);
      setOpen(true);
    }
  }

  function saveFinding() {
    if (!findingTitle.trim()) return;
    const { score, vector } = calcCvss(findingCvss);
    addFinding({
      itemId: item.id,
      itemText: item.text,
      domain: domain.id,
      categoryName: category.name,
      severity: item.severity,
      title: findingTitle.trim(),
      description: findingDesc.trim(),
      cvss: score > 0 ? { score, vector } : undefined,
      screenshots: findingScreenshots.length > 0 ? findingScreenshots : undefined,
    });
    setFindingTitle("");
    setFindingDesc("");
    setFindingCvss(DEFAULT_CVSS);
    setFindingScreenshots([]);
    setShowFindingForm(false);
  }

  async function handleScreenshotUpload(files: FileList | null) {
    if (!files) return;
    const urls = await Promise.all(Array.from(files).map(readFileAsDataUrl));
    setFindingScreenshots((s) => [...s, ...urls]);
  }

  return (
    <>
    {helpCommands && <CommandHelpModal commands={helpCommands} onClose={() => setHelpCommands(null)} />}
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
                    {item.payloads.map((p, i) => {
                      const refs = findReferencedCommands(p);
                      return (
                        <li key={i}>
                          <div className="flex items-start gap-1.5">
                            <code className="block flex-1 whitespace-pre-wrap rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-emerald-400">
                              {p}
                            </code>
                            {refs.length > 0 && (
                              <button
                                onClick={() => setHelpCommands(refs)}
                                className="mt-0.5 shrink-0 text-slate-500 hover:text-slate-300"
                                title={`Command reference: ${refs.join(", ")}`}
                                aria-label="Show command reference"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          {item.payloadNotes?.[i] && (
                            <p className="mt-0.5 text-[11px] text-slate-500">{item.payloadNotes[i]}</p>
                          )}
                        </li>
                      );
                    })}
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

                  <CvssPicker value={findingCvss} onChange={setFindingCvss} />

                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border/60 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200">
                      <Paperclip className="h-3 w-3" />
                      Attach screenshot(s)
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleScreenshotUpload(e.target.files)}
                        className="hidden"
                      />
                    </label>
                    {findingScreenshots.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {findingScreenshots.map((src, i) => (
                          <div key={i} className="group relative">
                            <img src={src} alt={`Screenshot ${i + 1}`} className="h-14 w-14 rounded border border-border/60 object-cover" />
                            <button
                              onClick={() => setFindingScreenshots((s) => s.filter((_, idx) => idx !== i))}
                              className="absolute -right-1 -top-1 rounded-full bg-black/80 p-0.5 text-slate-300 opacity-0 group-hover:opacity-100"
                              aria-label="Remove screenshot"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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
    </>
  );
}
