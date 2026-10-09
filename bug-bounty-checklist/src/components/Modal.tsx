import { useEffect, useRef, type ReactNode } from 'react';

/** Native modal supplies focus trapping, inert background, Escape and focus restoration. */
export function Modal({ open = true, onClose, title, children, className = '' }: { open?: boolean; onClose: () => void; title: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    if (open) dialog?.showModal(); else dialog?.close();
    return () => { dialog?.close(); previous?.focus(); };
  }, [open]);
  return <dialog ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className={`m-auto max-h-[90vh] overflow-y-auto border-0 bg-transparent p-4 text-slate-200 backdrop:bg-black/75 ${className}`}>{children}</dialog>;
}
