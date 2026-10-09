import { useMemo, useState } from "react";
import { X, Copy } from "lucide-react";
import { Modal } from "./Modal";
import { webCategories } from "../data/web";
import { apiCategories } from "../data/api";
import { parseRawHttpRequest, analyzeRequestForAttacks, generateCurl, generatePython, generateNucleiTemplate, type SuggestedCategoryId } from "../lib/httpTools";

interface HttpAnalyzerModalProps { open: boolean; onClose: () => void; onNavigateToCategory?: (categoryId: SuggestedCategoryId) => void }
export function HttpAnalyzerModal({open,onClose,onNavigateToCategory}: HttpAnalyzerModalProps) {
  const [raw,setRaw] = useState("");
  const [tab,setTab] = useState<"analysis"|"curl"|"python"|"nuclei">("analysis");
  const [message,setMessage] = useState("");
  const req = useMemo(() => parseRawHttpRequest(raw),[raw]);
  const suggestions = useMemo(() => req ? analyzeRequestForAttacks(req) : [],[req]);
  const output = req ? tab === "curl" ? generateCurl(req) : tab === "python" ? generatePython(req) : generateNucleiTemplate(req) : "";
  if (!open) return null;
  return <Modal onClose={onClose} title="HTTP request analyzer" className="w-full max-w-5xl">
    <section className="flex h-[82vh] w-full flex-col rounded-xl border border-border bg-card p-5 shadow-2xl">
      <header className="flex items-center justify-between"><h2 className="text-lg font-bold">HTTP request analyzer</h2><button aria-label="Close HTTP analyzer" onClick={onClose}><X /></button></header>
      <p className="my-2 text-xs text-slate-400">Inspect requests and generate replay scaffolds. Suggestions are hypotheses, not detected vulnerabilities.</p>
      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2">
          <label htmlFor="http-raw" className="text-sm">Raw HTTP/1 request</label>
          <textarea autoFocus id="http-raw" value={raw} onChange={e => setRaw(e.target.value)} className="min-h-40 flex-1 rounded border border-border bg-slate-950 p-3 font-mono text-xs" placeholder={'GET /api/users?id=1&id=2 HTTP/1.1\r\nHost: example.com\r\n\r\n'} />
          {raw && !req && <p role="alert" className="text-xs text-red-400">Invalid or unsupported HTTP/1 request. Include one Host header. Folded headers, CONNECT, binary NUL and ambiguous requests are unsupported.</p>}
          {req && <><p className="text-xs">{req.headerEntries.length} headers · {req.queryParams.length} query values · {req.formParams.length} form values · {req.bodyType}</p>{req.warnings.map(w => <p key={w} className="text-xs text-amber-300">{w}</p>)}</>}
        </div>
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-wrap gap-2">{(["analysis","curl","python","nuclei"] as const).map(t => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`rounded border px-3 py-1 text-xs ${tab === t ? "border-emerald-400 text-emerald-400" : "border-border"}`}>{t}</button>)}</div>
          <div className="flex-1 overflow-auto">
            {tab === "analysis" ? <div className="space-y-3">{suggestions.map(s => <article key={s.categoryLink} className="rounded border border-border p-3"><h3 className="text-sm font-semibold">{s.title}</h3><p className="my-2 text-xs text-slate-400">{s.description}</p>{onNavigateToCategory && [...webCategories,...apiCategories].some(c => c.id === s.categoryLink) && <button className="text-xs text-emerald-400" onClick={() => {onNavigateToCategory(s.categoryLink);onClose();}}>Go to checks</button>}</article>)}{req && !suggestions.length && <p className="text-xs">No specific candidates identified. This does not establish that the endpoint is secure.</p>}</div> : <><button className="mb-2 flex gap-2 text-xs" onClick={async () => {try {await navigator.clipboard.writeText(output);setMessage("Copied");} catch {setMessage("Copy failed; select the output manually.");}}}><Copy size={14}/>Copy scaffold</button><pre className="whitespace-pre-wrap break-all rounded bg-slate-950 p-3 text-xs">{output}</pre></>}
          </div><p role="status" className="text-xs">{message}</p>
        </div>
      </div>
    </section>
  </Modal>;
}
