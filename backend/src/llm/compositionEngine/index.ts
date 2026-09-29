import type { ProjectState, ToolOp } from "@midistudio/shared";
import { applyOps, validateOps } from "@midistudio/shared";

/** Composition Engine：把 Guideline Book 轉成可執行的工程操作。 */
export const COMPOSITION_ENGINE_GUIDELINES = `
把創作計畫映射為對目前工程安全、可驗證的 DAW 操作：
- 先辨認新作/續寫/局部修改，讀取目前工程與使用者明確限制；保留未要求改動的內容。缺少細節時做最少且一致的假設。
- 內部先列意圖、總長/段落、核心素材和必要聲部，再依依賴順序操作；局部任務只碰指定範圍。
- 視需求設定調性/速度 → 建立和聲骨架 → 加入旋律、低音、節奏 → 處理力度/音色/演奏細節。不需要的階段跳過，不為套模板覆寫設定。
- 和弦使用 set_chord_progression，bars 必須等於需求總長。trackId/note id 只能取自目前工程；時間用 beats；add_notes 每次最多32音，每輪最多2個工具。
- 每批操作後讀取回報與更新工程；驗證失敗只修正錯誤操作，不重放成功操作。完成需求後停止，Critic 只對高影響且可由現有工具修正的問題採取動作。`;

/** 對提案執行工程硬限制；此處是所有 LLM 作曲操作進入工程前的閘門。 */
export function validateCompositionOps(project: ProjectState, ops: ToolOp[]): string[] {
  const errors: string[] = [];
  if (ops.length > 2) errors.push("每個模型回合最多 2 個操作");
  for (const op of ops) {
    if (op.op === "add_notes" && op.notes.length > 32) {
      errors.push(`單次 add_notes 最多 32 個音（收到 ${op.notes.length}）`);
    }
  }
  return [...errors, ...validateOps(project, ops)];
}

/** 驗證通過後套用一批操作，回傳新工程與操作報告。 */
export function executeCompositionOps(project: ProjectState, ops: ToolOp[]) {
  const errors = validateCompositionOps(project, ops);
  if (errors.length) return { ok: false as const, errors, project, reports: [] };
  const applied = applyOps(project, ops);
  return { ok: true as const, errors: [], ...applied };
}
