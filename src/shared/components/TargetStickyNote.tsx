import { useState, useRef } from "react";
import {
  Pin,
  Copy,
  Check,
  Trash2,
  Minimize2,
  Maximize2,
  Key,
  Globe,
  ListTodo,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useActiveProfile, useChecklistStore } from "@/shared/store/useChecklistStore";
import { useTargetContext } from "@/shared/store/useTargetContext";

interface TargetStickyNoteProps {
  /** If rendered in the desktop right rail */
  isDocked?: boolean;
}

const STORAGE_MINIMIZED_KEY = "bbc-sticky-note-minimized";

export function TargetStickyNote({ isDocked = false }: TargetStickyNoteProps) {
  const profile = useActiveProfile();
  const setScratchpad = useChecklistStore((s) => s.setScratchpad);

  const targetDomain = useTargetContext((s) => s.targetDomain);
  const subdomain = useTargetContext((s) => s.subdomain);
  const originIp = useTargetContext((s) => s.originIp);

  const [text, setText] = useState(profile?.scratchpad || "");
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [minimized, setMinimized] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_MINIMIZED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state whenever the active profile changes
  const [prevProfileId, setPrevProfileId] = useState(profile?.id);
  if (profile?.id !== prevProfileId) {
    setPrevProfileId(profile?.id);
    setText(profile?.scratchpad || "");
    setSaveStatus("idle");
  }

  const handleToggleMinimize = () => {
    const next = !minimized;
    setMinimized(next);
    try {
      localStorage.setItem(STORAGE_MINIMIZED_KEY, String(next));
    } catch {
      // ignore
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    setSaveStatus("saving");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        setScratchpad(val);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } catch (err) {
        console.error("Failed to save scratchpad", err);
        setSaveStatus("idle");
      }
    }, 400);
  };

  const handleCopy = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleClear = () => {
    if (!text.trim()) return;
    if (window.confirm(`Clear all sticky notes for target "${profile?.name || "current target"}"?`)) {
      handleTextChange("");
    }
  };

  const insertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      handleTextChange(text ? `${text}\n${snippet}` : snippet);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const separator = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
    const updated = `${before}${separator}${snippet}${after}`;

    handleTextChange(updated);

    // Reposition cursor
    setTimeout(() => {
      el.focus();
      const nextPos = start + separator.length + snippet.length;
      el.setSelectionRange(nextPos, nextPos);
    }, 50);
  };

  const linesCount = text.split("\n").filter((l) => l.trim().length > 0).length;
  const charsCount = text.length;

  if (!profile) return null;

  // ─── DESKTOP DOCKED VIEW ───────────────────────────────────────────────────
  if (isDocked) {
    if (minimized) {
      return (
        <div className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-3 shadow-lg shadow-amber-950/20 backdrop-blur-md transition-all hover:border-amber-500/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                <Pin className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-amber-200 truncate">
                {profile.name} Notes
              </span>
            </div>
            <button
              onClick={handleToggleMinimize}
              title="Expand Target Sticky Note"
              className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Expand</span>
            </button>
          </div>
          {linesCount > 0 && (
            <p className="mt-2 text-[11px] text-slate-400">
              📌 {linesCount} saved {linesCount === 1 ? "line" : "lines"}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col rounded-xl border border-amber-500/35 bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-950/95 shadow-xl shadow-amber-950/30 backdrop-blur-md">
        {/* Sticky Note Top Header Bar */}
        <div className="flex items-center justify-between border-b border-amber-500/25 px-3.5 py-2.5 bg-amber-500/10 rounded-t-xl">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20">
              <Pin className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-200">
                  Sticky Note
                </span>
                <span className="truncate rounded bg-slate-900/80 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  {profile.name}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {saveStatus === "saving" && (
              <span className="text-[10px] text-amber-400 animate-pulse font-mono mr-1">
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium mr-1">
                <Check className="h-2.5 w-2.5" /> Saved
              </span>
            )}

            <button
              onClick={handleCopy}
              disabled={!text.trim()}
              title="Copy all notes to clipboard"
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200 disabled:opacity-40 transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              onClick={handleClear}
              disabled={!text.trim()}
              title="Clear notes for this target"
              className="rounded p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleToggleMinimize}
              title="Minimize Sticky Note"
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Insert Snippet Chips */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border/50 bg-slate-950/40 px-3 py-1.5 text-[10px]">
          <span className="text-slate-400 text-[10px] font-medium mr-0.5">
            Insert:
          </span>
          <button
            onClick={() => insertSnippet("- [ ] ")}
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 hover:bg-slate-700 hover:text-cyan-300 transition-colors border border-border/60"
            title="Add Todo task"
          >
            <ListTodo className="h-2.5 w-2.5 text-cyan-400" /> Todo
          </button>
          <button
            onClick={() => insertSnippet("🔑 Creds:\n  - user: \n  - pass: ")}
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 hover:bg-slate-700 hover:text-amber-300 transition-colors border border-border/60"
            title="Add Credentials template"
          >
            <Key className="h-2.5 w-2.5 text-amber-400" /> Creds
          </button>
          <button
            onClick={() =>
              insertSnippet(
                `🔗 Endpoint:\n  - URL: https://${targetDomain || profile.name}/\n  - Method: GET\n  - Param: `
              )
            }
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 hover:bg-slate-700 hover:text-emerald-300 transition-colors border border-border/60"
            title="Add Endpoint snippet"
          >
            <Globe className="h-2.5 w-2.5 text-emerald-400" /> URL
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const stamp = `[${now.getHours().toString().padStart(2, "0")}:${now
                .getMinutes()
                .toString()
                .padStart(2, "0")}] `;
              insertSnippet(stamp);
            }}
            className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 hover:bg-slate-700 hover:text-purple-300 transition-colors border border-border/60"
            title="Add current timestamp"
          >
            <Clock className="h-2.5 w-2.5 text-purple-400" /> Time
          </button>
        </div>

        {/* Textarea Workspace */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`📌 Sticky notes for ${profile.name}...\n\n• Found test accounts (user/pass)\n• Weird response codes or 403 endpoints\n• Leaked API tokens & JWTs\n• Specific checklists to test later`}
            rows={12}
            className="w-full resize-y rounded-lg border border-amber-500/20 bg-slate-950/70 p-2.5 font-mono text-xs leading-relaxed text-amber-100 placeholder-slate-500 shadow-inner focus:border-amber-500/60 focus:bg-slate-950 focus:outline-none"
          />
        </div>

        {/* Target Context Quick Pills */}
        {(targetDomain || subdomain || originIp) && (
          <div className="border-t border-border/40 bg-slate-950/50 px-3 py-1.5">
            <p className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-cyan-400" /> Quick Target
              Tokens:
            </p>
            <div className="flex flex-wrap gap-1">
              {targetDomain && (
                <button
                  onClick={() => insertSnippet(targetDomain)}
                  title="Click to insert target domain into note"
                  className="rounded bg-cyan-950/50 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300 border border-cyan-800/40 hover:bg-cyan-900/50 transition-colors"
                >
                  {targetDomain}
                </button>
              )}
              {subdomain && (
                <button
                  onClick={() => insertSnippet(subdomain)}
                  title="Click to insert subdomain into note"
                  className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 border border-border hover:bg-slate-700 transition-colors"
                >
                  {subdomain}
                </button>
              )}
              {originIp && (
                <button
                  onClick={() => insertSnippet(originIp)}
                  title="Click to insert origin IP into note"
                  className="rounded bg-amber-950/50 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 border border-amber-800/40 hover:bg-amber-900/50 transition-colors"
                >
                  {originIp}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Note Footer */}
        <div className="flex items-center justify-between border-t border-amber-500/20 px-3 py-2 text-[10px] text-slate-400 bg-slate-950/80 rounded-b-xl">
          <span className="font-mono">
            {linesCount} {linesCount === 1 ? "line" : "lines"} • {charsCount}{" "}
            chars
          </span>
          <span className="text-amber-400/80 font-medium">
            Auto-saved to {profile.name}
          </span>
        </div>
      </div>
    );
  }

  // ─── FLOATING BUTTON & SLIDE-OVER DRAWER (For < xl or compact mode) ─────────
  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setDrawerOpen(true)}
        title={`Open Sticky Notes for ${profile.name}`}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-xl shadow-amber-950/60 hover:scale-105 hover:from-amber-500 hover:to-amber-600 transition-all duration-200 xl:hidden"
      >
        <Pin className="h-3.5 w-3.5 fill-white" />
        <span>Sticky Note</span>
        <span className="rounded-full bg-slate-950/40 px-1.5 py-0.2 text-[10px] font-mono text-amber-200">
          {linesCount}
        </span>
      </button>

      {/* Slide-over Drawer for Mobile / Compact */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm xl:hidden">
          <div className="relative flex h-full w-full max-w-md flex-col bg-slate-900 border-l border-amber-500/30 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-amber-500/30 bg-amber-950/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Pin className="h-4 w-4 fill-amber-400" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-amber-200">
                    Target Sticky Note
                  </h3>
                  <p className="text-[11px] font-mono text-cyan-300">
                    {profile.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  title="Copy note"
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  title="Close Drawer"
                  className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Inserts */}
            <div className="flex flex-wrap gap-1.5 border-b border-border bg-slate-950/60 p-2.5">
              <button
                onClick={() => insertSnippet("- [ ] ")}
                className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 border border-border"
              >
                <ListTodo className="h-3 w-3 text-cyan-400" /> Todo
              </button>
              <button
                onClick={() =>
                  insertSnippet("🔑 Creds:\n  - user: \n  - pass: ")
                }
                className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 border border-border"
              >
                <Key className="h-3 w-3 text-amber-400" /> Creds
              </button>
              <button
                onClick={() =>
                  insertSnippet(
                    `🔗 Endpoint:\n  - URL: https://${targetDomain || profile.name}/\n  - Method: GET\n  - Param: `
                  )
                }
                className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 border border-border"
              >
                <Globe className="h-3 w-3 text-emerald-400" /> URL
              </button>
              <button
                onClick={() =>
                  insertSnippet("⚡ PoC / Payload:\n  - Parameter: \n  - Payload: ")
                }
                className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 border border-border"
              >
                <ShieldAlert className="h-3 w-3 text-rose-400" /> PoC
              </button>
            </div>

            {/* Textarea */}
            <div className="flex-1 p-4">
              <textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`📌 Notes for ${profile.name}...\n\nSave credentials, subdomains, payload snippets, and findings here.`}
                className="h-full w-full resize-none rounded-xl border border-amber-500/25 bg-slate-950/80 p-3 font-mono text-xs leading-relaxed text-amber-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-between border-t border-border bg-slate-950 p-3 text-xs text-slate-400">
              <span className="font-mono">
                {linesCount} lines • {charsCount} chars
              </span>
              <span className="text-emerald-400 font-medium">
                {saveStatus === "saving" ? "Saving..." : "Auto-saved"}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
