/**
 * gameBgm — original 8-bit / chiptune background music via Web Audio API.
 * Four themes, each an original composition. NOT Nintendo music.
 *
 * Usage:
 *   gameBgm?.start('arcade')   // start a theme
 *   gameBgm?.stop()            // stop (fade out)
 *   gameBgm?.setMuted(true)    // mute (persisted to localStorage)
 *   gameBgm?.getMuted()        // current mute state
 */

export type BgmTheme = 'arcade' | 'rapid' | 'mystery' | 'market';

// [frequencyHz, durationInBeats]  — freq 0 = rest
type Note = [number, number];

// ─── Original Compositions ──────────────────────────────────────────────────

const THEMES: Record<BgmTheme, { bpm: number; melody: Note[]; bass?: Note[] }> = {

  // "Arcade" — upbeat C-major puzzle theme
  // Used for: Trivia, Memory Match, Food Scramble, Price Guesser
  arcade: {
    bpm: 138,
    melody: [
      [784, 0.5], [659, 0.5], [523, 1.0],
      [587, 0.5], [659, 0.5], [698, 1.0],
      [784, 0.5], [880, 0.5], [784, 0.5], [659, 0.5],
      [523, 2.0],
      [659, 0.5], [698, 0.5], [784, 1.0],
      [880, 0.5], [784, 0.5], [698, 0.5], [659, 0.5],
      [523, 0.5], [587, 0.5], [659, 1.5],
      [0, 0.5],
    ],
    bass: [
      [131, 1.0], [131, 1.0],
      [147, 1.0], [147, 1.0],
      [131, 1.0], [131, 1.0],
      [131, 4.0],
      [131, 1.0], [131, 1.0],
      [175, 1.0], [175, 1.0],
      [131, 1.5], [0, 0.5],
    ],
  },

  // "Rapid" — urgent high-tempo C-major dash theme
  // Used for: Rapid Fire
  rapid: {
    bpm: 188,
    melody: [
      [523, 0.25], [659, 0.25], [784, 0.25], [880, 0.25],
      [784, 0.25], [659, 0.25], [784, 0.25], [0, 0.25],
      [988, 0.25], [880, 0.25], [784, 0.25], [659, 0.25],
      [523, 0.5],  [0, 0.25],   [659, 0.25],
      [784, 0.25], [880, 0.25], [988, 0.5],  [0, 0.25], [880, 0.25],
      [784, 0.25], [698, 0.25], [784, 0.5],  [0, 0.5],
    ],
    bass: [
      [131, 0.5], [131, 0.5], [131, 0.5], [131, 0.5],
      [147, 0.5], [147, 0.5], [147, 0.5], [147, 0.5],
      [131, 0.5], [131, 0.5], [131, 0.5], [131, 0.5],
      [131, 2.0],
      [175, 0.5], [175, 0.5], [175, 0.5], [175, 0.5],
      [131, 0.5], [131, 0.5], [131, 0.5], [131, 0.5],
    ],
  },

  // "Mystery" — tense A-minor suspense theme
  // Used for: Mystery Makan
  mystery: {
    bpm: 96,
    melody: [
      [440, 1.0], [0, 0.5], [415, 0.5],
      [392, 1.0], [0, 0.5], [370, 0.5],
      [349, 0.5], [370, 0.5], [392, 0.5], [0, 0.5],
      [440, 1.5], [494, 0.5],
      [523, 1.0], [494, 0.5], [440, 0.5],
      [415, 0.5], [392, 0.5], [370, 0.5], [349, 0.5],
      [330, 3.0], [0, 1.0],
    ],
    bass: [
      [110, 2.0], [98, 2.0],
      [88, 2.0],  [110, 2.0],
      [131, 2.0], [110, 2.0],
      [98, 2.0],  [110, 2.0],
      [110, 4.0],
    ],
  },

  // "Market" — bouncy F-major food-market theme
  // Used for: Emoji Kitchen, Spicy Ladder, Food Pairs
  market: {
    bpm: 156,
    melody: [
      [349, 0.5], [440, 0.5], [523, 0.5], [0, 0.5],
      [587, 0.5], [523, 0.5], [440, 0.5], [0, 0.5],
      [392, 0.5], [440, 0.5], [523, 0.5], [587, 0.5],
      [698, 1.0], [0, 0.5],   [523, 0.5],
      [440, 0.5], [523, 0.5], [587, 1.0],
      [698, 0.5], [784, 0.5], [698, 0.5], [587, 0.5],
      [523, 0.5], [440, 0.5], [349, 2.0],
    ],
    bass: [
      [87, 1.0],  [87, 1.0],
      [147, 1.0], [147, 1.0],
      [98, 1.0],  [98, 1.0],
      [175, 1.0], [175, 1.0],
      [131, 1.0], [131, 1.0],
      [175, 1.0], [175, 1.0],
      [87, 3.0],
    ],
  },
};

const MUTE_KEY = 'makanjom_bgm_muted';

class GameBGMManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentTheme: BgmTheme = 'arcade';
  private loopHandle: ReturnType<typeof setTimeout> | null = null;

  getMuted(): boolean {
    try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; }
  }

  setMuted(muted: boolean) {
    try { localStorage.setItem(MUTE_KEY, String(muted)); } catch { /* ignore */ }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.18, this.ctx.currentTime, 0.08);
    }
  }

  start(theme: BgmTheme) {
    if (this.isPlaying && this.currentTheme === theme) return;
    this.stop();
    this.currentTheme = theme;
    this.isPlaying = true;
    this.ensureContext();
    this.scheduleLoop();
  }

  stop() {
    this.isPlaying = false;
    if (this.loopHandle) { clearTimeout(this.loopHandle); this.loopHandle = null; }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    }
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.masterGain!.gain.value = this.getMuted() ? 0 : 0.18;
  }

  private scheduleNote(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.7,
  ) {
    if (!this.ctx || !this.masterGain || freq <= 0) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    // Short attack + decay envelope to avoid harsh clicks
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.setValueAtTime(volume, startTime + duration * 0.72);
    gain.gain.linearRampToValueAtTime(0, startTime + duration * 0.95);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private scheduleLoop() {
    if (!this.isPlaying || !this.ctx) return;

    const theme     = THEMES[this.currentTheme];
    const beat      = 60 / theme.bpm;
    let   nowMel    = this.ctx.currentTime + 0.04;
    let   nowBass   = this.ctx.currentTime + 0.04;
    let   totalTime = 0;

    // Melody — square wave
    for (const [freq, beats] of theme.melody) {
      const dur = beats * beat;
      this.scheduleNote(freq, nowMel, dur, 'square', 0.55);
      nowMel  += dur;
      totalTime = Math.max(totalTime, nowMel);
    }

    // Bass — triangle wave, quieter
    if (theme.bass) {
      for (const [freq, beats] of theme.bass) {
        const dur = beats * beat;
        this.scheduleNote(freq, nowBass, dur, 'triangle', 0.35);
        nowBass += dur;
        totalTime = Math.max(totalTime, nowBass);
      }
    }

    // Re-trigger just before end to create seamless loop
    const loopMs = (totalTime - this.ctx.currentTime - 0.08) * 1000;
    this.loopHandle = setTimeout(() => {
      if (this.isPlaying) this.scheduleLoop();
    }, Math.max(50, loopMs));
  }
}

// Lazy singleton — null on SSR, GameBGMManager on client
export const gameBgm: GameBGMManager | null =
  typeof window !== 'undefined' ? new GameBGMManager() : null;
