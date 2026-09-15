import { create } from "zustand";
import {
  VELOCITY_DEFAULTS, CHORD_DEFAULT_VELOCITY, CHORD_DEFAULT_OCTAVE, SNAP_DEFAULT,
  type TrackKind,
} from "@midistudio/shared";

// 模組：操作客製化設定。琴格加音、和弦展開都讀這裡；localStorage 記偏好。
const KEY = "midistudio:settings:v1";

interface SettingsState {
  snap: number;
  defaultVelocity: Record<TrackKind, number>;
  chordVelocity: number;
  chordOctave: number;
  setSnap: (v: number) => void;
  setDefaultVelocity: (kind: TrackKind, v: number) => void;
  setChordVelocity: (v: number) => void;
  setChordOctave: (v: number) => void;
  resetSettings: () => void;
}

const DEFAULTS = {
  snap: SNAP_DEFAULT,
  defaultVelocity: { ...VELOCITY_DEFAULTS },
  chordVelocity: CHORD_DEFAULT_VELOCITY,
  chordOctave: CHORD_DEFAULT_OCTAVE,
};

function num(v: unknown, fb: number, lo: number, hi: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : fb;
}

function load(): typeof DEFAULTS {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "{}") as any;
    const kinds: TrackKind[] = ["melody", "chords", "bass", "drums"];
    const defaultVelocity = { ...VELOCITY_DEFAULTS };
    for (const k of kinds) if (p.defaultVelocity?.[k] !== undefined) defaultVelocity[k] = num(p.defaultVelocity[k], defaultVelocity[k], 1, 127);
    return {
      snap: [1, 0.5, 0.25].includes(p.snap) ? p.snap : DEFAULTS.snap,
      defaultVelocity,
      chordVelocity: num(p.chordVelocity, DEFAULTS.chordVelocity, 1, 127),
      chordOctave: num(p.chordOctave, DEFAULTS.chordOctave, 1, 6),
    };
  } catch {
    return { snap: DEFAULTS.snap, defaultVelocity: { ...DEFAULTS.defaultVelocity }, chordVelocity: DEFAULTS.chordVelocity, chordOctave: DEFAULTS.chordOctave };
  }
}

function save(s: { snap: number; defaultVelocity: Record<TrackKind, number>; chordVelocity: number; chordOctave: number }): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* 略過 */ }
}

const pick = (s: SettingsState) => ({ snap: s.snap, defaultVelocity: s.defaultVelocity, chordVelocity: s.chordVelocity, chordOctave: s.chordOctave });

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...load(),
  setSnap: (v) => { set({ snap: v }); save(pick(get())); },
  setDefaultVelocity: (kind, v) => {
    const defaultVelocity = { ...get().defaultVelocity, [kind]: Math.max(1, Math.min(127, Math.round(v))) };
    set({ defaultVelocity });
    save(pick(get()));
  },
  setChordVelocity: (v) => { set({ chordVelocity: num(v, CHORD_DEFAULT_VELOCITY, 1, 127) }); save(pick(get())); },
  setChordOctave: (v) => { set({ chordOctave: num(v, CHORD_DEFAULT_OCTAVE, 1, 6) }); save(pick(get())); },
  resetSettings: () => {
    set({ snap: DEFAULTS.snap, defaultVelocity: { ...DEFAULTS.defaultVelocity }, chordVelocity: DEFAULTS.chordVelocity, chordOctave: DEFAULTS.chordOctave });
    save(pick(get()));
  },
}));
