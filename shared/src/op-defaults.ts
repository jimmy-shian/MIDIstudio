import type { TrackKind } from "./types.js";

// 模組：操作預設值。所有「可客製化」的操作參數預設集中在此，前端設定面板、後端 fallback、
// 和弦展開共用同一份，改預設只改這裡。
export const VELOCITY_DEFAULTS: Record<TrackKind, number> = {
  melody: 95,
  chords: 78,
  bass: 90,
  drums: 100,
};

/** set_chord_progression 未指定時的力度與八度（C3=48 附近） */
export const CHORD_DEFAULT_VELOCITY = 80;
export const CHORD_DEFAULT_OCTAVE = 3;

/** 琴格 snap 預設：1/4 拍 */
export const SNAP_DEFAULT = 1;

/** 可選 snap 格 */
export const SNAP_OPTIONS = [1, 0.5, 0.25] as const;
