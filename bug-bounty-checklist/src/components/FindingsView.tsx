import { useState } from "react";
import { Trash2, Copy, Check, Download, FileText, Printer } from "lucide-react";
import { useActiveProfile, useChecklistStore } from "../store/useChecklistStore";
import { SeverityBadge } from "./SeverityBadge";
import type { Finding } from "../types/checklist";
import { isSafeDataImage } from "../lib/reportSafety";
import { formatFinding, generateExecutiveHtml, type TemplateType } from "../lib/reportExport";

export function FindingsView() {
  const profile = useActiveProfile();
  const removeFinding = useChecklistStore(s => s.removeFinding);
  const clearFindingScreenshots = useChecklistStore(s => s.clearFindingScreenshots);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateType>("standard");
  const [notice, setNotice] = useState<{profileId: string; error: boolean; text: string} | null>(null);

  function exportMarkdown() {
    if (!profile?.findings.length) return;
    const headerTitle = template === "hackerone" ? `# HackerOne Report — ${profile.name}` : template === "bugcrowd" ? `# Bugcrowd Submission — ${profile.name}` : `# Security Findings Report — ${profile.name}`;
    const md = [headerTitle, `*Generated on: ${new Date().toLocaleDateString()}*`, "", ...profile.findings.map(f => formatFinding(f, template))].join("\n\n---\n\n");
    const url = URL.createObjectURL(new Blob([md], {type:"text/markdown"}));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, "_")}_${template}_report.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportExecutiveHtml() {
    if (!profile?.findings.length) return;
    const url = URL.createObjectURL(new Blob([generateExecutiveHtml(profile)], {type:"text/html"}));
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function copyFinding(f: Finding) {
    try {
      await navigator.clipboard.writeText(formatFinding(f, template));
      setCopiedId(f.id);
      setTimeout(() => setCopiedId(id => id === f.id ? null : id), 1500);
    } catch (error) {
      if (profile) setNotice({profileId:profile.id,error:true,text:error instanceof Error ? error.message : "Could not copy finding."});
    }
  }

  function removeEvidence(f: Finding) {
    if (!profile || !confirm("Remove all screenshots from this saved finding? The finding text will be kept.")) return;
    const profileId = profile.id;
    setNotice(null);
    try {
      // Persisted store mutations can throw on quota/storage errors. Only show
      // success after the action returns and the current saved state is empty.
      clearFindingScreenshots(f.id);
      const saved = useChecklistStore.getState().profiles[profileId]?.findings.find(item => item.id === f.id);
      if (!saved || saved.screenshots?.length) throw new Error("Screenshot removal could not be confirmed.");
      setNotice({profileId,error:false,text:"Screenshots removed from the saved finding."});
    } catch (error) {
      setNotice({profileId,error:true,text:`Could not save screenshot removal: ${error instanceof Error ? error.message : "Storage update failed."}`});
    }
  }

  if (!profile) return null;
  return <div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div><h2 className="text-xl font-bold text-slate-100">🐞 Findings ({profile.findings.length}) — {profile.name}</h2><p className="text-xs text-slate-400">Export executive HTML reports or copy individual findings formatted for security reports.</p></div>
      {profile.findings.length > 0 && <div className="flex flex-wrap items-center gap-2">
        <button onClick={exportExecutiveHtml} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40" title="Generate printable Executive HTML / PDF Report"><Printer className="h-3.5 w-3.5"/>Executive HTML / PDF</button>
        <label className="flex items-center gap-1.5 rounded-lg border border-border bg-slate-900/60 px-2.5 py-1"><span className="text-[11px] text-slate-400">Template:</span><select value={template} onChange={e => setTemplate(e.target.value as TemplateType)} className="bg-transparent text-xs font-semibold text-emerald-400 outline-none"><option value="standard" className="bg-slate-900 text-slate-200">Standard Markdown</option><option value="hackerone" className="bg-slate-900 text-slate-200">HackerOne Format</option><option value="bugcrowd" className="bg-slate-900 text-slate-200">Bugcrowd Format</option></select></label>
        <button onClick={exportMarkdown} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"><Download className="h-3.5 w-3.5"/>Export (.md)</button>
      </div>}
    </div>
    {notice?.profileId === profile.id && <p role={notice.error ? "alert" : "status"} className={`mb-4 rounded border p-3 text-xs ${notice.error ? "border-red-500/40 text-red-300" : "border-emerald-500/40 text-emerald-300"}`}>{notice.text}</p>}
    {!profile.findings.length ? <div className="rounded-xl border border-dashed border-border/80 p-12 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-slate-600"/><p className="text-sm font-semibold text-slate-300">No findings saved yet</p><p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">Mark any checklist item as <span className="font-semibold text-red-400">Vulnerable</span> to document reproduction steps and add it to this report.</p></div> : <div className="space-y-4">
      {profile.findings.map(f => <div key={f.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={f.severity}/><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 uppercase">{f.domain}</span><span className="text-xs text-slate-500">· {f.categoryName}</span>{f.cweId && <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-mono text-blue-400 border border-blue-500/20">{f.cweId}</span>}</div>
            <h3 className="mt-1.5 text-base font-bold text-slate-100">{f.title}</h3><p className="text-xs text-slate-400">Check: <span className="text-slate-300">{f.itemText}</span></p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => copyFinding(f)} className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-slate-300 hover:bg-white/5" title={`Copy as ${template} markdown`}>{copiedId === f.id ? <Check className="h-3.5 w-3.5 text-emerald-400"/> : <Copy className="h-3.5 w-3.5"/>}Copy</button>
            <button onClick={() => {if (confirm("Delete this finding?")) {try {removeFinding(f.id);} catch(error) {setNotice({profileId:profile.id,error:true,text:error instanceof Error ? error.message : "Could not delete finding."});}}}} className="rounded-md p-1.5 text-slate-500 hover:bg-red-950/40 hover:text-red-400" title="Delete finding" aria-label={`Delete finding: ${f.title}`}><Trash2 className="h-3.5 w-3.5"/></button>
          </div>
        </div>
        {f.cvss && <div className="mt-2.5 flex items-center gap-2 rounded bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-400"><span>CVSS {f.cvss.score.toFixed(1)}</span><span className="text-slate-600">|</span><span className="font-mono text-slate-500 truncate">{f.cvss.vector}</span></div>}
        {f.description && <div className="mt-3 rounded-lg border border-border/60 bg-slate-950 p-3 text-xs text-slate-300 whitespace-pre-wrap font-sans">{f.description}</div>}
        {f.remediation && <div className="mt-2.5 rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-2.5 text-xs text-emerald-300/90"><span className="font-semibold text-emerald-400 block mb-0.5">Remediation:</span>{f.remediation}</div>}
        {!!f.screenshots?.length && <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-3"><span className="text-xs text-slate-400">{f.screenshots.length} saved screenshot(s)</span><button onClick={() => removeEvidence(f)} className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-300">Remove saved screenshots</button></div>
          {f.screenshots.some(s => !isSafeDataImage(s)) && <p className="text-xs text-amber-300">Some legacy or unsupported images are hidden. Remove saved screenshots to clear this evidence from the profile.</p>}
          <div className="flex flex-wrap gap-2">{f.screenshots.filter(isSafeDataImage).map((s,idx) => <img key={idx} src={s} alt={`Finding screenshot ${idx + 1}`} className="h-20 w-32 rounded border border-border object-cover"/>)}</div>
        </div>}
      </div>)}
    </div>}
  </div>;
}
