import { randomUUID } from "node:crypto";
import { getDb } from "./database.js";

// 模組：對話記憶。session 制：前端帶 sessionId 來，後端把歷史塞回 prompt。
// 只存「人話」（需求＋結果摘要），不存完整 tool JSON；每會話留最近 N 輪，防無限膨脹。

const MAX_TURNS = 10;
const MAX_CHARS = 4000;

export interface HistoryMsg {
  role: "user" | "assistant";
  content: string;
}

export function newSessionId(): string {
  return randomUUID();
}

// messages 表由 database.getDb() 初始化時一次建好；這裡只取連線，不再每次跑 DDL。
// 舊寫法每個 getHistory/appendTurn 都 exec 兩句 CREATE，SQLite 每次都要檢查＋記日誌，白耗 SSD。
function ensureTable(): void {
  getDb();
}

/** 取歷史（舊→新），總量裁到 MAX_CHARS 內 */
export function getHistory(sessionId: string): HistoryMsg[] {
  ensureTable();
  const rows = getDb()
    .prepare("SELECT role, content FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?")
    .all(sessionId, MAX_TURNS * 2) as HistoryMsg[];
  const ordered = rows.reverse();
  let total = 0;
  const kept: HistoryMsg[] = [];
  for (let i = ordered.length - 1; i >= 0; i--) {
    total += ordered[i].content.length;
    if (total > MAX_CHARS) break;
    kept.unshift(ordered[i]);
  }
  // 盡量從 user 開始，砍掉開頭落單的 assistant
  while (kept.length && kept[0].role !== "user") kept.shift();
  return kept;
}

/** 存一輪（需求＋結果摘要），並裁掉超出的舊輪 */
export function appendTurn(sessionId: string, userText: string, assistantText: string): void {
  ensureTable();
  const now = Date.now();
  const db = getDb();
  const ins = db.prepare("INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)");
  const txn = db.transaction(() => {
    ins.run(sessionId, "user", userText.slice(0, 2000), now);
    ins.run(sessionId, "assistant", assistantText.slice(0, 2000), now);
    db.prepare(
      "DELETE FROM messages WHERE session_id = ? AND id NOT IN (SELECT id FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?)"
    ).run(sessionId, sessionId, MAX_TURNS * 2);
  });
  txn();
}

/** 整段忘掉（新對話/隱私）。回傳實際刪掉的訊息數。 */
export function clearSession(sessionId: string): { deletedMessages: number } {
  ensureTable();
  const r = getDb().prepare("DELETE FROM messages WHERE session_id = ?").run(sessionId);
  return { deletedMessages: r.changes };
}

export interface SessionMeta {
  sessionId: string;
  turns: number;
  updatedAt: number;
}

/** 先看再清：列出全部會話（輪數＋最後更新）。 */
export function listSessions(): SessionMeta[] {
  ensureTable();
  return getDb()
    .prepare("SELECT session_id AS sessionId, CAST(COUNT(*) / 2 AS INTEGER) AS turns, MAX(created_at) AS updatedAt FROM messages GROUP BY session_id ORDER BY updatedAt DESC")
    .all() as SessionMeta[];
}

/** 批次清：刪掉 N 天沒碰的會話。回傳會話數＋訊息數。 */
export function cleanupOldSessions(olderThanDays: number): { deletedSessions: number; deletedMessages: number } {
  ensureTable();
  const cutoff = Date.now() - Math.max(0, olderThanDays) * 86_400_000;
  const db = getDb();
  const stale = db
    .prepare("SELECT DISTINCT session_id AS sessionId FROM messages WHERE created_at < ?")
    .all(cutoff) as { sessionId: string }[];
  let deletedMessages = 0;
  const txn = db.transaction(() => {
    for (const s of stale) {
      deletedMessages += db.prepare("DELETE FROM messages WHERE session_id = ?").run(s.sessionId).changes;
    }
  });
  txn();
  return { deletedSessions: stale.length, deletedMessages };
}
