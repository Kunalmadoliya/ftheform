// Lightweight retro sound effects using the Web Audio API.
// No assets — every sound is synthesized on the fly.

let ctx: AudioContext | null = null;
let muted = false;

const MUTE_KEY = "ftheform.muted.v1";

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
    try {
      muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch(error) {
      console.error(error)
    }
  }
  return ctx;
}

function beep(freq: number, duration = 0.08, type: OscillatorType = "square", gain = 0.05) {
  const c = ensureCtx();
  if (!c || muted) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const sfx = {
  click: () => beep(660, 0.05, "square", 0.04),
  hover: () => beep(880, 0.03, "triangle", 0.02),
  coin: () => {
    beep(988, 0.06, "square", 0.05);
    setTimeout(() => beep(1318, 0.12, "square", 0.05), 60);
  },
  level: () => {
    beep(523, 0.08, "square", 0.05);
    setTimeout(() => beep(659, 0.08, "square", 0.05), 90);
    setTimeout(() => beep(784, 0.16, "square", 0.05), 180);
  },
  error: () => beep(180, 0.18, "sawtooth", 0.06),
  type: () => beep(440 + Math.random() * 220, 0.02, "square", 0.02),
  open: () => {
    beep(440, 0.06, "triangle", 0.04);
    setTimeout(() => beep(660, 0.1, "triangle", 0.04), 70);
  },
};

export const soundCtl = {
  isMuted(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  },
  toggle(): boolean {
    muted = !muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch(error) {
      console.error(error)
    }
    if (!muted) sfx.click();
    return muted;
  },
  resume() {
    const c = ensureCtx();
    if (c && c.state === "suspended") c.resume();
  },
};
