import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Split-flap effect: letters scramble, then settle left to right. Instant with reduced motion. */
export function useFlap(text: string, reduced: boolean): string {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (reduced) {
      setShown(text);
      return;
    }
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const c = text.charAt(i);
        out += c === " " || frame > 3 + i * 0.55 ? c : CHARS.charAt(Math.floor(Math.random() * CHARS.length));
      }
      setShown(out);
      if (frame > 4 + text.length * 0.55) {
        clearInterval(id);
        setShown(text);
      }
    }, 36);
    return () => clearInterval(id);
  }, [text, reduced]);
  return shown;
}
