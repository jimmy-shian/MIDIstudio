import { useEffect, useRef } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { snapshotOf } from "../store/history";
import { loadCache, saveCache, saveCacheIdle } from "../persistence/storage";
import { createProject, fetchProject, listProjects, saveProject } from "../api/projectApi";

// 模組：啟動載入＋防抖自動存。真相在後端 SQLite；後端沒開退回本地快取。
//
// SSD/記憶體保護：
// - 訂閱只比「指紋」（純量＋引用比較，零配置）：isPlaying/lastSavedAt 等 UI 態變化
//   直接略過；舊寫法每次 set 都全工程 snapshotOf＋JSON.stringify，只為發現沒變。
// - 真正的序列化只在防抖到期後做一次（拖曳 60fps → 每 2.5s 最多 1 次）。
// - localStorage 走 idle 回調寫，不擋主執行緒；內容無變跳過。
// - 自動存檔間隔 800ms → 2500ms（MCP_PERSIST…是後端那側，這裡是前端）。
const AUTOSAVE_MS = 2500;

export function usePersistence() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void boot();

    let timer: ReturnType<typeof setTimeout> | undefined;
    let dirty = false;
    let lastSavedJson = "";
    // 指紋：引用比較即可。applyOps 是 copy-on-write，未動的 tracks 引用不變；
    // 動過的必換引用，所以引用變化 ⟺ 工程變化，無需序列化即可判斷。
    let lastFp = fingerprint(useProjectStore.getState());

    const flush = () => {
      timer = undefined;
      if (!dirty) return;
      dirty = false;
      const st = useProjectStore.getState();
      lastFp = fingerprint(st);
      const snap = snapshotOf(st);
      const json = JSON.stringify({ i: st.currentProjectId, n: st.projectName, p: snap });
      if (json === lastSavedJson) return;
      lastSavedJson = json;
      saveCacheIdle({ id: st.currentProjectId, name: st.projectName, project: snap, savedAt: Date.now() });
      if (st.currentProjectId) {
        saveProject(st.currentProjectId, snap, st.projectName).catch(() => { /* 離線：快取已排入，下次再同步 */ });
      }
      // lastSavedAt 不在指紋內，此 set 不會重新觸發存檔判斷
      useProjectStore.setState({ lastSavedAt: Date.now() });
    };

    const unsub = useProjectStore.subscribe((s) => {
      const fp = fingerprint(s);
      if (fpSame(fp, lastFp)) return;
      lastFp = fp;
      dirty = true;
      clearTimeout(timer);
      timer = setTimeout(flush, AUTOSAVE_MS);
    });
    const onUnload = () => {
      // 關閉分頁前盡量落盤：同步寫快取（低頻，可接受）
      try {
        const st = useProjectStore.getState();
        saveCache({ id: st.currentProjectId, name: st.projectName, project: snapshotOf(st), savedAt: Date.now() });
      } catch { /* 略過 */ }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", onUnload);
      unsub();
    };
  }, []);
}

type Fp = [number, number, string, number, number, unknown, string, string | null];

function fingerprint(s: {
  bpm: number; keyRoot: number; scale: string; timeSig: [number, number];
  tracks: unknown; projectName: string; currentProjectId: string | null;
}): Fp {
  return [s.bpm, s.keyRoot, s.scale, s.timeSig[0], s.timeSig[1], s.tracks, s.projectName, s.currentProjectId];
}

function fpSame(a: Fp, b: Fp): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
    && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7];
}

async function boot(): Promise<void> {
  const st = useProjectStore.getState();
  try {
    const { projects } = await listProjects();
    if (projects.length) {
      const full = await fetchProject(projects[0].id);
      st.switchProject(full.data, full.id, full.name);
      saveCache({ id: full.id, name: full.name, project: full.data, savedAt: Date.now() });
      return;
    }
    const created = await createProject("未命名工程 1");
    st.switchProject(created.data, created.id, created.name);
    saveCache({ id: created.id, name: created.name, project: created.data, savedAt: Date.now() });
  } catch {
    const cache = loadCache();
    if (cache) st.switchProject(cache.project, cache.id, cache.name);
  }
}
