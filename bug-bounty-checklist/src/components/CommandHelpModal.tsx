import { X } from "lucide-react";
import { commandReference } from "../data/commandReference";

export function CommandHelpModal({ commands, onClose }: { commands: string[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border/60 bg-slate-900 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Command reference</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {commands.map((name) => {
            const ref = commandReference[name];
            if (!ref) return null;
            return (
              <div key={name}>
                <p className="font-mono text-sm font-semibold text-emerald-400">{name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{ref.summary}</p>
                {ref.flags.length > 0 && (
                  <ul className="mt-2 space-y-1 border-l border-border/60 pl-3">
                    {ref.flags.map((f) => (
                      <li key={f.flag} className="text-xs">
                        <code className="text-slate-300">{f.flag}</code>
                        <span className="text-slate-500"> — {f.desc}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
