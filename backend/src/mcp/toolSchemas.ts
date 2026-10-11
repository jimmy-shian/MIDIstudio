import * as z from "zod/v4";
import { TOOL_DOCS } from "@midistudio/shared";

// 模組：MCP zod schemas。描述取自 TOOL_DOCS，與 OpenRouter TOOLS 同源。
const trackId = z.string().describe("音軌 id，從 get_project 拿，禁止編造");
const beats = z.number().describe("拍數（四分音符基準拍，如 4/4 一小節為 4 拍，3/4 一小節為 3 拍）");

export const noteInput = z.object({
  pitch: z.number().int().min(0).max(127).describe("0-127，C4=60"),
  startBeat: beats,
  durBeat: z.number().positive().max(64).describe("拍長"),
  velocity: z.number().int().min(1).max(127).default(90).describe("1-127"),
});

export const MCP_SCHEMAS = {
  create_composition: z.object({
    spec: z.any().describe("結構化音樂規格 MusicSpec（含 genre, tempo, timeSignature, keyRoot, scale, sections 等）"),
  }),
  update_time_signature: z.object({
    numerator: z.number().int().min(1).max(32).describe("拍號分子 (如 3, 4, 6)"),
    denominator: z.enum(["2", "4", "8", "16"]).transform(Number).describe("拍號分母 (如 4, 8)"),
  }),
  create_track: z.object({
    name: z.string().describe("軌名，如 Strings"),
    kind: z.enum(["melody", "chords", "bass", "drums"]).describe("軌種"),
    program: z.number().int().min(0).max(127).optional().describe("GM 0-127，鼓省略"),
  }),
  add_notes: z.object({
    trackId,
    notes: z.array(noteInput).min(1).max(512),
  }),
  delete_notes: z.object({ trackId, noteIds: z.array(z.string()).min(1) }),
  update_velocities: z.object({
    trackId,
    edits: z.array(
      z.object({
        id: z.string(),
        velocity: z.number().int().min(1).max(127),
      })
    ).min(1).max(512),
  }),
  update_tempo: z.object({ bpm: z.number().min(40).max(240) }),
  update_key: z.object({
    keyRoot: z.number().int().min(0).max(11).describe("調根音 pitch class，C=0"),
    scale: z.string().describe("major / natural_minor / harmonic_minor 等"),
  }),
  set_chord_progression: z.object({
    progression: z.array(z.string()).min(1).describe("羅馬數字，如 I,V,vi,IV 或 i,VI,III,VII"),
    bars: z.number().int().positive().max(64).optional().describe("小節數"),
    trackId: z.string().optional(),
    velocity: z.number().int().min(1).max(127).optional().describe("和弦力度，預設 80"),
    octave: z.number().int().min(1).max(6).optional().describe("和弦八度，預設 3"),
  }),
  generate_drum_pattern: z.object({
    trackId: z.string().optional(),
    pattern: z.string().describe("鼓組風格：four_on_floor（四拍底鼓）, boom_bap（切分底鼓＋鬆弛小鼓）, waltz_34, ballad_68"),
    bars: z.number().int().positive().max(64).describe("小節數"),
    startBeat: z.number().optional().describe("起音拍數"),
  }),
  create_section: z.object({
    name: z.string().describe("段落名稱，如 Intro, Verse, Chorus, Outro"),
    bars: z.number().int().positive().max(64).describe("小節數"),
    startBeat: z.number().optional(),
  }),
  clear_region: z.object({
    trackId,
    startBeat: z.number().optional(),
    endBeat: z.number().optional(),
  }),
  transpose_region: z.object({
    trackId,
    semitones: z.number().int().describe("半音位移量 (+2, -12 等)"),
    startBeat: z.number().optional(),
    endBeat: z.number().optional(),
  }),
  quantize_region: z.object({
    trackId,
    gridBeat: z.number().optional().describe("量化網格，預設 0.25 (16分音符)"),
  }),
  humanize_region: z.object({
    trackId,
    velocityVariance: z.number().optional(),
  }),
  set_track_mixer: z.object({
    trackId,
    volume: z.number().min(0).max(127).optional().describe("音量 0-127"),
    pan: z.number().min(-1).max(1).optional().describe("聲相 -1.0 到 1.0"),
    mute: z.boolean().optional(),
    solo: z.boolean().optional(),
  }),
  set_effect: z.object({
    target: z.enum(["track", "master"]),
    trackId: z.string().optional(),
    type: z.enum(["reverb", "delay", "chorus", "distortion", "eq3", "compressor", "filter", "limiter"]),
    params: z.record(z.string(), z.number()),
    enabled: z.boolean().optional(),
  }),
  delete_track: z.object({ trackId }),
  project_list: z.object({}).describe("列出 SQLite 全部工程"),
  project_open: z.object({
    id: z.string().optional().describe("工程 id，省略則開最近更新的"),
  }),
  project_create: z.object({
    name: z.string().max(80).optional().describe("新工程名"),
  }),
  project_rename: z.object({
    name: z.string().max(80).describe("目前工程的新名字"),
  }),
  project_delete: z.object({
    id: z.string().optional().describe("要刪的工程 id，省略刪目前工程"),
  }),
  get_project: z.object({}),
  load_project: z.object({
    project: z.any().describe("完整 ProjectState JSON，會整份取代目前工程"),
  }),
  music_lookup: z.object({
    topic: z.enum(["scales", "chords", "progressions", "drums", "form", "all"]).describe("要查的樂理主題"),
  }),
};

