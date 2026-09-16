import { useEffect, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { createProject, deleteProject, fetchProject, listProjects, type ProjectMeta } from "../api/projectApi";
import controls from "../styles/controls.module.css";
import styles from "./ProjectSwitcher.module.css";
import Dropdown from "./Dropdown";
import { PlusIcon, TrashIcon } from "./icons";

// 模組：工程切換（開/新/刪/改名）。工程選單走共用 Dropdown，列表走後端 SQLite。
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

  const options = metas.map((m) => ({ value: m.id, label: `${m.name}（${m.noteCount}音）` }));

  return (
    <div className={styles.wrap}>
      <span className={styles.menu}>
        <Dropdown
          value={currentId ?? ""}
          options={options}
          onChange={(v) => { if (v) void open(v); }}
          label="切換工程"
          placeholder="（本地快取）"
          compact
        />
      </span>
      <input value={nameText} onChange={(e) => setNameText(e.target.value)} onBlur={() => void commitName()}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className={`${controls.input} ${styles.nameInput}`} title="工程名（改名後自動存）" />
      <button className={controls.btn} onClick={() => void create()} title="新工程"><PlusIcon size={14} />新增</button>
      <button className={controls.btnGhost} onClick={() => void remove()} disabled={!currentId} title="刪除目前工程">
        <TrashIcon size={14} />
      </button>
    </div>
  );
}
