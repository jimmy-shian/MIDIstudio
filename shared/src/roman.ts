// 模組：羅馬數字 -> MIDI 根音與和弦類型。
// 支援自然大調、自然小調、和聲小調、副屬和弦與常用七和弦解析。
import { ROMAN_MAJOR, ROMAN_MINOR } from "./music-theory.js";

export function romanToRootChord(
  keyRoot: number,
  roman: string,
  octave = 3,
  scale = "major"
): { root: number; chord: string } {
  const base = 12 * (octave + 1);
  const clean = roman.trim();
  const isMinorContext = scale.toLowerCase().includes("minor");

  let hit = isMinorContext
    ? ROMAN_MINOR[clean] ?? ROMAN_MAJOR[clean]
    : ROMAN_MAJOR[clean] ?? ROMAN_MINOR[clean];

  if (!hit) {
    // 容錯檢查：若為小寫開頭且在小調表中
    hit = ROMAN_MINOR[clean] ?? ROMAN_MINOR[clean.toLowerCase()];
  }
  if (!hit) {
    hit = ROMAN_MAJOR[clean] ?? ROMAN_MAJOR[clean.toUpperCase()];
  }

  if (!hit) {
    // 保底：若完全未知，小寫則退回小三和弦，大寫退回大三和弦
    const isLower = /^[a-z]/.test(clean);
    return { root: base + keyRoot, chord: isLower ? "minor" : "major" };
  }

  return { root: base + ((keyRoot + hit.semitone) % 12), chord: hit.chord };
}
