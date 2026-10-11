// 薄編排層：只留迴圈流程，摘要/轉換/fallback 已拆到同目錄模組。
// 嚴格落實 OpenAI / OpenRouter Tool Calling 握手閉環協議。
import type { ProjectState, ToolOp } from "@midistudio/shared";
import { TOOL_SCHEMAS } from "@midistudio/shared";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { executeCompositionOps } from "./compositionEngine/index.js";
import { buildCriticReviewInstruction } from "./musicCritic/index.js";
import { chatWithTools, resolveLlmConfig } from "./client.js";
import { projectToText } from "./projectContext.js";
import { parseToolCalls } from "./toolConverter.js";
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
      if (!result.ok) {
        return {
          reply: "參數錯誤：" + result.errors.join(";"),
          ops: [],
          reports: [],
          project,
          sessionId,
        };
      }
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
    {
      role: "user",
      content: `需求：${prompt}\n\n目前工程：\n${projectToText(project)}\n\n請調用工具完成，不要只回文字。`,
    },
  ];
  let allOps: ToolOp[] = [];
  let current = project;
  let lastReply = "";
  const allReports: string[] = [];
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

    const parsedCalls = parseToolCalls(msg);

    if (finalReviewRound) break;

    // 若 Assistant 未回傳任何工具呼叫
    if (!parsedCalls.length) {
      if (!nudged && allOps.length === 0) {
        nudged = true;
        messages.push({
          role: "user",
          content:
            "不要只用文字描述。現在直接調用工具（如 create_composition、set_chord_progression、generate_drum_pattern 或 add_notes）將音樂寫入工程。",
        });
        continue;
      }
      break;
    }

    // 關鍵修復：針對每一個 Tool Call，依序執行並立即回傳標準 role: "tool"
    const validOps: ToolOp[] = [];
    const roundReports: string[] = [];
    let hadError = false;

    for (const call of parsedCalls) {
      if (!call.op) {
        hadError = true;
        messages.push({
          role: "tool",
          tool_call_id: call.callId,
          name: call.name,
          content: JSON.stringify({ ok: false, error: call.error || "參數解析失敗" }),
        });
        continue;
      }

      const applied = executeCompositionOps(current, [call.op]);
      if (!applied.ok) {
        hadError = true;
        messages.push({
          role: "tool",
          tool_call_id: call.callId,
          name: call.name,
          content: JSON.stringify({ ok: false, errors: applied.errors }),
        });
      } else {
        current = applied.project;
        validOps.push(call.op);
        allOps.push(call.op);
        const msgs = applied.reports.map((r) => r.message);
        roundReports.push(...msgs);
        allReports.push(...msgs);

        messages.push({
          role: "tool",
          tool_call_id: call.callId,
          name: call.name,
          content: JSON.stringify({ ok: true, reports: msgs }),
        });
      }
    }

    // 在所有 tool 訊息完整回填後，才推送 Critic 檢驗指令或錯誤修正指引
    if (hadError) {
      messages.push({
        role: "user",
        content: "部分工具調用參數有誤，請根據上述 tool 回報的錯誤修正參數再試一次。",
      });
    } else {
      messages.push({
        role: "user",
        content: buildCriticReviewInstruction(roundReports),
      });
    }
  }

  const reply = lastReply || `完成 ${allOps.length} 組操作。`;
  appendTurn(sessionId, prompt, `${reply}（已執行：${allReports.join("；") || "無"}）`);
  return { reply, ops: allOps, reports: allReports, project: current, sessionId };
}
