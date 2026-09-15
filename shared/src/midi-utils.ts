/** beats <-> 秒換算，唯一時間真相：beats。 */
export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}
export function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds * bpm) / 60;
}
/** 量化到 grid，如 0.25 = 16分音符 */
export function quantizeBeat(beat: number, grid = 0.25): number {
  return Math.round(beat / grid) * grid;
}
export function clampPitch(p: number): number {
  return Math.max(0, Math.min(127, Math.round(p)));
}
export function clampVelocity(v: number): number {
  return Math.max(1, Math.min(127, Math.round(v)));
}
