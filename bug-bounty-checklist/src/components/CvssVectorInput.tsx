import { useState } from "react";

/** Text field to paste a CVSS vector string; applies it on paste/change when it parses. */
export function CvssVectorInput<T>({
  parse,
  onApply,
  placeholder,
}: {
  parse: (s: string) => T | null;
  onApply: (m: T) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState(false);

  const handle = (raw: string) => {
    setText(raw);
    if (!raw.trim()) return setInvalid(false);
    const parsed = parse(raw);
    setInvalid(!parsed);
    if (parsed) onApply(parsed);
  };

  return (
    <div>
      <input
        aria-label="CVSS base vector"
        aria-invalid={invalid}
        value={text}
        onChange={(e) => handle(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className={`w-full rounded border bg-transparent px-2 py-1 font-mono text-[11px] text-slate-300 outline-none ${
          invalid ? "border-red-500/60" : "border-border/60"
        }`}
      />
      <p className="mt-0.5 text-[10px] text-slate-400">Base metrics only. Include the exact version prefix and every required metric; optional metrics are unsupported.</p>
      {invalid && <p role="alert" className="mt-0.5 text-[10px] text-red-400">Invalid or unsupported base vector (missing, duplicate, malformed or optional metrics).</p>}
    </div>
  );
}
