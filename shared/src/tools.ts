// 給 OpenAI/OpenRouter function calling 的唯一工具定義。
// 描述文案來自 ./tool-docs.ts（TOOL_DOCS），MCP 與 prompt 共用同一份。
import { TOOL_DOCS } from "./tool-docs.js";

const d = (name: keyof typeof TOOL_DOCS, extra = ""): string =>
  `${TOOL_DOCS[name].what} 何時：${TOOL_DOCS[name].when} 例：${TOOL_DOCS[name].example}${extra}`;

export const TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "create_composition",
      description: d("create_composition"),
      parameters: {
        type: "object",
        properties: {
          spec: {
            type: "object",
            description: "結構化音樂規格 MusicSpec",
            properties: {
              title: { type: "string" },
              genre: { type: "string", enum: ["pop", "ballad", "lofi", "synthwave", "waltz", "rock"] },
              tempo: { type: "number", description: "BPM 40-240" },
              timeSignature: {
                type: "array",
                items: { type: "number" },
                description: "[分子, 分母]，例如 [4, 4], [3, 4], [6, 8]",
              },
              keyRoot: { type: "number", description: "調根音 0-11, C=0" },
              scale: { type: "string", description: "major, natural_minor, harmonic_minor 等" },
              sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "段落名稱，如 Verse, Chorus" },
                    bars: { type: "number", description: "小節數" },
                    progression: {
                      type: "array",
                      items: { type: "string" },
                      description: "羅馬數字和弦進行，如 ['I','V','vi','IV'] 或 ['i','VI','III','VII']",
                    },
                    grooveStyle: { type: "string", description: "four_on_floor, boom_bap, waltz_34, ballad_68" },
                  },
                  required: ["name", "bars", "progression"],
                },
              },
            },
            required: ["tempo", "timeSignature", "keyRoot", "scale", "sections"],
          },
        },
        required: ["spec"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_time_signature",
      description: d("update_time_signature"),
      parameters: {
        type: "object",
        properties: {
          numerator: { type: "number", description: "拍號分子 (1-32)" },
          denominator: { type: "number", enum: [2, 4, 8, 16], description: "拍號分母" },
        },
        required: ["numerator", "denominator"],
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
          root: { type: "number", description: "保留欄，實際依 project.keyRoot" },
          progression: { type: "array", items: { type: "string" }, description: "羅馬數字，如 I, V, vi, IV 或 i, VI, III, VII" },
          bars: { type: "number", description: "小節數，須等於需求小節數" },
          trackId: { type: "string" },
          velocity: { type: "number", description: "和弦力度 1-127，預設 80" },
          octave: { type: "number", description: "和弦八度 1-6，預設 3" },
        },
        required: ["progression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_drum_pattern",
      description: d("generate_drum_pattern"),
      parameters: {
        type: "object",
        properties: {
          trackId: { type: "string" },
          pattern: { type: "string", description: "鼓組風格：four_on_floor（四拍底鼓）, boom_bap（切分底鼓＋鬆弛小鼓）, waltz_34, ballad_68" },
          bars: { type: "number", description: "小節數" },
          startBeat: { type: "number", description: "起音拍數 (預設 0)" },
        },
        required: ["pattern", "bars"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_section",
      description: d("create_section"),
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "段落名稱，如 Intro, Verse, Chorus, Outro" },
          bars: { type: "number", description: "小節數" },
          startBeat: { type: "number" },
        },
        required: ["name", "bars"],
      },
    },
  },
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
      name: "delete_track",
      description: d("delete_track"),
      parameters: { type: "object", properties: { trackId: { type: "string" } }, required: ["trackId"] },
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
          trackId: { type: "string", description: "從工程摘要拿 id" },
          notes: {
            type: "array",
            maxItems: 512,
            items: {
              type: "object",
              properties: {
                pitch: { type: "number", description: "0-127，C4=60" },
                startBeat: { type: "number", description: "拍數 (四分音符基準)" },
                durBeat: { type: "number", description: "拍長" },
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
      name: "clear_region",
      description: d("clear_region"),
      parameters: {
        type: "object",
        properties: {
          trackId: { type: "string" },
          startBeat: { type: "number" },
          endBeat: { type: "number" },
        },
        required: ["trackId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "transpose_region",
      description: d("transpose_region"),
      parameters: {
        type: "object",
        properties: {
          trackId: { type: "string" },
          semitones: { type: "number", description: "升降半音數，例如 2 或 -12" },
          startBeat: { type: "number" },
          endBeat: { type: "number" },
        },
        required: ["trackId", "semitones"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "quantize_region",
      description: d("quantize_region"),
      parameters: {
        type: "object",
        properties: {
          trackId: { type: "string" },
          gridBeat: { type: "number", description: "量化網格拍數，例如 0.25 (16分音符)" },
          startBeat: { type: "number" },
          endBeat: { type: "number" },
        },
        required: ["trackId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "humanize_region",
      description: d("humanize_region"),
      parameters: {
        type: "object",
        properties: {
          trackId: { type: "string" },
          velocityVariance: { type: "number", description: "力度浮動範圍 (預設 6)" },
        },
        required: ["trackId"],
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
            type: "array",
            maxItems: 512,
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
      name: "set_track_mixer",
      description: d("set_track_mixer"),
      parameters: {
        type: "object",
        properties: {
          trackId: { type: "string" },
          volume: { type: "number", description: "0-127" },
          pan: { type: "number", description: "-1.0 到 1.0" },
          mute: { type: "boolean" },
          solo: { type: "boolean" },
        },
        required: ["trackId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_effect",
      description: d("set_effect"),
      parameters: {
        type: "object",
        properties: {
          target: { type: "string", enum: ["track", "master"] },
          trackId: { type: "string" },
          type: { type: "string", enum: ["reverb", "delay", "chorus", "distortion", "eq3", "compressor", "filter", "limiter"] },
          params: { type: "object", description: "效果器參數鍵值對" },
          enabled: { type: "boolean" },
        },
        required: ["target", "type", "params"],
      },
    },
  },
] as const;
