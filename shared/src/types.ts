// MIDIstudio 三層架構 — 中間層：唯一事實來源
// 前端(UI) <-> 中間層(型別/樂理/工具/校驗/狀態運算) <-> 後端(LLM agent)
// 任何 LLM 產生的操作都必須是 ToolOp[]，經 validateOps + applyOps 才能進 project。

export type TrackKind = "melody" | "chords" | "bass" | "drums";

export interface NoteEvent {
  id: string;
  /** MIDI pitch 0-127, C4=60。和弦一次加多個 NoteEvent，不要用陣列。 */
  pitch: number;
  /** 以拍為單位，4/4 一小節 = 4 beats */
  startBeat: number;
  durBeat: number;
  velocity: number; // 1-127
}

export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  /** General MIDI program 0-127，打擊用 channel 9 */
  program: number;
  channel: number;
  notes: NoteEvent[];
}

export interface ProjectState {
  bpm: number;
  /** 調性根音 pitch class 0-11, C=0 */
  keyRoot: number;
  scale: string; // major | natural_minor | ...
  timeSig: [number, number];
  tracks: Track[];
  selectedTrackId: string | null;
}

// ---- LLM 可操作的端口：全部操作收斂到這 8 個 ----
// 設計取自 AI DAW 常見思路：track 管理 + 全域和聲/速度/調性軌（出處見 THIRD_PARTY_NOTICES.md）
export type ToolOp =
  | { op: "create_track"; name: string; kind: TrackKind; program?: number }
  | { op: "delete_track"; trackId: string }
  | { op: "add_notes"; trackId: string; notes: Omit<NoteEvent, "id">[] }
  | { op: "delete_notes"; trackId: string; noteIds: string[] }
  | { op: "update_velocities"; trackId: string; edits: { id: string; velocity: number }[] }
  | { op: "update_tempo"; bpm: number }
  | { op: "update_key"; keyRoot: number; scale: string }
  | { op: "set_chord_progression"; root: number; progression: string[]; bars?: number; trackId?: string; velocity?: number; octave?: number };

export interface OpReport {
  ok: boolean;
  message: string;
}
