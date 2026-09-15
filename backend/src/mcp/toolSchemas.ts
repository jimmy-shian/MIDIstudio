import * as z from "zod/v4";
import { TOOL_DOCS } from "@midistudio/shared";

// 模組：MCP zod schemas。描述取自 TOOL_DOCS，與 OpenRouter TOOLS 同源。
// 注意：zod/v4 的 .describe() 會直達模型的 JSON Schema，是模型唯一的工具說明。

const trackId = z.string().describe("音軌 id，從 get_project 拿，禁止編造");
const beats = z.number().describe("拍。4/4一小節=4，只能用拍，禁秒/tick");

export const noteInput = z.object({
  pitch: z.number().int().min(0).max(127).describe("0-127，C4=60"),
  startBeat: beats,
  durBeat: z.number().positive().max(16).describe("拍長"),
  velocity: z.number().int().min(1).max(127).default(90).describe("1-127"),
});

export const MCP_SCHEMAS = {
  create_track: z.object({
    name: z.string().describe("軌名，如 Strings"),
    kind: z.enum(["melody", "chords", "bass", "drums"]).describe("軌種"),
    program: z.number().int().min(0).max(127).optional().describe("GM 0-127，鼓省略"),
  }),
  add_notes: z.object({
    trackId,
    notes: z.array(noteInput).min(1).max(256),
  }),
  delete_notes: z.object({ trackId, noteIds: z.array(z.string()).min(1) }),
  update_velocities: z.object({
    trackId,
    edits: z.array(z.object({
      id: z.string(),
      velocity: z.number().int().min(1).max(127),
    })).min(1).max(256),
  }),
  update_tempo: z.object({ bpm: z.number().min(40).max(240) }),
  update_key: z.object({
    keyRoot: z.number().int().min(0).max(11).describe("調根音 pitch class，C=0"),
    scale: z.string().describe(" major / natural_minor / dorian 等，見 music-theory 資源"),
  }),
  set_chord_progression: z.object({
    progression: z.array(z.string()).min(1).describe("羅馬數字，如 I,V,vi,IV"),
    bars: z.number().int().positive().max(32).optional().describe("小節數，須等於需求小節數"),
    trackId: z.string().optional(),
    velocity: z.number().int().min(1).max(127).optional().describe("和弦力度，預設 80"),
    octave: z.number().int().min(1).max(6).optional().describe("和弦八度，預設 3"),
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
    id: z.string().optional().describe("要刪的工程 id，省略刪目前工程（會跳到最近的）"),
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
  create_track: `${TOOL_DOCS.create_track.what} ${TOOL_DOCS.create_track.when}`,
  add_notes: `${TOOL_DOCS.add_notes.what} ${TOOL_DOCS.add_notes.when}`,
  delete_notes: `${TOOL_DOCS.delete_notes.what} ${TOOL_DOCS.delete_notes.when}`,
  update_velocities: `${TOOL_DOCS.update_velocities.what} ${TOOL_DOCS.update_velocities.when}`,
  update_tempo: `${TOOL_DOCS.update_tempo.what} ${TOOL_DOCS.update_tempo.when}`,
  update_key: `${TOOL_DOCS.update_key.what} ${TOOL_DOCS.update_key.when}`,
  set_chord_progression: `${TOOL_DOCS.set_chord_progression.what} ${TOOL_DOCS.set_chord_progression.when}`,
  delete_track: `${TOOL_DOCS.delete_track.what} ${TOOL_DOCS.delete_track.when}`,
  get_project: "讀目前工程全文（BPM/調性/每軌id與音符）。調任何 op 前先調它拿 id。",
  load_project: "整份取代目前工程。用於載入前端傳來的 JSON 或範本。",
  music_lookup: "查樂理表（音階/和弦/進行/鼓/form），不用背數字。作曲前先查。",
  project_list: "列出 SQLite 全部工程（id/名/更新時間/音符數）。切換前先看這表拿 id。",
  project_open: "切換目前工程。省略 id 則開最近更新的。",
  project_create: "建新工程並切過去。開新歌先調它。",
  project_rename: "改目前工程的名字。",
  project_delete: "刪工程。刪的是目前工程會自動跳到最近的一首。",
};
