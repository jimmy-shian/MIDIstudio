import type { ToolOp } from "@midistudio/shared";

// 模組：tool_calls -> ToolOp。前身在 agentLoop.ts 內聯。
export function toolCallsToOps(msg: any): ToolOp[] {
  const calls = msg.tool_calls ?? [];
  return calls.map((c: any) => {
    const args = typeof c.function.arguments === "string" ? JSON.parse(c.function.arguments) : c.function.arguments;
    return { op: c.function.name, ...args } as ToolOp;
  });
}
