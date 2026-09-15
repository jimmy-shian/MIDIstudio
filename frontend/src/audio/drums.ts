import * as Tone from "tone";
import { midiToFreq } from "./instruments";

// 模組：鼓合成。補完前版 `if (kind === drums) continue` 的未完成缺口。
let membrane: Tone.MembraneSynth | null = null;
let noise: Tone.NoiseSynth | null = null;

function ensure(): { membrane: Tone.MembraneSynth; noise: Tone.NoiseSynth } {
  if (!membrane) membrane = new Tone.MembraneSynth().toDestination();
  if (!noise) noise = new Tone.NoiseSynth().toDestination();
  return { membrane, noise };
}

/** GM 鼓 pitch -> 合成器：36 kick / 38,40 snare / 42,46,49 hats+cymbal，其餘走 membrane。 */
const HATS = new Set([42, 44, 46, 49, 51]);
export function triggerDrum(pitch: number, time: number, velocity: number): void {
  const { membrane: m, noise: n } = ensure();
  const v = velocity / 127;
  if (pitch === 36) m.triggerAttackRelease("C1", 0.4, time, v);
  else if (pitch === 38 || pitch === 40) n.triggerAttackRelease(0.2, time, v);
  else if (HATS.has(pitch)) n.triggerAttackRelease(0.1, time, v * 0.8);
  else m.triggerAttackRelease(midiToFreq(pitch), 0.25, time, v);
}
