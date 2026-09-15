// 模組：力度顯示。預設值轉包 shared/op-defaults（後端共用），此檔只留顯示邏輯。
export { VELOCITY_DEFAULTS } from "@midistudio/shared";

export function velocityColor(v: number): string {
  if (v >= 100) return "#ff8787";
  if (v >= 85) return "#4dabf7";
  if (v >= 65) return "#63e6be";
  return "#868e96";
}

export function velocityHeight(v: number, maxH = 64): number {
  return Math.max(4, Math.round((v / 127) * maxH));
}
