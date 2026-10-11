import * as Tone from "tone";
import { getMasterBus, midiToFreq } from "./instruments";

interface DrumChain {
  membrane: Tone.MembraneSynth;
  noise: Tone.NoiseSynth;
  metal: Tone.MetalSynth;
}

// 每個目標節點一條鼓組鏈：鼓也走音軌 Channel，音量/聲相/mute/solo 才會生效。
// 以 WeakMap 存，音軌鏈路重建（改效果器）後舊節點可被回收。
const chains = new WeakMap<object, DrumChain>();

/** 取得（或建立）連到目標節點的鼓組合成器鏈。未指定目標時退回 Master。 */
function ensure(targetNode?: Tone.ToneAudioNode): DrumChain {
  const dest: Tone.ToneAudioNode = targetNode ?? getMasterBus().channel;
  const key = dest as unknown as object;
  const cached = chains.get(key);
  if (cached) return cached;

  const chain: DrumChain = {
    membrane: new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
    }),
    noise: new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.002, decay: 0.22, sustain: 0 },
    }),
    metal: new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }),
  };
  chain.membrane.connect(dest);
  chain.noise.connect(dest);
  chain.metal.connect(dest);
  chains.set(key, chain);
  return chain;
}

/** GM 鼓 pitch -> 專屬合成音色 (36 kick, 38/40 snare, 42 closed hat, 46 open hat, 49 crash) */
const HATS = new Set([42, 44]);
const OPEN_HATS = new Set([46, 49, 51]);

export function triggerDrum(
  pitch: number,
  time: number,
  velocity: number,
  targetNode?: Tone.ToneAudioNode
): void {
  const { membrane: m, noise: n, metal: met } = ensure(targetNode);
  const v = Math.max(0.01, Math.min(1, velocity / 127));

  if (pitch === 35 || pitch === 36) {
    // Punchy Kick
    m.triggerAttackRelease("C1", 0.35, time, v);
  } else if (pitch === 38 || pitch === 40) {
    // Snappy Snare: 混合短音膜衝擊波與白噪音
    m.triggerAttackRelease("G2", 0.12, time, v * 0.6);
    n.triggerAttackRelease(0.18, time, v);
  } else if (HATS.has(pitch)) {
    // Crisp Closed Hi-Hat
    met.triggerAttackRelease(200, 0.06, time, v * 0.75);
  } else if (OPEN_HATS.has(pitch)) {
    // Open Hi-Hat / Crash Cymbal
    met.triggerAttackRelease(180, 0.35, time, v * 0.85);
  } else {
    // Tom / Percussion
    m.triggerAttackRelease(midiToFreq(pitch), 0.22, time, v * 0.9);
  }
}
