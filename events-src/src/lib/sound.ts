let ctx: AudioContext | null = null;

/** Browsers only allow audio after a user gesture; call this from a click/keypress handler. */
export function unlockSound(): void {
  ctx ??= new AudioContext();
  void ctx.resume();
}

function tone(freq: number, delay: number, duration: number, volume: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t = ctx.currentTime + delay;
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Two-tone arrival chime. */
export function chime(): void {
  tone(784, 0, 0.55, 0.16);
  tone(622, 0.3, 0.8, 0.16);
}

/** Quiet tick as the dragged train passes a day. */
export function tick(): void {
  tone(1500, 0, 0.04, 0.04);
}
