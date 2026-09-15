import * as Tone from "tone";

// 模組：樂器管理。ToneEngine 前身把 synth 單例混在排程邏輯內。
let synth: Tone.PolySynth | null = null;

export function getMelodicSynth(): Tone.PolySynth {
  if (!synth) synth = new Tone.PolySynth(Tone.Synth).toDestination();
  return synth;
}

// 頻率查表：舊寫法每顆音都 new Tone.Frequency（物件配置＋解析），
// 大工程按一次播放就產生數千個短命物件；十二平均律直接算表，O(1) 無配置。
const FREQ_TABLE: number[] = Array.from(
  { length: 128 },
  (_, m) => 440 * Math.pow(2, (m - 69) / 12)
);

export function midiToFreq(midi: number): number {
  const m = Math.max(0, Math.min(127, Math.round(midi)));
  return FREQ_TABLE[m];
}
