import type { ProjectState, ToolOp } from "@midistudio/shared";
import { applyOps, validateOps } from "@midistudio/shared";
import {
  countNotes, createProject, deleteProject, getProjectRow, listProjects, saveProjectJson, saveProjectRow,
  type ProjectMeta,
} from "../db/projects.js";

// 模組：MCP 會話工程。 backed by SQLite（與 Express 共用 backend/data/midistudio.db），
// 網頁改的 MCP 看得到，MCP 改的網頁重整也看得到。
// SSD 保護：記憶體為主、防抖合併、內容無變跳過；MIDISTUDIO_NO_PERSIST=1 可關落盤。

const NO_PERSIST = process.env.MIDISTUDIO_NO_PERSIST === "1" || process.env.MCP_NO_PERSIST === "1";
// 高頻 tool 連打合併窗口：預設 800ms → 2000ms（MCP_PERSIST_DEBOUNCE_MS 可覆寫）。
// 模型連調 10 個 op 只落盤 1 次；退出時會同步 flush，不丟尾巴。
const DEBOUNCE_MS = Math.max(0, Number(process.env.MCP_PERSIST_DEBOUNCE_MS ?? 2000) || 0);
const MAX_PERSIST_BYTES = 10_000_000;

let activeId: string | null = null;
let activeName = "";
let current: ProjectState | null = null;
let lastPersistedJson = "";
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let exitHooked = false;

function ensureActive(): void {
  if (activeId && current) return;
  const list = listProjects();
  if (activeId) {
    const row = getProjectRow(activeId);
    if (row) {
      current = row.data;
      activeName = row.name;
      lastPersistedJson = JSON.stringify(row.data);
      return;
    }
  }
  if (list.length) {
    activeId = list[0].id;
    activeName = list[0].name;
    current = getProjectRow(activeId)!.data;
  } else {
    const row = createProject("MCP 工程");
    activeId = row.id;
    activeName = row.name;
    current = row.data;
  }
  lastPersistedJson = JSON.stringify(current);
}

export function getActiveMeta(): { id: string; name: string } {
  ensureActive();
  // 名字快取在記憶體：舊寫法每次 getProjectRow 回讀整列（含 data 大欄＋parse），
  // host 輪詢一次就讀盤一次；現在熱路徑零磁碟。
  return { id: activeId!, name: activeName };
}

export function getProject(): ProjectState {
  ensureActive();
  return current!;
}

export function listAllProjects(): ProjectMeta[] {
  return listProjects();
}

export function openProject(id?: string): { id: string; name: string } {
  flushNow();
  if (id) {
    const row = getProjectRow(id);
    if (!row) throw new Error(`工程不存在: ${id}`);
    activeId = row.id;
    activeName = row.name;
    current = row.data;
  } else {
    activeId = null;
    current = null;
    ensureActive();
  }
  lastPersistedJson = JSON.stringify(current);
  return getActiveMeta();
}

export function createNewProject(name?: string): { id: string; name: string } {
  flushNow();
  const row = createProject(name?.trim() || "未命名工程");
  activeId = row.id;
  activeName = row.name;
  current = row.data;
  lastPersistedJson = JSON.stringify(current);
  return { id: row.id, name: row.name };
}

export function renameActiveProject(name: string): { id: string; name: string } {
  ensureActive();
  const row = saveProjectRow(activeId!, current!, name);
  if (!row) throw new Error(`工程已消失: ${activeId}`);
  activeName = row.name;
  return { id: row.id, name: row.name };
}

export function deleteSomeProject(id?: string): { deleted: string; active: { id: string; name: string } } {
  ensureActive();
  const target = id?.trim() || activeId!;
  if (!deleteProject(target)) throw new Error(`工程不存在: ${target}`);
  if (target === activeId) {
    activeId = null;
    current = null;
  }
  ensureActive();
  lastPersistedJson = JSON.stringify(current);
  return { deleted: target, active: getActiveMeta() };
}

export function loadProject(p: ProjectState): { reports: string[] } {
  const errs = validateProjectShape(p);
  if (errs.length) throw new Error(`工程格式錯：${errs.join(";")}`);
  ensureActive();
  current = p;
  schedulePersist();
  return { reports: [`已載入工程：${p.tracks.length} 軌`] };
}

export function applyToProject(ops: ToolOp[]): { reports: string[]; project: ProjectState } {
  ensureActive();
  const errs = validateOps(current!, ops);
  if (errs.length) throw new Error(`校驗失敗：${errs.join("；")}`);
  const { project, reports } = applyOps(current!, ops);
  current = project;
  schedulePersist();
  return { reports: reports.map((r) => r.message), project };
}

function validateProjectShape(p: any): string[] {
  if (!p || typeof p.bpm !== "number") return ["缺 bpm"];
  if (!Array.isArray(p.tracks)) return ["缺 tracks"];
  return [];
}

function schedulePersist(): void {
  if (NO_PERSIST || !current || !activeId) return;
  hookExitFlush();
  if (DEBOUNCE_MS <= 0) { flushNow(); return; }
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    flushNow();
  }, DEBOUNCE_MS);
}

/** 立即寫回（測試 / 切換工程前用）。 */
export function flushProject(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  flushNow();
}

function flushNow(): void {
  if (NO_PERSIST || !current || !activeId) return;
  try {
    const json = JSON.stringify(current);
    if (json === lastPersistedJson) return;
    if (json.length > MAX_PERSIST_BYTES) {
      console.error(`[projectStore] 工程過大(${(json.length / 1024 / 1024).toFixed(1)}MB)，跳過落盤`);
      return;
    }
    // 單次序列化直寫：json 已在手，不再進 saveProjectRow 做第二次 stringify＋回讀
    if (saveProjectJson(activeId, json, countNotes(current))) lastPersistedJson = json;
  } catch { /* DB 鎖住等：下次再寫，不丟記憶體態 */ }
}

function hookExitFlush(): void {
  if (exitHooked) return;
  exitHooked = true;
  const syncFlush = () => flushNow();
  process.once("exit", syncFlush);
  process.once("SIGINT", () => { syncFlush(); process.exit(0); });
  process.once("SIGTERM", () => { syncFlush(); process.exit(0); });
}
