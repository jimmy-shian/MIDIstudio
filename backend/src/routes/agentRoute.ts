import { Router } from "express";
import { z } from "zod";
import { runAgent } from "../llm/agentLoop.js";
import { cleanupOldSessions, clearSession, listSessions } from "../db/conversations.js";

// 模組：AI 路由。session 制對話記憶：前端帶 sessionId 來，不帶即開新會話並回傳。
export const agentRoute = Router();

agentRoute.post("/agent", async (req, res) => {
  try {
    const schema = z.object({
      prompt: z.string().min(1).max(2000),
      project: z.any(),
      sessionId: z.string().max(64).optional(),
    });
    const { prompt, project, sessionId } = schema.parse(req.body);
    res.json(await runAgent(prompt, project, { sessionId }));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

agentRoute.post("/agent/clear", (req, res) => {
  try {
    const { sessionId } = z.object({ sessionId: z.string().min(1).max(64) }).parse(req.body);
    res.json({ ok: true, ...clearSession(sessionId) });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

agentRoute.get("/agent/sessions", (_req, res) => {
  res.json({ sessions: listSessions() });
});

agentRoute.post("/agent/cleanup", (req, res) => {
  try {
    const { olderThanDays } = z.object({ olderThanDays: z.number().min(0).max(365).default(30) }).parse(req.body);
    res.json({ ok: true, olderThanDays, ...cleanupOldSessions(olderThanDays) });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
