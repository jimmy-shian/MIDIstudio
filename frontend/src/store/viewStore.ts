import { create } from "zustand";

// 模組：琴格視角（只管看哪裡，不管工程內容；不進 undo、不進存檔）。
const KEY = "midistudio:view:v1";

interface ViewState {
  startBeat: number;
  beatsVisible: number;
  lowPitch: number;
  highPitch: number;
  pan: (dBeats: number) => void;
  zoomBeats: (dir: 1 | -1) => void;
  shiftPitch: (dSemitones: number) => void;
  setBeatsVisible: (n: number) => void;
  resetView: () => void;
}

const DEFAULTS = { startBeat: 0, beatsVisible: 16, lowPitch: 48, highPitch: 72 };
const BEAT_STEPS = [4, 8, 16, 32, 64];

function loadPrefs(): typeof DEFAULTS {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      startBeat: Math.max(0, Number(p.startBeat) || 0),
      beatsVisible: BEAT_STEPS.includes(p.beatsVisible) ? p.beatsVisible : DEFAULTS.beatsVisible,
      lowPitch: clamp(Number(p.lowPitch) || DEFAULTS.lowPitch, 0, 115),
      highPitch: clamp(Number(p.highPitch) || DEFAULTS.highPitch, 12, 127),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function save(s: { startBeat: number; beatsVisible: number; lowPitch: number; highPitch: number }): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* 略過 */ }
}

// 滾輪平移一格就寫一次 localStorage＝連續 SSD 同步寫；改為尾隨防抖合併。
// 視角偏好丟幾百毫秒無所謂，關分頁前大概率已寫入。
let viewSaveTimer: ReturnType<typeof setTimeout> | undefined;
function saveSoon(s: { startBeat: number; beatsVisible: number; lowPitch: number; highPitch: number }): void {
  clearTimeout(viewSaveTimer);
  viewSaveTimer = setTimeout(() => save(s), 1000);
}

export const useViewStore = create<ViewState>((set, get) => ({
  ...loadPrefs(),
  pan: (d) => {
    const startBeat = Math.max(0, get().startBeat + d);
    set({ startBeat });
    saveSoon({ ...get(), startBeat });
  },
  zoomBeats: (dir) => {
    const i = BEAT_STEPS.indexOf(get().beatsVisible);
    const beatsVisible = BEAT_STEPS[clamp(i + dir, 0, BEAT_STEPS.length - 1)];
    set({ beatsVisible });
    saveSoon({ ...get(), beatsVisible });
  },
  shiftPitch: (d) => {
    const span = get().highPitch - get().lowPitch;
    let lowPitch = clamp(get().lowPitch + d, 0, 127 - span);
    set({ lowPitch, highPitch: lowPitch + span });
    saveSoon({ ...get(), lowPitch, highPitch: lowPitch + span });
  },
  setBeatsVisible: (n) => {
    if (!BEAT_STEPS.includes(n)) return;
    set({ beatsVisible: n });
    saveSoon({ ...get(), beatsVisible: n });
  },
  resetView: () => {
    set({ ...DEFAULTS });
    save(DEFAULTS);
  },
}));
