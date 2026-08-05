"use client";

/**
 * Synthesized interface sounds — no audio assets, pure WebAudio.
 * Everything is a no-op until unlock() is called from a user gesture,
 * and every tone checks the muted flag at play time.
 */

type SoundName = "tick" | "lock" | "enter";

class LabSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = true;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Create/resume the context. Must be called from a user gesture. */
  async unlock(): Promise<void> {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.0;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
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
    this.master.gain.setTargetAtTime(0.5, now, 0.01);

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

export const sound = new LabSound();
