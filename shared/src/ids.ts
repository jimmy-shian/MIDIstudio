// 模組：ID 生成。抽離前散落在 project-ops 內的全域 seq。
let seq = 1;
export function newNoteId(): string {
  return `n${Date.now().toString(36)}_${seq++}`;
}
export function newTrackId(): string {
  return `t${Date.now().toString(36)}_${seq++}`;
}
export function newProjectId(): string {
  return `p${Date.now().toString(36)}_${seq++}`;
}
