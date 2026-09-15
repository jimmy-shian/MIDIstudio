// 模組：GM 音色 + 鼓組。agent 選 program / 寫鼓時查表，不用猜數字。
// 為保持檔案小巧，只收常用；完整 128 可再擴充。

/** 常用 GM program：name -> number */
export const GM_PROGRAMS: Record<string, number> = {
  acoustic_grand_piano: 0,
  bright_piano: 1,
  electric_piano: 4,
  rhodes: 4,
  organ: 16,
  acoustic_guitar: 24,
  electric_guitar: 27,
  bass_fingered: 33,
  bass_picked: 34,
  synth_bass: 38,
  violin: 40,
  cello: 42,
  strings: 48,
  choir: 52,
  trumpet: 56,
  sax: 64,
  flute: 73,
  lead_synth: 80,
  pad: 88,
  drums_standard: 0, // 鼓走 channel 9，program 忽略
};

/** GM 鼓：midi -> 名稱（channel 9） */
export const DRUM_MAP: Record<number, string> = {
  35: "kick",
  36: "kick",
  37: "side_stick",
  38: "snare",
  39: "clap",
  40: "snare",
  42: "closed_hat",
  44: "pedal_hat",
  46: "open_hat",
  49: "crash",
  51: "ride",
  56: "cowbell",
};

/** 軌種 -> 建議 program 名 */
export const KIND_PROGRAM: Record<string, string> = {
  melody: "acoustic_grand_piano",
  chords: "acoustic_grand_piano",
  bass: "bass_fingered",
  drums: "drums_standard",
};
