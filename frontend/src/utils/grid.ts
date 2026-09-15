// 模組：琴格座標。欄位一律整數拍（snap 只影響音符起音/時值，不影響欄位）。
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
  if (snap >= 1) return "1/4 拍";
  if (snap >= 0.5) return "1/8 拍";
  return "1/16 拍";
}
