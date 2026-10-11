// 模組：琴格座標。欄位一律整數拍（snap 只影響音符起音/時值，不影響欄位）。
// 小節線與拍號計算一律以 shared/getBeatsPerBar 為準，禁止硬編碼 4/4。
export function beatsInView(startBeat: number, beatsVisible: number): number[] {
  const out: number[] = [];
  for (let b = Math.floor(startBeat); b < startBeat + beatsVisible; b++) out.push(b);
  return out;
}

export function pitchesInView(lowPitch: number, highPitch: number): number[] {
  const out: number[] = [];
  for (let p = highPitch; p >= lowPitch; p--) out.push(p);
  return out;
}

/** 起音量化到 snap 格 */
export function snapQuantize(beat: number, snap: number): number {
  return Math.round(beat / snap) * snap;
}

export function snapLabel(snap: number): string {
  if (Math.abs(snap - 1) < 1e-6) return "1 拍（四分音符）";
  if (Math.abs(snap - 0.5) < 1e-6) return "0.5 拍（八分音符）";
  if (Math.abs(snap - 1 / 3) < 1e-4) return "1/3 拍（八分三連）";
  if (Math.abs(snap - 0.25) < 1e-6) return "0.25 拍（十六分音符）";
  if (Math.abs(snap - 1 / 6) < 1e-4) return "1/6 拍（十六分三連）";
  return `${snap} 拍`;
}

export function isTripletSnap(snap: number): boolean {
  return Math.abs(snap - 1 / 3) < 1e-4 || Math.abs(snap - 1 / 6) < 1e-4;
}
