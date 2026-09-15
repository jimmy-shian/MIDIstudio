// 基礎 MIDI 音樂元素：對應 D:\FL Studio 20\Data\Patches\Scores\Stamps + Reference scales
// 全部用「距 root 半音數」表示，LLM 直接查表，不用猜。

export const PITCH_CLASS_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"] as const;

/** 音階：name -> 半音 offsets。涵蓋 FL Reference scales 全部常用。 */
export const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  natural_minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
  major_pentatonic: [0, 2, 4, 7, 9],
  minor_pentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  whole_tone: [0, 2, 4, 6, 8, 10],
  diminished_hw: [0, 1, 3, 4, 6, 7, 9, 10],
};

/** 和弦：name -> 半音 offsets。涵蓋 FL Stamps/Melodic-chords。 */
export const CHORDS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  fifth: [0, 7],
  octave: [0, 12],
  major7: [0, 4, 7, 11],
  dominant7: [0, 4, 7, 10],
  minor7: [0, 3, 7, 10],
  minor_major7: [0, 3, 7, 11],
  diminished7: [0, 3, 6, 9],
  half_diminished7: [0, 3, 6, 10],
  minor9: [0, 3, 7, 10, 14],
  major9: [0, 4, 7, 11, 14],
  add9: [0, 4, 7, 14],
};

/** 常用進行（羅馬數字，相對大調）。 */
export const PROGRESSIONS: Record<string, string[]> = {
  pop_1564: ["I", "V", "vi", "IV"],
  sensitive: ["vi", "IV", "I", "V"],
  jazz_251: ["ii", "V", "I"],
  canon: ["I", "V", "vi", "iii", "IV", "I", "IV", "V"],
  minor_1645: ["i", "VI", "III", "VII"],
};

/** 大調羅馬數字 -> 級數半音 + 和弦性質 */
export const ROMAN_MAJOR: Record<string, { semitone: number; chord: string }> = {
  I: { semitone: 0, chord: "major" },
  ii: { semitone: 2, chord: "minor" },
  iii: { semitone: 4, chord: "minor" },
  IV: { semitone: 5, chord: "major" },
  V: { semitone: 7, chord: "major" },
  vi: { semitone: 9, chord: "minor" },
  vii: { semitone: 11, chord: "diminished" },
};

export function pcName(pc: number): string {
  return PITCH_CLASS_NAMES[((pc % 12) + 12) % 12];
}

/** C4=60。octave 採用科學音高記號。 */
export function nameToMidi(name: string): number {
  const m = /^([A-G])(#|b)?(-?\d+)$/.exec(name.trim());
  if (!m) throw new Error(`bad note name: ${name}`);
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let pc = base[m[1]];
  if (m[2] === "#") pc += 1;
  if (m[2] === "b") pc -= 1;
  const octave = parseInt(m[3], 10);
  return 12 * (octave + 1) + pc;
}

export function midiToName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${PITCH_CLASS_NAMES[pc]}${octave}`;
}

/** 給定調性 root midi（如 C3=48），回傳該和弦全部 midi。 */
export function chordNotes(rootMidi: number, chordName: string): number[] {
  const iv = CHORDS[chordName];
  if (!iv) throw new Error(`unknown chord: ${chordName}`);
  return iv.map((s) => rootMidi + s);
}

/** 給定調性（如 keyRoot=0=C, scale=major），回傳一度到八度內合法 pitch classes。 */
export function scalePitchClasses(keyRoot: number, scale: string): number[] {
  const iv = SCALES[scale];
  if (!iv) throw new Error(`unknown scale: ${scale}`);
  return iv.map((s) => (keyRoot + s) % 12);
}
