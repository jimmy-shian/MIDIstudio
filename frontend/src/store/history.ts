import type { ProjectState } from "@midistudio/shared";

// 模組：歷史堆疊純函數。store 只負責接線，規則全在這裡，可單測。
export interface HistorySlice {
  past: ProjectState[];
  future: ProjectState[];
}

/** 歷史上限：防長 session 吃掉記憶體 */
export const MAX_HISTORY = 50;

/** 只取工程欄位快照（排除 isPlaying/past/future 等 UI 態）
 *
 * 零拷貝：直接共用 tracks/note 引用，不做 JSON 深拷貝。
 * 安全前提是 applyOps 為 copy-on-write（絕不原地改輸入），已在上輪修正中保證：
 * 新狀態只會取代 track/note 物件，不會 mutate 舊物件，所以舊引用本身就是不可變快照。
 * 這讓力度拖曳 60fps 下的歷史記錄成本從「每幀全工程 stringify+parse」降到接近零；
 * 過去 50 步歷史也不再是 50 份深拷貝。timeSig 只有兩個數字，順手複一份。 */
export function snapshotOf(s: ProjectState): ProjectState {
  return {
    bpm: s.bpm,
    keyRoot: s.keyRoot,
    scale: s.scale,
    timeSig: [s.timeSig[0], s.timeSig[1]],
    tracks: s.tracks,
    selectedTrackId: s.selectedTrackId,
  };
}

/** 寫入前呼叫：現況推進 past，清空 redo */
export function pushHistory(hist: HistorySlice, current: ProjectState): HistorySlice {
  const past = [...hist.past, snapshotOf(current)];
  if (past.length > MAX_HISTORY) past.splice(0, past.length - MAX_HISTORY);
  return { past, future: [] };
}

export interface StepResult {
  slice: HistorySlice;
  project: ProjectState;
}

export function undoStep(hist: HistorySlice, current: ProjectState): StepResult | null {
  if (!hist.past.length) return null;
  const prev = hist.past[hist.past.length - 1];
  const future = [snapshotOf(current), ...hist.future].slice(0, MAX_HISTORY);
  return { slice: { past: hist.past.slice(0, -1), future }, project: prev };
}

export function redoStep(hist: HistorySlice, current: ProjectState): StepResult | null {
  if (!hist.future.length) return null;
  const [next, ...rest] = hist.future;
  const past = [...hist.past, snapshotOf(current)].slice(-MAX_HISTORY);
  return { slice: { past, future: rest }, project: next };
}
