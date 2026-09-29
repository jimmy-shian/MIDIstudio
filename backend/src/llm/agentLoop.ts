// 薄編排層：只留迴圈流程，摘要/轉換/fallback 已拆到同目錄模組。
import type { ProjectState, ToolOp } from "@midistudio/shared";
import { TOOL_SCHEMAS } from "@midistudio/shared";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { executeCompositionOps } from "./compositionEngine/index.js";
import { buildCriticReviewInstruction } from "./musicCritic/index.js";
import { chatWithTools, resolveLlmConfig } from "./client.js";
import { projectToText } from "./projectContext.js";
import { toolCallsToOps } from "./toolConverter.js";
import { fallbackOps } from "./fallback.js";
import { appendTurn, getHistory, newSessionId, type HistoryMsg } from "../db/conversations.js";

/** 留出多輪時間供分階段編曲、Critic 檢查與必要修改。 */
export const MAX_COMPOSITION_ROUNDS = 8;

export interface AgentResult {
  reply: string;
  ops: ToolOp[];
  reports: string[];
  project: ProjectState;
  sessionId: string;
}

export async function runAgent(
  prompt: string,
  project: ProjectState,
  opts?: { sessionId?: string }
): Promise<AgentResult> {
  const cfg = resolveLlmConfig();
  const sessionId = opts?.sessionId?.trim() || newSessionId();

  if (!cfg.apiKey) {
    const fb = fallbackOps(prompt, project);
    let next = project;
    const reports: string[] = [];
    for (let i = 0; i < fb.ops.length; i += 2) {
      const result = executeCompositionOps(next, fb.ops.slice(i, i + 2));
      if (!result.ok) return { reply: "參數錯誤：" + result.errors.join(";"), ops: [], reports: [], project, sessionId };
      next = result.project;
      reports.push(...result.reports.map((r) => r.message));
    }
    const out = { reply: fb.reply, ops: fb.ops, reports, project: next, sessionId };
    appendTurn(sessionId, prompt, `${fb.reply}（${out.reports.join("；")}）`);
    return out;
  }

  const history: HistoryMsg[] = getHistory(sessionId);
  let messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: `需求：${prompt}\n\n目前工程：\n${projectToText(project)}\n\n請調用工具完成，不要只回文字。` },
  ];
  let allOps: ToolOp[] = [];
  let current = project;
  let lastReply = "";
  const allReports: string[] = [];
  // 小模型常見：洋洋灑灑寫文字、一顆音都不調。這種情況只給一次補考機會。
  let nudged = false;

  for (let round = 0; round < MAX_COMPOSITION_ROUNDS; round++) {
    const finalReviewRound = round === MAX_COMPOSITION_ROUNDS - 1;
    const msg = await chatWithTools({
      config: cfg,
      messages,
      tools: TOOL_SCHEMAS,
      ...(finalReviewRound ? { toolChoice: "none" } : {}),
    });
    messages.push(msg);
    if (msg.content) lastReply = msg.content;
    const ops = toolCallsToOps(msg);
    if (finalReviewRound) break;
    if (!ops.length) {
      if (!nudged && allOps.length === 0) {
        nudged = true;
        messages.push({ role: "user", content: "不要只用文字描述。現在直接調用工具把音符寫進工程，先調 set_chord_progression 或 add_notes。" });
        continue;
      }
      break;
    }
    const applied = executeCompositionOps(current, ops);
    if (!applied.ok) {
      messages.push({ role: "user", content: `修正這些錯誤：${applied.errors.join(";")}` });
      continue;
    }
    current = applied.project;
    allOps.push(...ops);
    for (const r of applied.reports) allReports.push(r.message);
    messages.push({ role: "user", content: buildCriticReviewInstruction(applied.reports.map((r) => r.message)) });
    // 不提前 break：Critic 檢查後模型可再修正；模型無後續工具呼叫時停止，否則最多 8 輪。
  }
  // 注意：不再 applyOps(project, allOps) 重放一次。舊寫法把整份工程複製+重算第二遍，
  // 記憶體/CPU 直接翻倍；此處 current 已是累積結果，直接回傳即可。
  const reply = lastReply || `完成 ${allOps.length} 組操作。`;
  appendTurn(sessionId, prompt, `${reply}（已執行：${allReports.join("；") || "無"}）`);
  return { reply, ops: allOps, reports: allReports, project: current, sessionId };
}
