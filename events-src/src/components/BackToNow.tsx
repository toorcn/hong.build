import { Icon } from "./Icon";
import { useEffect, useState, type RefObject } from "react";

interface Props {
  scrollRef: RefObject<HTMLDivElement | null>;
  onBack(): void;
}

export function BackToNow({ scrollRef, onBack }: Props) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setShow(el.scrollTop > 120);
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [scrollRef]);
  return (
    <button type="button" className={`tx-now${show ? " show" : ""}`} onClick={onBack} tabIndex={show ? 0 : -1} aria-hidden={!show}>
      <Icon name="arrow-up" size={14} />
      Back to now
    </button>
  );
}
