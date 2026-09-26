import { useState } from "react";
import {
  X,
  FlaskConical,
  Copy,
  Check,
  Wrench,
  Lightbulb,
  ExternalLink,
  Code2,
} from "lucide-react";
import type {
  ChecklistCategory,
  ChecklistDomain,
  ChecklistItem,
} from "../types/checklist";
import { getItemPlaybook } from "../lib/playbooks";
import { SeverityBadge } from "./SeverityBadge";

export function TestingMethodsModal({
  item,
  category,
  domain,
  itemIndex,
  open,
  onClose,
}: {
  item: ChecklistItem;
  category: ChecklistCategory;
  domain: ChecklistDomain;
  itemIndex?: number;
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"methods" | "payloads">("methods");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedMethodIdx, setSelectedMethodIdx] = useState(0);

  if (!open) return null;

  const { methods } = getItemPlaybook(item, category, domain);

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  const currentMethod = methods[selectedMethodIdx] || methods[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="border-b border-border p-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <SeverityBadge severity={item.severity} />
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 uppercase">
                  {domain.emoji} {domain.label}
                </span>
                <span className="text-xs text-slate-500">· {category.name}</span>
              </div>
              <h2 className="text-base font-bold text-slate-100 sm:text-lg">
                {itemIndex !== undefined && (
                  <span className="font-mono text-emerald-400 mr-2">#{itemIndex}</span>
                )}
                {item.text}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex border-b border-border/70 -mb-4">
            <button
              onClick={() => setActiveTab("methods")}
              className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "methods"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" /> Testing Methods ({methods.length})
            </button>
            <button
              onClick={() => setActiveTab("payloads")}
              className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "payloads"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" /> Payloads & Cheatsheet
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: TESTING METHODS */}
          {activeTab === "methods" && (
            <div className="space-y-4">
              {/* Method Selector Pills */}
              <div className="flex flex-wrap gap-2 pb-2 border-b border-border/50">
                {methods.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedMethodIdx(idx)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      selectedMethodIdx === idx
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                        : "border border-border/70 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    Method {idx + 1}
                  </button>
                ))}
              </div>

              {/* Selected Method Details */}
              {currentMethod && (
                <div className="space-y-4 rounded-xl border border-border/70 bg-slate-900/40 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/50 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 sm:text-base">
                        {currentMethod.title}
                      </h3>
                      {currentMethod.scenario && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          Target Context: <span className="text-slate-300">{currentMethod.scenario}</span>
                        </p>
                      )}
                    </div>

                    {currentMethod.tools && currentMethod.tools.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> Tools:
                        </span>
                        {currentMethod.tools.map((tool, i) => (
                          <span
                            key={i}
                            className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-border/60"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Step-by-Step Execution
                    </h4>
                    <ol className="space-y-2.5">
                      {currentMethod.steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
                            {sIdx + 1}
                          </span>
                          <span className="mt-0.5 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Method Specific Payloads */}
                  {currentMethod.payloads && currentMethod.payloads.length > 0 && (
                    <div className="rounded-lg border border-border/60 bg-slate-950 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-400">
                          Payloads / Sample Requests
                        </span>
                      </div>
                      <div className="space-y-2">
                        {currentMethod.payloads.map((payload, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-start justify-between gap-2 rounded bg-black/40 p-2 font-mono text-xs text-amber-300"
                          >
                            <pre className="whitespace-pre-wrap break-all select-all font-sans sm:font-mono">
                              {payload}
                            </pre>
                            <button
                              onClick={() => copyText(payload, `method-pay-${pIdx}`)}
                              className="shrink-0 rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                              title="Copy payload"
                            >
                              {copiedKey === `method-pay-${pIdx}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pro Tip / Gotcha */}
                  {currentMethod.tips && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-950/10 p-3 text-xs text-amber-300">
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-300">Hunter Pro Tip: </span>
                        <span className="text-slate-300">{currentMethod.tips}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAYLOADS & CHEATSHEET */}
          {activeTab === "payloads" && (
            <div className="space-y-4">
              {/* How-to summary */}
              <div className="rounded-lg border border-border/70 bg-slate-900/60 p-3.5">
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Primary Checklist Methodology:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{item.how}</p>
              </div>

              {/* Ready Payloads */}
              {item.payloads && item.payloads.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">
                    Copy-Ready Payloads & Commands:
                  </span>
                  {item.payloads.map((payload, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border/70 bg-slate-950 p-3"
                    >
                      <div className="flex items-start justify-between gap-2 font-mono text-xs text-emerald-400">
                        <code className="whitespace-pre-wrap break-all select-all">
                          {payload}
                        </code>
                        <button
                          onClick={() => copyText(payload, `cheatsheet-${idx}`)}
                          className="flex shrink-0 items-center gap-1 rounded border border-border bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                        >
                          {copiedKey === `cheatsheet-${idx}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                      </div>
                      {item.payloadNotes?.[idx] && (
                        <p className="mt-2 text-[11px] text-slate-400 border-t border-border/40 pt-1.5">
                          {item.payloadNotes[idx]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Verdict Indicator */}
              {item.expectedResponse && (
                <div className="space-y-2 rounded-lg border border-border/70 bg-slate-900/40 p-3 text-xs">
                  <span className="font-semibold text-slate-300 block mb-1">
                    How to Read the Result:
                  </span>
                  <div className="flex items-start gap-2 text-rose-400">
                    <span className="font-semibold shrink-0">🔴 Vulnerable:</span>
                    <span className="text-slate-300">{item.expectedResponse.vulnerable}</span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-400">
                    <span className="font-semibold shrink-0">🟢 Safe:</span>
                    <span className="text-slate-300">{item.expectedResponse.safe}</span>
                  </div>
                </div>
              )}

              {(item.reference || category.reference) && (
                <div className="pt-2">
                  <a
                    href={item.reference || category.reference}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:underline"
                  >
                    <span>Official Guide & Documentation</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
