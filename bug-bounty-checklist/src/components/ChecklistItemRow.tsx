import { lazy, Suspense, useState } from "react";
import { Bookmark, ChevronDown, ExternalLink, HelpCircle, Paperclip, X, FlaskConical, Copy, Check } from "lucide-react";
import type { ChecklistCategory, ChecklistDomain, ChecklistItem, ItemStatus, Severity } from "../types/checklist";
import { SeverityBadge } from "./SeverityBadge";
import { StatusSelect } from "./StatusSelect";
import { CommandHelpModal } from "./CommandHelpModal";
const TestingMethodsModal = lazy(() => import('./TestingMethodsModal').then(m => ({ default: m.TestingMethodsModal })));
import { CvssPicker } from "./CvssPicker";
import { findReferencedCommands } from "../lib/commandRef";
import { DEFAULT_CVSS, calcCvss, cvssSeverityLabel, type CvssMetrics } from "../lib/cvss";
import { useChecklistStore } from "../store/useChecklistStore";
import { useShallow } from 'zustand/react/shallow';
import { MAX_SCREENSHOTS, MAX_SCREENSHOT_BYTES, validateScreenshot } from '../lib/profileValidation';

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
  itemIndex,
}: {
  item: ChecklistItem;
  category: ChecklistCategory;
  domain: ChecklistDomain;
  itemIndex?: number;
}) {
  const [open, setOpen] = useState(false);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [findingTitle, setFindingTitle] = useState("");
  const [findingDesc, setFindingDesc] = useState("");
  const [findingCvss, setFindingCvss] = useState<CvssMetrics>(DEFAULT_CVSS);
  const [findingSeverity, setFindingSeverity] = useState<Severity>('info');
  const [findingScreenshots, setFindingScreenshots] = useState<string[]>([]);
  const [helpCommands, setHelpCommands] = useState<string[] | null>(null);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [copiedPayloadIdx, setCopiedPayloadIdx] = useState<number | null>(null);
  const [saveError, setSaveError] = useState('');

  async function copyPayload(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPayloadIdx(idx);
      setTimeout(() => setCopiedPayloadIdx(null), 1500);
    } catch {
      // ignore
    }
  }

   const state = useChecklistStore(s => s.activeProfileId ? s.profiles[s.activeProfileId]?.itemStates[item.id] : undefined);
  const setItemStatus = useChecklistStore((s) => s.setItemStatus);
  const setItemNote = useChecklistStore((s) => s.setItemNote);
  const toggleBookmark = useChecklistStore(s => s.toggleBookmark);
  const addFinding = useChecklistStore((s) => s.addFinding);
  const removeFinding = useChecklistStore((s) => s.removeFinding);
  const clearFindingScreenshots = useChecklistStore(s => s.clearFindingScreenshots);
  const itemFindings = useChecklistStore(useShallow(s => (s.activeProfileId ? s.profiles[s.activeProfileId]?.findings ?? [] : []).filter(f => f.itemId === item.id)));
  const deleteCustomItem = useChecklistStore(s => s.deleteCustomItem);
  const renameCustomItem = useChecklistStore(s => s.renameCustomItem);
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
    if (!findingTitle.trim() || !findingDesc.trim()) {
      setSaveError('Add a title and observed evidence, reproduction steps and tested limitations. A checklist label is not evidence.');
      return;
    }
    const { score, vector } = calcCvss(findingCvss);
    setSaveError('');
    try { addFinding({
      itemId: item.id,
      itemText: item.text,
      domain: domain.id,
      categoryName: category.name,
      severity: findingSeverity,
      title: findingTitle.trim(),
      description: findingDesc.trim(),
      cvss: score > 0 ? { score, vector } : undefined,
      screenshots: findingScreenshots.length > 0 ? findingScreenshots : undefined,
      cweId: item.cweId,
      owaspCategory: item.owaspCategory,
      remediation: item.remediation,
    }); } catch (error) { setSaveError(error instanceof Error ? error.message : 'Finding was not saved'); return; }
    setFindingTitle("");
    setFindingDesc("");
    setFindingCvss(DEFAULT_CVSS);
    setFindingSeverity('info');
    setFindingScreenshots([]);
    setShowFindingForm(false);
  }

  async function handleScreenshotUpload(files: FileList | null) {
    if (!files) return;
    try {
      if (files.length + findingScreenshots.length > MAX_SCREENSHOTS) throw new Error('Maximum four screenshots per finding');
      for (const file of Array.from(files)) if (file.size > MAX_SCREENSHOT_BYTES || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Use PNG, JPEG or WebP images no larger than 250 KB');
      const urls = await Promise.all(Array.from(files).map(readFileAsDataUrl));
      urls.forEach(url => validateScreenshot(url));
      setFindingScreenshots((s) => [...s, ...urls].slice(0, MAX_SCREENSHOTS));
    } catch (error) { alert(error instanceof Error ? error.message : 'Unable to read image'); }
  }

  return (
    <>
    {helpCommands && <CommandHelpModal commands={helpCommands} onClose={() => setHelpCommands(null)} />}
    <div className="border-b border-border/60 last:border-b-0">
      {saveError && <p role="alert" className="px-4 py-2 text-xs text-red-300">Not saved: {saveError}</p>}
      <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-0.5 shrink-0 text-slate-500 hover:text-slate-300"
          aria-label="Toggle details"
          aria-expanded={open}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <div className="min-w-0 flex-1">
          <button aria-expanded={open} onClick={() => setOpen((o) => !o)} className="block w-full text-left">
            <p className="text-sm text-slate-200">
              {itemIndex !== undefined && (
                <span className="font-mono text-xs font-semibold text-slate-500 mr-1.5">
                  {itemIndex}.
                </span>
              )}
              {item.text}
            </p>
          </button>
          <button type="button" aria-label={state?.bookmarked ? 'Remove follow-up bookmark' : 'Bookmark for follow-up'} aria-pressed={state?.bookmarked ?? false} className="mt-1 inline-flex items-center gap-1 text-xs text-amber-300" onClick={() => {
            try { toggleBookmark(item.id); setSaveError(''); } catch (error) { setSaveError(error instanceof Error ? error.message : 'Bookmark was not saved'); }
          }}><Bookmark className="h-3 w-3" fill={state?.bookmarked ? 'currentColor' : 'none'} />{state?.bookmarked ? 'Bookmarked' : 'Follow up'}</button>
          {item.isCustom && <button type="button" className="ml-3 mt-1 text-xs text-red-400" onClick={() => { if (confirm('Delete this custom check and its progress? Saved findings will be retained.')) deleteCustomItem(category.id, item.id); }}>Delete custom check</button>}
          {item.isCustom && <button type="button" className="ml-3 mt-1 text-xs text-slate-300" onClick={() => { const text = prompt('Rename custom check', item.text); if (text?.trim()) renameCustomItem(category.id, item.id, text); }}>Rename</button>}

          <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
            <SeverityBadge severity={item.severity} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPlaybook(true);
              }}
              className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400"
            >
              <FlaskConical className="h-3 w-3" />
              Playbook
            </button>
            <StatusSelect value={status} onChange={handleStatusChange} severity={item.severity} />
          </div>

          {open && (
            <div className="mt-3 space-y-2.5 rounded-md bg-black/20 p-3 text-xs text-slate-400">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                <div className="flex items-center gap-2 text-emerald-300">
                  <FlaskConical className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-xs">
                    Multiple testing methodologies &amp; tool playbooks available.
                  </span>
                </div>
                <button
                  onClick={() => setShowPlaybook(true)}
                  className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow hover:bg-emerald-500 transition"
                >
                  View Playbook
                </button>
              </div>

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
                            {p.startsWith("http://") || p.startsWith("https://") ? (
                              <a
                                href={p}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-0.5 shrink-0 rounded p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                                title="Open URL in new tab"
                                aria-label="Open URL in new tab"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                            <button
                              onClick={() => copyPayload(p, i)}
                              className="mt-0.5 shrink-0 rounded p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                              title="Copy payload"
                              aria-label="Copy payload"
                            >
                              {copiedPayloadIdx === i ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {refs.length > 0 && (
                              <button
                                onClick={() => setHelpCommands(refs)}
                                className="mt-0.5 shrink-0 rounded p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
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
                    <span className="font-medium text-red-400">Candidate / supporting evidence: </span>
                    {item.expectedResponse.vulnerable}
                  </p>
                  <p>
                    <span className="font-medium text-emerald-400">Expected protected behaviour for this test: </span>
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
                  key={state?.note ?? ''}
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

              {itemFindings.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-300">Saved findings ({itemFindings.length}):</span>
                  {itemFindings.map((f) => (
                    <div key={f.id} className="rounded border border-red-600/30 bg-red-950/10 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-red-300">{f.title}</p>
                        <div className="flex shrink-0 items-center gap-2">
                          {f.cvss && (
                            <span className="font-mono text-[10px] text-amber-400">CVSS {f.cvss.score.toFixed(1)}</span>
                          )}
                          <button
                            onClick={() => { try { removeFinding(f.id); setSaveError(''); } catch (error) { setSaveError(error instanceof Error ? error.message : 'Unable to delete finding'); } }}
                            className="text-[10px] text-slate-500 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {f.description && (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-slate-400">{f.description}</p>
                      )}
                      {f.cvss && <p className="mt-1 break-all font-mono text-[10px] text-slate-600">{f.cvss.vector}</p>}
                      {f.screenshots && f.screenshots.length > 0 && (
                        <div className="mt-1 text-[10px] text-slate-500">{f.screenshots.length} screenshot(s) attached <button className="ml-2 text-red-300" onClick={() => {
                          if (!confirm('Remove all screenshots from this finding? Export a backup first if you need to retain them.')) return;
                          try { clearFindingScreenshots(f.id); setSaveError(''); } catch (error) { setSaveError(error instanceof Error ? error.message : 'Unable to remove screenshots'); }
                        }}>Remove screenshots</button></div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {status === "vulnerable" && !showFindingForm && (
                <button
                  onClick={() => {
                    setFindingTitle((t) => t || item.text);
                    setShowFindingForm(true);
                  }}
                  className="rounded border border-red-600/40 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-950/30"
                >
                  + Add {itemFindings.length > 0 ? "another " : ""}finding
                </button>
              )}

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

                  <CvssPicker value={findingCvss} onChange={metrics => {
                    setFindingCvss(metrics);
                    const score = calcCvss(metrics).score;
                    setFindingSeverity(score === 0 ? 'info' : cvssSeverityLabel(score).toLowerCase() as Severity);
                  }} />
                  <label className="block text-xs text-slate-300">
                    Researcher-assessed severity (not the checklist priority)
                    <select aria-label="Finding severity" value={findingSeverity} onChange={event => setFindingSeverity(event.target.value as Severity)} className="mt-1 block rounded border border-border bg-slate-900 p-1">
                      {(['info', 'low', 'medium', 'high', 'critical'] as const).map(value => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <p className="text-[11px] text-slate-400">CVSS updates the suggested severity. Any override needs an evidence-based explanation in the description. Zero/no score does not establish absence of a vulnerability.</p>

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
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaybook(true);
            }}
            title="Open Testing Methods & Real-World Use Cases Playbook"
            className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Methods</span>
          </button>
          <SeverityBadge severity={item.severity} />
          <StatusSelect value={status} onChange={handleStatusChange} severity={item.severity} />
        </div>
      </div>
    </div>

    {showPlaybook && (
      <Suspense fallback={<p role="status">Loading playbook…</p>}>
      <TestingMethodsModal
        item={item}
        category={category}
        domain={domain}
        itemIndex={itemIndex}
        open={showPlaybook}
        onClose={() => setShowPlaybook(false)}
      />
      </Suspense>
    )}
    </>
  );
}
