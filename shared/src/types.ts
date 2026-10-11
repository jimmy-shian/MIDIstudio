// MIDIstudio 三層架構 — 中間層：唯一事實來源
// 前端(UI) <-> 中間層(型別/樂理/工具/校驗/狀態運算) <-> 後端(LLM agent)
// 任何 LLM 產生的操作都必須是 ToolOp[]，經 validateOps + applyOps 才能進 project。

export type TrackKind = "melody" | "chords" | "bass" | "drums";

export type EffectType =
  | "reverb"
  | "delay"
  | "chorus"
  | "distortion"
  | "eq3"
  | "compressor"
  | "filter"
  | "limiter";

export interface EffectConfig {
  id: string;
  type: EffectType;
  enabled: boolean;
  params: Record<string, number>;
}

export interface NoteEvent {
  id: string;
  /** MIDI pitch 0-127, C4=60。和弦一次加多個 NoteEvent，不要用陣列。 */
  pitch: number;
  /** 以拍為單位（浮點相容表示），1 四分音符 = 1 beat */
  startBeat: number;
  durBeat: number;
  velocity: number; // 1-127
  /** 內部高精度標準座標，PPQ = 960 */
  startTick?: number;
  durationTicks?: number;
  muted?: boolean;
}

export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  /** General MIDI program 0-127，打擊用 channel 9 (GM Channel 10) */
  program: number;
  channel: number;
  /** 音量 0-127，預設 100 (對應 0dB 附近) */
  volume?: number;
  /** 聲相 -1.0 (極左) ~ 1.0 (極右)，預設 0 */
  pan?: number;
  mute?: boolean;
  solo?: boolean;
  effects?: EffectConfig[];
  notes: NoteEvent[];
}

export interface Section {
  id: string;
  name: string; // "Intro" | "Verse" | "Chorus" | "Bridge" | "Outro" 等
  startTick: number;
  lengthTicks: number;
  bars: number;
}

export interface ProjectState {
  schemaVersion?: number;
  bpm: number;
  /** 調性根音 pitch class 0-11, C=0 */
  keyRoot: number;
  scale: string; // major | natural_minor | harmonic_minor | ...
  timeSig: [number, number]; // [分子, 分母]，例如 [4, 4], [3, 4], [6, 8]
  sections?: Section[];
  masterVolume?: number; // 0-127, 預設 100
  masterEffects?: EffectConfig[];
  tracks: Track[];
  selectedTrackId: string | null;
}

// ---- MusicSpec: 結構化作曲規格 ----
export interface MusicSpecSection {
  name: string;
  bars: number;
  harmonicRhythmBeats?: number;
  progression: string[];
  grooveStyle?: string;
}

export interface MusicSpecInstrument {
  trackName: string;
  kind: TrackKind;
  program?: number;
  role?: string;
  density?: "sparse" | "medium" | "dense";
  octaveCenter?: number;
}

export interface MusicSpec {
  title?: string;
  genre: "pop" | "ballad" | "lofi" | "synthwave" | "waltz" | "rock";
  tempo: number;
  timeSignature: [number, number];
  keyRoot: number;
  scale: string;
  sections: MusicSpecSection[];
  instrumentation?: MusicSpecInstrument[];
}

// ---- LLM 可操作的標準 16 個 ToolOp 端口 ----
export type ToolOp =
  | { op: "create_track"; name: string; kind: TrackKind; program?: number }
  | { op: "delete_track"; trackId: string }
  | { op: "add_notes"; trackId: string; notes: Omit<NoteEvent, "id">[] }
  | { op: "delete_notes"; trackId: string; noteIds: string[] }
  | { op: "update_velocities"; trackId: string; edits: { id: string; velocity: number }[] }
  | { op: "update_tempo"; bpm: number }
  | { op: "update_key"; keyRoot: number; scale: string }
  | { op: "update_time_signature"; numerator: number; denominator: number }
  | { op: "set_chord_progression"; root?: number; progression: string[]; bars?: number; trackId?: string; velocity?: number; octave?: number }
  | { op: "create_composition"; spec: MusicSpec }
  | { op: "generate_drum_pattern"; trackId?: string; pattern: string; bars: number; startTick?: number; startBeat?: number }
  | { op: "create_section"; name: string; bars: number; startTick?: number; startBeat?: number }
  | { op: "clear_region"; trackId: string; startTick?: number; endTick?: number; startBeat?: number; endBeat?: number }
  | { op: "transpose_region"; trackId: string; semitones: number; startTick?: number; endTick?: number; startBeat?: number; endBeat?: number }
  | { op: "quantize_region"; trackId: string; gridTicks?: number; gridBeat?: number; startTick?: number; endTick?: number }
  | { op: "humanize_region"; trackId: string; velocityVariance?: number; timingVarianceTicks?: number }
  | { op: "set_track_mixer"; trackId: string; volume?: number; pan?: number; mute?: boolean; solo?: boolean }
  | { op: "set_effect"; target: "track" | "master"; trackId?: string; effectId?: string; type: EffectType; params: Record<string, number>; enabled?: boolean };

export interface OpReport {
  ok: boolean;
  message: string;
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  code?: string;
}
