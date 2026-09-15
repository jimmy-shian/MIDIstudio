import type { ProjectState, ToolOp } from "@midistudio/shared";

// 模組：AI 傳輸。前身混有 exportMidi，已拆到 ./midiClient.ts，本檔只留 agent。
export interface AgentResponse {
  reply: string;
  ops: ToolOp[];
  reports: string[];
  project: ProjectState;
  sessionId: string;
}

export async function sendToAgent(prompt: string, project: ProjectState, sessionId?: string | null): Promise<AgentResponse> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, project, sessionId: sessionId ?? undefined }),
  });
  if (!res.ok) throw new Error(`backend ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function clearSession(sessionId: string): Promise<void> {
  await fetch("/api/agent/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
}

export interface SessionMeta {
  sessionId: string;
  turns: number;
  updatedAt: number;
}

export async function listSessions(): Promise<SessionMeta[]> {
  const res = await fetch("/api/agent/sessions");
  if (!res.ok) throw new Error(`backend ${res.status}`);
  return ((await res.json()) as { sessions: SessionMeta[] }).sessions;
}

export async function cleanupSessions(olderThanDays = 30): Promise<{ deletedSessions: number; deletedMessages: number }> {
  const res = await fetch("/api/agent/cleanup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ olderThanDays }),
  });
  if (!res.ok) throw new Error(`backend ${res.status}: ${await res.text()}`);
  return res.json();
}
