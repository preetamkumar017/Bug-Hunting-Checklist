import { useState } from "react";
import { X } from "lucide-react";
import { Modal } from "./Modal";
import { useChecklistStore, useActiveProfile } from "../store/useChecklistStore";
import { REPORT_PRESETS, newReportDraft, reportDraftIssues, generateReportDraft, type ReportDraft } from "../lib/reportDraft";
import type { Severity } from "../types/checklist";

export function ReportDrafterModal({open,onClose}: {open:boolean;onClose:()=>void}) {
  const profile = useActiveProfile();
  const addFinding = useChecklistStore(s => s.addFinding);
  const [presetId,setPresetId] = useState(REPORT_PRESETS[0].id);
  const [draft,setDraft] = useState(() => newReportDraft(REPORT_PRESETS[0]));
  const [confirmed,setConfirmed] = useState(false);
  const [message,setMessage] = useState("");
  const preset = REPORT_PRESETS.find(p => p.id === presetId)!;
  const issues = reportDraftIssues(draft);
  const canSave = !!profile && confirmed && issues.length === 0;
  const update = (key: keyof ReportDraft, value: string) => {setDraft(d => ({...d,[key]:value}));setConfirmed(false);};
  async function copy(template: "hackerone"|"bugcrowd") {try {await navigator.clipboard.writeText(generateReportDraft(draft,template,confirmed));setMessage("Draft copied; review its readiness notice.");} catch {setMessage("Clipboard failed. Your draft remains here.");}}
  function save() {
    if (!canSave) return;
    addFinding({itemId:`custom-${Date.now()}`,itemText:`${preset.label} on ${draft.targetUrl}`,domain:preset.domain,categoryName:preset.categoryName,severity:draft.severity,title:draft.title,description:`## Steps to reproduce\n${draft.steps}\n\n## Observed evidence\n${draft.evidence}\n\n## Demonstrated impact and limitations\n${draft.impact}`,remediation:draft.remediation,cweId:draft.cweId});
    setMessage("Saved researcher-reviewed finding.");setConfirmed(false);
  }
  if (!open) return null;
  return <Modal onClose={onClose} title="Vulnerability report drafter" className="w-full max-w-5xl">
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <header className="flex justify-between"><h2 className="text-lg font-bold">Vulnerability report drafter</h2><button aria-label="Close report drafter" onClick={onClose}><X/></button></header>
      <p className="text-xs text-slate-400">Evidence-first draft for {profile?.name || "your target"}. Templates provide guidance, not findings. Incomplete work can be copied as a clearly marked draft; saving a finding requires completing the fields and confirming the evidence.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">Template<select value={presetId} onChange={e => {const p=REPORT_PRESETS.find(p=>p.id===e.target.value)!;setPresetId(p.id);setDraft(newReportDraft(p));setConfirmed(false);}} className="mt-1 block w-full rounded bg-slate-950 p-2">{REPORT_PRESETS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <label className="text-xs">Researcher-assigned severity<select value={draft.severity} onChange={e=>update("severity",e.target.value as Severity)} className="mt-1 block w-full rounded bg-slate-950 p-2">{(["info","low","medium","high","critical"] as const).map(s=><option key={s} value={s}>{s === "info" ? "Informational (confirm after reviewing evidence)" : s}</option>)}</select></label>
      </div>
      <p className="rounded border border-border p-3 text-xs text-amber-200">{preset.guidance}</p>
      {([ ["title","Report title"],["targetUrl","Target endpoint / asset"],["cweId","CWE identifier"] ] as const).map(([key,label])=><label key={key} className="block text-xs">{label}<input value={draft[key]} onChange={e=>update(key,e.target.value)} className="mt-1 block w-full rounded border border-border bg-slate-950 p-2"/></label>)}
      {([ ["steps","Steps to reproduce"],["evidence","Observed evidence"],["impact","Demonstrated impact and limitations"],["remediation","Suggested remediation"] ] as const).map(([key,label])=><label key={key} className="block text-xs">{label}<textarea value={draft[key]} onChange={e=>update(key,e.target.value)} rows={4} className="mt-1 block w-full rounded border border-border bg-slate-950 p-2 font-mono"/></label>)}
      <label className="flex gap-2 text-xs"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I replaced placeholders, verified the evidence and limited impact/severity to what I demonstrated.</label>
      {issues.length > 0 && <ul className="text-xs text-amber-300">{issues.map(i=><li key={i}>{i}</li>)}</ul>}
      <footer className="flex flex-wrap gap-3 text-xs"><button onClick={()=>copy("hackerone")} className="rounded border border-border p-2">Copy HackerOne draft</button><button onClick={()=>copy("bugcrowd")} className="rounded border border-border p-2">Copy Bugcrowd draft</button><button disabled={!canSave} onClick={save} className="rounded bg-emerald-700 p-2 disabled:opacity-40">Save reviewed finding</button></footer><p role="status" className="text-xs">{message}</p>
    </section>
  </Modal>;
}
