import type { ToolOp } from "@midistudio/shared";

export interface ParsedToolCall {
  callId: string;
  name: string;
  op: ToolOp | null;
  rawArgs: any;
  error?: string;
}

// 模組：防禦性解析 tool_calls -> ParsedToolCall[]
export function parseToolCalls(msg: any): ParsedToolCall[] {
  const calls = msg.tool_calls ?? [];
  return calls.map((c: any) => {
    const callId = c.id ?? `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const name = c.function?.name ?? "";
    let args: any = {};
    try {
      args =
        typeof c.function?.arguments === "string"
          ? JSON.parse(c.function.arguments)
          : c.function?.arguments ?? {};
      return { callId, name, op: { op: name, ...args } as ToolOp, rawArgs: args };
    } catch (e: any) {
      return {
        callId,
        name,
        op: null,
        rawArgs: c.function?.arguments,
        error: `JSON 參數解析失敗: ${e.message}`,
      };
    }
  });
}

/** 相容舊介面：過濾並回傳合法的 ToolOp 陣列 */
export function toolCallsToOps(msg: any): ToolOp[] {
  return parseToolCalls(msg)
    .filter((p) => p.op !== null)
    .map((p) => p.op as ToolOp);
}
