// 模組：樂理知識文本。唯一組裝處，同時餵 system prompt 與 MCP resource。
// 數字表來自 @midistudio/shared（SCALES/CHORDS/GM/FORM），此處只做排版，不手寫第二套。
import {
  SCALES, CHORDS, PROGRESSIONS, GM_PROGRAMS, DRUM_MAP,
  FUNCTIONS, NEXT_CHORD, CADENCES, FORMS, RHYTHMS, VELOCITY_GUIDE,
  TOOL_DOCS,
} from "@midistudio/shared";

const kv = (o: Record<string, unknown>): string =>
  Object.entries(o).map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.join(",")}]` : v}`).join(" ");

export const SCALES_TEXT = Object.entries(SCALES).map(([k, v]) => `${k}[${v.join(",")}]`).join(" ");
export const CHORDS_TEXT = Object.entries(CHORDS).map(([k, v]) => `${k}[${v.join(",")}]`).join(" ");

export const MUSIC_KNOWLEDGE_TEXT = `== MIDI ==
pitch 0-127，C4=60（midi=12*(octave+1)+pc；C=0,C#=1,D=2,D#=3,E=4,F=5,F#=6,G=7,G#=8,A=9,A#=10,B=11），A4=440。
velocity 1-127。時間一律 beats：4/4一小節=4，BPM 40-240，禁秒/tick。
分工：melody單音不重疊；chords一次3-4音；bass跟根音低1-2八度；drums走channel 9。

== 音階 ==
${SCALES_TEXT}

== 和弦 ==
${CHORDS_TEXT}
C大調級數 I=C(maj) ii=Dm iii=Em IV=F V=G vi=Am vii=Bdim。

== 進行/終止/曲式 ==
常用 ${kv(PROGRESSIONS)}；功能 ${kv(FUNCTIONS)}；接續例 I->${NEXT_CHORD.I.join("/")}, IV->${NEXT_CHORD.IV.join("/")}, V->${NEXT_CHORD.V.join("/")}, vi->${NEXT_CHORD.vi.join("/")}, ii->${NEXT_CHORD.ii.join("/")}。
終止 ${kv(CADENCES)}；曲式 ${kv(FORMS)}；鼓型 ${kv(RHYTHMS)}。

== 音色/鼓 ==
GM常用 ${kv(GM_PROGRAMS)}；鼓 ${Object.entries(DRUM_MAP).map(([k, v]) => `${k}=${v}`).join(" ")}。

== 力度 ==
${VELOCITY_GUIDE}`;

export const TOOL_GUIDE_TEXT = Object.entries(TOOL_DOCS)
  .map(([name, t]) => `【${name}】${t.title}：${t.what} 何時：${t.when} 例：${t.example}`)
  .join("\n");
