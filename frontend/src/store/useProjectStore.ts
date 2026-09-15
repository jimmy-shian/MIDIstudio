import { create } from "zustand";
import type { ProjectState, ToolOp } from "@midistudio/shared";
import { applyOps, emptyProject } from "@midistudio/shared";
import { pushHistory, redoStep, undoStep, type HistorySlice } from "./history";

interface ProjectStore extends ProjectState, HistorySlice {
  isPlaying: boolean;
  /** 最後自動存檔時間戳，無則 null */
  lastSavedAt: number | null;
  /** 目前 SQLite 工程 id/name；null = 尚未連後端（純本地快取模式） */
  currentProjectId: string | null;
  projectName: string;
  setPlaying: (v: boolean) => void;
  loadProject: (p: ProjectState, opts?: { record?: boolean }) => void;
  /** 切工程：載入＋清空歷史（跨工程不混 undo）＋記 id/name */
  switchProject: (p: ProjectState, id: string | null, name: string) => void;
  setProjectName: (name: string) => void;
  localApply: (ops: ToolOp[], opts?: { coalesceKey?: string }) => string[];
  undo: () => boolean;
  redo: () => boolean;
}

// 歷史合併窗口：同一 coalesceKey（如同一軌的力度拖曳）在窗口內只記一條歷史。
// 力度條 pointermove 經 rAF 仍有 60 次/秒寫入，不合併會讓 past 瞬間塞滿 50 步、
// 且每步都是一次快照；合併後整段拖曳只佔一格 undo，記憶體與 undo 體驗雙贏。
const COALESCE_MS = 1500;
let lastHistAt = 0;
let lastHistKey: string | null = null;

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...emptyProject(),
  past: [],
  future: [],
  isPlaying: false,
  lastSavedAt: null,
  currentProjectId: null,
  projectName: "未命名工程",
  setPlaying: (v) => set({ isPlaying: v }),
  loadProject: (p, opts) => {
    const hist = opts?.record === false ? null : pushHistory(get(), get());
    set({ ...p, ...(hist ?? { past: get().past, future: get().future }) });
  },
  switchProject: (p, id, name) => {
    set({ ...p, past: [], future: [], currentProjectId: id, projectName: name });
  },
  setProjectName: (name) => set({ projectName: name }),
  localApply: (ops, opts) => {
    const key = opts?.coalesceKey;
    const now = Date.now();
    let hist: HistorySlice | null = null;
    if (key && key === lastHistKey && now - lastHistAt < COALESCE_MS) {
      // 合併：沿用現有 past（首幀已清過 future，保持清空即可），不新增快照
      const cur = get();
      hist = cur.future.length ? { past: cur.past, future: [] } : null;
    } else {
      hist = pushHistory(get(), get());
    }
    lastHistKey = key ?? null;
    lastHistAt = now;
    const { project, reports } = applyOps(get(), ops);
    set(hist ? { ...project, ...hist } : { ...project });
    return reports.map((r) => r.message);
  },
  undo: () => {
    const r = undoStep(get(), get());
    if (!r) return false;
    set({ ...r.project, ...r.slice });
    return true;
  },
  redo: () => {
    const r = redoStep(get(), get());
    if (!r) return false;
    set({ ...r.project, ...r.slice });
    return true;
  },
}));
