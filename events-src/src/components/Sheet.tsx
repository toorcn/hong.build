import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  /** "sheet" slides up over the line (phones); "panel" sits beside it (desktop). */
  variant: "sheet" | "panel";
  label: string;
  onClose(): void;
  children: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, variant, label, onClose, children }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || variant !== "sheet" || !dialog.current) return;
      // The background is inert, so wrap Tab around inside the dialog instead of leaving the page.
      const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialog.current.contains(active) || active === dialog.current.querySelector("h2"))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, variant]);

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
      <div ref={dialog} className={`tx-sheet${open ? " show" : ""}`} role="dialog" aria-modal="true" aria-label={label} inert={!open}>
        {open && children}
      </div>
    </>
  );
}
