import { useEffect, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { createProject, deleteProject, fetchProject, listProjects, type ProjectMeta } from "../api/projectApi";
import { btn, btnGhost, input } from "../styles/theme";
import { PlusIcon, TrashIcon } from "./icons";

// 模組：工程切換（開/新/刪/改名）。列表走後端 SQLite。
export default function ProjectSwitcher() {
  const currentId = useProjectStore((s) => s.currentProjectId);
  const projectName = useProjectStore((s) => s.projectName);
  const [metas, setMetas] = useState<ProjectMeta[]>([]);
  const [nameText, setNameText] = useState(projectName);

  useEffect(() => { setNameText(projectName); }, [projectName]);

  const refresh = async () => {
    try {
      setMetas((await listProjects()).projects);
    } catch { /* 後端沒開：維持空列表 */ }
  };
  useEffect(() => { void refresh(); }, []);

  const st = () => useProjectStore.getState();

  const open = async (id: string) => {
    const full = await fetchProject(id);
    st().switchProject(full.data, full.id, full.name);
    void refresh();
  };

  const create = async () => {
    const row = await createProject(`未命名工程 ${metas.length + 1}`);
    st().switchProject(row.data, row.id, row.name);
    void refresh();
  };

  const remove = async () => {
    if (!currentId || !window.confirm(`刪除「${projectName}」？`)) return;
    await deleteProject(currentId);
    const { projects } = await listProjects();
    if (projects.length) {
      const full = await fetchProject(projects[0].id);
      st().switchProject(full.data, full.id, full.name);
    } else {
      const row = await createProject("未命名工程 1");
      st().switchProject(row.data, row.id, row.name);
    }
    void refresh();
  };

  const commitName = async () => {
    const name = nameText.trim() || "未命名工程";
    st().setProjectName(name);
    void refresh();
  };

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <select value={currentId ?? ""} onChange={(e) => { if (e.target.value) void open(e.target.value); }}
        title="切換工程" style={{ ...input, maxWidth: 180 }}>
        {currentId === null && <option value="">（本地快取）</option>}
        {metas.map((m) => <option key={m.id} value={m.id}>{m.name}（{m.noteCount}音）</option>)}
      </select>
      <input value={nameText} onChange={(e) => setNameText(e.target.value)} onBlur={() => void commitName()}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        style={{ ...input, width: 110 }} title="工程名（改名後自動存）" />
      <button style={btn} onClick={() => void create()} title="新工程"><PlusIcon size={14} />新增</button>
      <button style={btnGhost} onClick={() => void remove()} disabled={!currentId} title="刪除目前工程">
        <TrashIcon size={14} />
      </button>
    </div>
  );
}
