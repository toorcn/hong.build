"use client";

/**
 * Lab audio: synthesized UI tones + a quiet looping ambient bed.
 * Everything is a no-op until unlock() runs from a user gesture.
 * Ambient stays silent until beginAmbient() — used so the cold start
 * can finish before the bed fades in.
 */

type SoundName = "tick" | "lock" | "enter";

const AMBIENT_URL = "/audio/ambient.mp3";
/** Bed level — stays under the UI ticks. */
const AMBIENT_LEVEL = 0.16;
const UI_MASTER_LEVEL = 0.5;

class LabSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientBuffer: AudioBuffer | null = null;
  private ambientLoad: Promise<AudioBuffer | null> | null = null;
  private muted = false;
  /** False until the entrance (or a returning visit) releases the bed. */
  private ambientAllowed = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.syncAmbient();
    if (muted && this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0.0001, now, 0.04);
    }
  }

  /**
   * Create/resume the context and preload the ambient buffer.
   * Does not audibly start the bed unless beginAmbient() has already run.
   * Must be called from a user gesture.
   */
  async unlock(): Promise<void> {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.0001;
      this.master.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.0001;
      this.ambientGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    await this.ensureAmbient();
    this.syncAmbient();
  }

  /** Allow the ambient bed and fade it in (after unlock). */
  beginAmbient(): void {
    this.ambientAllowed = true;
    void this.unlock().then(() => {
      this.syncAmbient();
    });
  }

  private async ensureAmbient(): Promise<void> {
    if (!this.ctx || !this.ambientGain) return;
    if (!this.ambientBuffer) {
      this.ambientLoad ??= this.loadAmbient();
      this.ambientBuffer = await this.ambientLoad;
    }
    if (!this.ambientBuffer || this.ambientSource) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.ambientBuffer;
    source.loop = true;
    source.connect(this.ambientGain);
    source.start(0);
    this.ambientSource = source;
  }

  private async loadAmbient(): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    try {
      const res = await fetch(AMBIENT_URL);
      if (!res.ok) return null;
      const raw = await res.arrayBuffer();
      return await this.ctx.decodeAudioData(raw.slice(0));
    } catch {
      return null;
    }
  }

  private syncAmbient(): void {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const target = !this.muted && this.ambientAllowed ? AMBIENT_LEVEL : 0.0001;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setTargetAtTime(
      target,
      now,
      this.muted || !this.ambientAllowed ? 0.08 : 0.55,
    );
  }

  private tone(
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    peak: number,
    delay = 0,
  ): void {
    if (!this.ctx || !this.master) return;
    const t0 = time + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  private play(name: SoundName): void {
    if (this.muted || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    // Fade master up quickly for the gesture, then it's left hot.
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(UI_MASTER_LEVEL, now, 0.01);

    switch (name) {
      // Short blip when the camera crosses into a vantage's pull.
      case "tick":
        this.tone(1400, now, 0.06, "sine", 0.12);
        break;
      // Two-note resolving chord when a silhouette locks.
      case "lock":
        this.tone(523.25, now, 0.4, "sine", 0.1); // C5
        this.tone(783.99, now, 0.5, "sine", 0.08, 0.07); // G5
        break;
      // Confirming click when entering a destination.
      case "enter":
        this.tone(880, now, 0.05, "square", 0.05);
        this.tone(1320, now, 0.09, "sine", 0.07, 0.04);
        break;
    }
  }

  tick(): void {
    this.play("tick");
  }
  lock(): void {
    this.play("lock");
  }
  enter(): void {
    this.play("enter");
  }
}

/** localStorage key for the visitor's mute preference. */
export const MUTED_STORAGE_KEY = "lab.muted";

export const sound = new LabSound();
