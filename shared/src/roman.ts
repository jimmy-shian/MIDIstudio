// 模組：羅馬數字 -> MIDI。前身在 project-ops.ts 內聯函式，抽出以便 agentLoop/fallback 共用。
import { ROMAN_MAJOR } from "./music-theory.js";

export function romanToRootChord(
  keyRoot: number,
  roman: string,
  octave = 3
): { root: number; chord: string } {
  const base = 12 * (octave + 1);
  const hit =
    ROMAN_MAJOR[roman] ?? ROMAN_MAJOR[roman.toUpperCase()] ?? ROMAN_MAJOR[roman.toLowerCase()];
  if (!hit) return { root: base + keyRoot, chord: "major" };
  return { root: base + ((keyRoot + hit.semitone) % 12), chord: hit.chord };
}
