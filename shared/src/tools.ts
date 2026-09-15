// 給 OpenAI/OpenRouter function calling 的唯一工具定義。
// 描述文案來自 ./tool-docs.ts（TOOL_DOCS），MCP 與 prompt 共用同一份，不可在此手寫第二套。
import { TOOL_DOCS } from "./tool-docs.js";

const d = (name: keyof typeof TOOL_DOCS, extra = ""): string =>
  `${TOOL_DOCS[name].what} 何時：${TOOL_DOCS[name].when} 例：${TOOL_DOCS[name].example}${extra}`;

export const TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "create_track",
      description: d("create_track"),
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          kind: { type: "string", enum: ["melody", "chords", "bass", "drums"] },
          program: { type: "number", description: "GM program 0-127" },
        },
        required: ["name", "kind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_notes",
      description: d("add_notes"),
      parameters: {
        type: "object",
        properties: {
          trackId: { type: "string", description: "從工程摘要拿 id，禁止編造" },
          notes: {
            type: "array", maxItems: 256,
            items: {
              type: "object",
              properties: {
                pitch: { type: "number", description: "0-127，C4=60" },
                startBeat: { type: "number", description: "拍，4/4一小節=4" },
                durBeat: { type: "number", description: "拍長，>0" },
                velocity: { type: "number", description: "1-127" },
              },
              required: ["pitch", "startBeat", "durBeat"],
            },
          },
        },
        required: ["trackId", "notes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_notes",
      description: d("delete_notes"),
      parameters: {
        type: "object",
        properties: { trackId: { type: "string" }, noteIds: { type: "array", items: { type: "string" } } },
        required: ["trackId", "noteIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_velocities",
      description: d("update_velocities"),
      parameters: {
        type: "object",
        properties: {
          trackId: { type: "string" },
          edits: {
            type: "array", maxItems: 256,
            items: {
              type: "object",
              properties: { id: { type: "string" }, velocity: { type: "number" } },
              required: ["id", "velocity"],
            },
          },
        },
        required: ["trackId", "edits"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_tempo",
      description: d("update_tempo"),
      parameters: { type: "object", properties: { bpm: { type: "number" } }, required: ["bpm"] },
    },
  },
  {
    type: "function",
    function: {
      name: "update_key",
      description: d("update_key"),
      parameters: {
        type: "object",
          properties: { keyRoot: { type: "number" }, scale: { type: "string" } },
        required: ["keyRoot", "scale"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_chord_progression",
      description: d("set_chord_progression"),
      parameters: {
        type: "object",
        properties: {
          root: { type: "number", description: "保留欄，實際用 project.keyRoot" },
          progression: { type: "array", items: { type: "string", description: "羅馬數字，如 I/V/vi/IV" } },
          bars: { type: "number", description: "小節數，須等於需求小節數" },
          trackId: { type: "string" },
          velocity: { type: "number", description: "和弦力度 1-127，預設 80" },
          octave: { type: "number", description: "和弦八度 1-6，預設 3（C3 附近）" },
        },
        required: ["progression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_track",
      description: d("delete_track"),
      parameters: { type: "object", properties: { trackId: { type: "string" } }, required: ["trackId"] },
    },
  },
] as const;
