import { useEffect, type ReactNode } from "react";

interface Props {
  open: boolean;
  /** "sheet" slides up over the line (phones); "panel" sits beside it (desktop). */
  variant: "sheet" | "panel";
  label: string;
  onClose(): void;
  children: ReactNode;
}

export function Sheet({ open, variant, label, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (variant === "panel") {
    return (
      <section className="panel" aria-label={label}>
        {open ? children : <p className="aside-empty">Tap a station to see its ticket.</p>}
      </section>
    );
  }
  return (
    <>
      <div className={`tx-scrim${open ? " show" : ""}`} onClick={onClose} aria-hidden="true" />
      <div className={`tx-sheet${open ? " show" : ""}`} role="dialog" aria-modal="true" aria-label={label} inert={!open}>
        {open && children}
      </div>
    </>
  );
}