export const MCP_DESCRIPTIONS: Record<keyof typeof MCP_SCHEMAS, string> = {
  create_composition: `${TOOL_DOCS.create_composition.what} ${TOOL_DOCS.create_composition.when}`,
  update_time_signature: `${TOOL_DOCS.update_time_signature.what} ${TOOL_DOCS.update_time_signature.when}`,
  create_track: `${TOOL_DOCS.create_track.what} ${TOOL_DOCS.create_track.when}`,
  add_notes: `${TOOL_DOCS.add_notes.what} ${TOOL_DOCS.add_notes.when}`,
  delete_notes: `${TOOL_DOCS.delete_notes.what} ${TOOL_DOCS.delete_notes.when}`,
  update_velocities: `${TOOL_DOCS.update_velocities.what} ${TOOL_DOCS.update_velocities.when}`,
  update_tempo: `${TOOL_DOCS.update_tempo.what} ${TOOL_DOCS.update_tempo.when}`,
  update_key: `${TOOL_DOCS.update_key.what} ${TOOL_DOCS.update_key.when}`,
  set_chord_progression: `${TOOL_DOCS.set_chord_progression.what} ${TOOL_DOCS.set_chord_progression.when}`,
  generate_drum_pattern: `${TOOL_DOCS.generate_drum_pattern.what} ${TOOL_DOCS.generate_drum_pattern.when}`,
  create_section: `${TOOL_DOCS.create_section.what} ${TOOL_DOCS.create_section.when}`,
  clear_region: `${TOOL_DOCS.clear_region.what} ${TOOL_DOCS.clear_region.when}`,
  transpose_region: `${TOOL_DOCS.transpose_region.what} ${TOOL_DOCS.transpose_region.when}`,
  quantize_region: `${TOOL_DOCS.quantize_region.what} ${TOOL_DOCS.quantize_region.when}`,
  humanize_region: `${TOOL_DOCS.humanize_region.what} ${TOOL_DOCS.humanize_region.when}`,
  set_track_mixer: `${TOOL_DOCS.set_track_mixer.what} ${TOOL_DOCS.set_track_mixer.when}`,
  set_effect: `${TOOL_DOCS.set_effect.what} ${TOOL_DOCS.set_effect.when}`,
  delete_track: `${TOOL_DOCS.delete_track.what} ${TOOL_DOCS.delete_track.when}`,
  get_project: "讀目前工程全文（BPM/調性/每軌id與音符）。調任何 op 前先調它拿 id。",
  load_project: "整份取代目前工程。用於載入前端傳來的 JSON 或範本。",
  music_lookup: "查樂理表（音階/和弦/進行/鼓/form），不用背數字。作曲前先查。",
  project_list: "列出 SQLite 全部工程（id/名/更新時間/音符數）。",
  project_open: "切換目前工程。省略 id 則開最近更新的。",
  project_create: "建新工程並切過去。",
  project_rename: "改目前工程的名字。",
  project_delete: "刪工程。",
};
