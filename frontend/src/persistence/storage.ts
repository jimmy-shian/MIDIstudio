import type { ProjectState } from "@midistudio/shared";

// 模組：離線快取。後端 SQLite 為真相；後端沒開時靠這份快取撐住，恢復連線下次存檔即同步。
// SSD 保護：localStorage 是同步磁碟 I/O（瀏覽器 profile 落 SSD），高頻直寫會卡主執行緒又耗抹寫。
// 自動存檔一律走 saveCacheIdle（idle 回調＋合併），boot/beforeunload 等低頻路徑才用同步 saveCache。
const KEY = "midistudio:cache:v2";
// 超過此大小拒寫快取，避免異常工程反覆刷爆 profile（5MB 遠超正常工程）
const MAX_CACHE_BYTES = 5_000_000;

let idlePending: CacheEntry | null = null;
let idleScheduled = false;

function idleNow(fn: () => void): void {
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (typeof ric === "function") ric.call(window, fn, { timeout: 2000 });
  else setTimeout(fn, 0);
}

/** 合併多次呼叫為一次 idle 寫入（自動存檔用） */
export function saveCacheIdle(entry: CacheEntry): void {
  idlePending = entry;
  if (idleScheduled) return;
  idleScheduled = true;
  idleNow(() => {
    idleScheduled = false;
    const e = idlePending;
    idlePending = null;
    if (e) saveCache(e);
  });
}

export interface CacheEntry {
  id: string | null;
  name: string;
  project: ProjectState;
  savedAt: number;
}

export function saveCache(entry: CacheEntry): void {
  try {
    const json = JSON.stringify(entry);
    if (json.length > MAX_CACHE_BYTES) return;
    localStorage.setItem(KEY, json);
  } catch { /* 配額滿/隱私模式：靜默略過 */ }
}

/** 壞檔/舊格式回 null，不讓啟動崩潰 */
export function loadCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return migrateV1();
    const e = JSON.parse(raw) as CacheEntry;
    if (typeof e.project?.bpm !== "number" || !Array.isArray(e.project?.tracks)) return null;
    return e;
  } catch {
    return null;
  }
}

/** 舊版單工程 key 升級 */
function migrateV1(): CacheEntry | null {
  try {
    const raw = localStorage.getItem("midistudio:project:v1");
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p.bpm !== "number" || !Array.isArray(p.tracks)) return null;
    const entry: CacheEntry = { id: null, name: "未命名工程", project: p, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(entry));
    localStorage.removeItem("midistudio:project:v1");
    return entry;
  } catch {
    return null;
  }
}
