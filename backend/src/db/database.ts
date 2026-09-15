import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// 模組：SQLite 連線。Express 與 MCP stdio 共用同一檔，WAL＋busy_timeout 扛雙行程併寫。
// 檔位 backend/data/midistudio.db（.gitignore 已排除）。
//
// SSD 保護 pragma 說明：
// - synchronous=NORMAL：WAL 模式下把每次 COMMIT 的 fsync 降為低頻，
//   仍保證進程崩潰不丟已 checkpoint 資料，只在「斷電＋WAL 未 checkpoint」極端下丟尾巴；
//   對音樂草稿可接受，換來寫入放大大減。
// - temp_store=MEMORY：排序/暫存表走記憶體，不在磁碟建臨時檔。
// - cache_size=-64000：64MB 頁快取，讀多寫少場景直接降磁碟讀。
// - wal_autocheckpoint=1000：checkpoint 間隔拉大，減少反覆回寫主檔。
// - mmap_size=128MB：讀走 mmap，少一次拷貝＋少 read syscall。

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data");
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

export const dbPath = join(dir, "midistudio.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("temp_store = MEMORY");
  db.pragma("cache_size = -64000");
  db.pragma("wal_autocheckpoint = 1000");
  db.pragma("mmap_size = 134217728");
  db.pragma("busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      note_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages (session_id, id);
  `);
  // 舊庫升級：note_count 欄是後加的；沒有就補欄＋一次性回填（每行程一次，非常駐開銷）
  const cols = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "note_count")) {
    db.exec("ALTER TABLE projects ADD COLUMN note_count INTEGER NOT NULL DEFAULT 0");
    const rows = db.prepare("SELECT id, data FROM projects").all() as { id: string; data: string }[];
    const upd = db.prepare("UPDATE projects SET note_count = ? WHERE id = ?");
    const txn = db.transaction(() => {
      for (const r of rows) upd.run(countNotesInJson(r.data), r.id);
    });
    txn();
  }
  return db;
}

/** 回填專用：壞檔計 0，不讓啟動崩潰 */
function countNotesInJson(json: string): number {
  try {
    const d = JSON.parse(json) as { tracks?: { notes?: unknown[] }[] };
    if (!Array.isArray(d.tracks)) return 0;
    let n = 0;
    for (const t of d.tracks) n += Array.isArray(t.notes) ? t.notes.length : 0;
    return n;
  } catch {
    return 0;
  }
}
