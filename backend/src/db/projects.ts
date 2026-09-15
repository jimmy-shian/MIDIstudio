import { emptyProject, newProjectId, type ProjectState } from "@midistudio/shared";
import { getDb } from "./database.js";

// 模組：專案 CRUD。Express 路由與 MCP 共用同一份，前後端看到同一批工程。
//
// SSD/記憶體保護：
// - listProjects 只 SELECT 元數據欄（不碰 data 大欄），noteCount 讀預存欄位。
//   舊寫法把全表 data 全查出來再逐個 JSON.parse，只為數音符數——工程一多，
//   每次開列表就是全庫 parse 一遍。
// - save 只 UPDATE＋取回小欄（name/時間），不再回讀 data 大欄＋再 parse 一次。
export interface ProjectRow {
  id: string;
  name: string;
  data: ProjectState;
  created_at: number;
  updated_at: number;
}

export interface ProjectMeta {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  noteCount: number;
}

export function countNotes(data: ProjectState): number {
  let n = 0;
  for (const t of data.tracks) n += t.notes?.length ?? 0;
  return n;
}

function toRow(r: any): ProjectRow {
  return { id: r.id, name: r.name, data: JSON.parse(r.data), created_at: r.created_at, updated_at: r.updated_at };
}

export function listProjects(): ProjectMeta[] {
  const rows = getDb()
    .prepare("SELECT id, name, note_count, created_at, updated_at FROM projects ORDER BY updated_at DESC")
    .all() as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    created_at: r.created_at,
    updated_at: r.updated_at,
    noteCount: r.note_count ?? 0,
  }));
}

export function getProjectRow(id: string): ProjectRow | null {
  const r = getDb().prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;
  return r ? toRow(r) : null;
}

export function createProject(name: string, data?: ProjectState): ProjectRow {
  const now = Date.now();
  const dataObj = data ?? emptyProject();
  const cleanName = name.trim() || "未命名工程";
  const id = newProjectId();
  getDb().prepare("INSERT INTO projects (id, name, data, note_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, cleanName, JSON.stringify(dataObj), countNotes(dataObj), now, now);
  return { id, name: cleanName, data: dataObj, created_at: now, updated_at: now };
}

export function saveProjectRow(id: string, data: ProjectState, name?: string): ProjectRow | null {
  // 單次序列化：呼叫方給物件，這裡只 stringify 一次；不用先 SELECT 回讀整列。
  const json = JSON.stringify(data);
  if (!saveProjectJson(id, json, countNotes(data), name)) return null;
  // 只回讀小欄；data 直接沿用傳入物件，不再 parse（舊寫法回讀大欄＋再 parse）
  const meta = getDb().prepare("SELECT name, created_at, updated_at FROM projects WHERE id = ?").get(id) as any;
  if (!meta) return null;
  return { id, name: meta.name, data, created_at: meta.created_at, updated_at: meta.updated_at };
}

/** 已序列化好的寫入路徑：MCP 防抖比較用掉一次 stringify，這裡直接寫，不再做第二次。
 *  只回傳成功與否，不回讀（呼叫方不需要列）。 */
export function saveProjectJson(id: string, json: string, noteCount: number, name?: string): boolean {
  const clean = name?.trim();
  const res = clean
    ? getDb().prepare("UPDATE projects SET name = ?, data = ?, note_count = ?, updated_at = ? WHERE id = ?")
      .run(clean, json, noteCount, Date.now(), id)
    : getDb().prepare("UPDATE projects SET data = ?, note_count = ?, updated_at = ? WHERE id = ?")
      .run(json, noteCount, Date.now(), id);
  return res.changes > 0;
}

export function deleteProject(id: string): boolean {
  return getDb().prepare("DELETE FROM projects WHERE id = ?").run(id).changes > 0;
}
