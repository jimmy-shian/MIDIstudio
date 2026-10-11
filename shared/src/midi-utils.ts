// 時間與拍號座標核心：唯一高精度標準 PPQ = 960 Ticks
export const PPQ = 960;

/** beats <-> ticks 互轉 */
export function beatsToTicks(beats: number): number {
  return Math.round(beats * PPQ);
}

export function ticksToBeats(ticks: number): number {
  return ticks / PPQ;
}

/** beats <-> 秒換算 */
export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats * 60) / Math.max(1, bpm);
}

export function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds * Math.max(1, bpm)) / 60;
}

export function ticksToSeconds(ticks: number, bpm: number): number {
  return beatsToSeconds(ticksToBeats(ticks), bpm);
}

export function secondsToTicks(seconds: number, bpm: number): number {
  return beatsToTicks(secondsToBeats(seconds, bpm));
}

/** 每小節四分音符等值長度（即標準 beats 拍數） */
export function getBeatsPerBar(timeSig: [number, number]): number {
  const [num, den] = timeSig;
  const safeDen = den > 0 ? den : 4;
  const safeNum = num > 0 ? num : 4;
  return safeNum * (4 / safeDen);
}

/** 每小節整數 Ticks */
export function getMeasureTicks(timeSig: [number, number]): number {
  return Math.round(getBeatsPerBar(timeSig) * PPQ);
}

/**
 * 拍點感知分組 (Beat Grouping Ticks)
 * 例如：
 * 4/4 -> [960, 960, 960, 960] (4 個四分音符拍)
 * 3/4 -> [960, 960, 960] (3 個四分音符拍)
 * 2/4 -> [960, 960] (2 個四分音符拍)
 * 6/8 -> [1440, 1440] (2 個附點四分音符拍)
 */
export function getBeatGrouping(timeSig: [number, number]): number[] {
  const [num, den] = timeSig;
  if (den === 8 && num % 3 === 0) {
    // 複合拍 (6/8, 9/8, 12/8): 每拍為 3 個八分音符 = 1440 ticks
    const dottedBeats = num / 3;
    return Array.from({ length: dottedBeats }, () => 1440);
  }
  // 單拍子: 每個基本拍為 (4 / den) * PPQ
  const beatTick = Math.round((4 / den) * PPQ);
  return Array.from({ length: num }, () => beatTick);
}

/**
 * 重音強度模式 (0-1.0)
 * 4/4 -> [1.0, 0.6, 0.8, 0.6] (強 - 弱 - 次強 - 弱)
 * 3/4 -> [1.0, 0.6, 0.6] (強 - 弱 - 弱)
 * 6/8 -> [1.0, 0.7] (強 - 次強)
 */
export function getAccentPattern(timeSig: [number, number]): number[] {
  const [num, den] = timeSig;
  if (num === 4 && den === 4) return [1.0, 0.6, 0.8, 0.6];
  if (num === 3 && den === 4) return [1.0, 0.6, 0.6];
  if (num === 2 && den === 4) return [1.0, 0.6];
  if (num === 6 && den === 8) return [1.0, 0.7];
  return Array.from({ length: num }, (_, i) => (i === 0 ? 1.0 : 0.65));
}

/** 小節與拍數轉絕對 Tick */
export function barPositionToTick(bar: number, beat: number, timeSig: [number, number]): number {
  const measureTicks = getMeasureTicks(timeSig);
  return Math.round(bar * measureTicks + beat * PPQ);
}

/** 絕對 Tick 轉小節與小節內拍數 */
export function tickToBarPosition(
  tick: number,
  timeSig: [number, number]
): { bar: number; beat: number; tickInBar: number } {
  const measureTicks = getMeasureTicks(timeSig);
  const safeMeasure = measureTicks > 0 ? measureTicks : 3840;
  const bar = Math.floor(tick / safeMeasure);
  const tickInBar = tick % safeMeasure;
  const beat = tickInBar / PPQ;
  return { bar, beat, tickInBar };
}

/** 量化到指定 Tick 網格 */
export function quantizeTick(tick: number, gridTicks: number): number {
  if (gridTicks <= 0) return tick;
  return Math.round(tick / gridTicks) * gridTicks;
}

/** 量化到指定拍數 (相容舊函式) */
export function quantizeBeat(beat: number, grid = 0.25): number {
  if (grid <= 0) return beat;
  return Math.round(beat / grid) * grid;
}

export function clampPitch(p: number): number {
  return Math.max(0, Math.min(127, Math.round(p)));
}

export function clampVelocity(v: number): number {
  return Math.max(1, Math.min(127, Math.round(v)));
}
