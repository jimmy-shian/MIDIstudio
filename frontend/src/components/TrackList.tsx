import { useProjectStore } from "../store/useProjectStore";
import type { ToolOp } from "@midistudio/shared";
import { btn, btnGhost, card, muted, sectionTitle } from "../styles/theme";
import { MusicIcon, PlusIcon, TrashIcon } from "./icons";

export default function TrackList() {
  const tracks = useProjectStore((s) => s.tracks);
  const selected = useProjectStore((s) => s.selectedTrackId);

  const apply = (ops: ToolOp[]) => useProjectStore.getState().localApply(ops);

  return (
    <div style={{ ...card, width: 220, padding: 12, overflowY: "auto" }}>
      <h4 style={{ ...sectionTitle, marginBottom: 8 }}>音軌</h4>
      {tracks.map((t) => {
        const active = t.id === selected;
        return (
          <div key={t.id}
            onClick={() => useProjectStore.setState({ selectedTrackId: t.id })}
            style={{
              padding: "8px 10px", marginBottom: 6, cursor: "pointer", borderRadius: 6,
              background: active ? "#eff6ff" : "#f9fafb",
              border: `1px solid ${active ? "#2563eb" : "#e5e7eb"}`,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500 }}>
              <MusicIcon size={14} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
            </div>
            <div style={{ ...muted, marginTop: 2 }}>{t.kind} · {t.notes.length} 音</div>
            <div style={{ marginTop: 4 }}>
              <button style={{ ...btnGhost, padding: "2px 4px", fontSize: 12 }}
                onClick={(e) => { e.stopPropagation(); apply([{ op: "delete_track", trackId: t.id }]); }}>
                <TrashIcon size={12} />刪除
              </button>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
        <button style={btn} onClick={() => apply([{ op: "create_track", name: `Melody ${tracks.length + 1}`, kind: "melody" }])}>
          <PlusIcon size={14} />旋律
        </button>
        <button style={btn} onClick={() => apply([{ op: "create_track", name: `Drums ${tracks.length + 1}`, kind: "drums" }])}>
          <PlusIcon size={14} />鼓
        </button>
      </div>
    </div>
  );
}
