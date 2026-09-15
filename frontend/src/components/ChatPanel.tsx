import { useState } from "react";
import { useAgent } from "../hooks/useAgent";
import { cleanupSessions, listSessions } from "../api/agentClient";
import { btn, btnGhost, btnPrimary, card, colors, input, muted, sectionTitle } from "../styles/theme";
import { PlusIcon, TrashIcon } from "./icons";

// 對話記錄上限：避免長時間會話無限增長吃掉記憶體，保留最近 200 條
const MAX_LOG = 200;
function appendLog(prev: string[], lines: string[]): string[] {
  const next = [...prev, ...lines];
  return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next;
}

function bubbleStyle(mine: boolean): React.CSSProperties {
  return {
    marginBottom: 6,
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: "20px",
    background: mine ? colors.subtle : "#eff6ff",
    border: `1px solid ${mine ? colors.border : "#bfdbfe"}`,
    color: colors.text,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };
}

function renderLine(l: string, i: number) {
  if (l.startsWith("你: ")) return <div key={i} style={bubbleStyle(true)}>{l.slice(3)}</div>;
  if (l.startsWith("AI: ")) return <div key={i} style={bubbleStyle(false)}>{l.slice(4)}</div>;
  return <div key={i} style={{ ...muted, marginBottom: 4 }}>{l}</div>;
}

export default function ChatPanel() {
  const [inputText, setInputText] = useState("C大調 I-V-vi-IV，8小節，旋律用五聲音階");
  const [log, setLog] = useState<string[]>(["AI 就緒。試著輸入：120BPM 悲傷小調，4小節低音+和弦"]);
  const { busy, send, newConversation } = useAgent();

  const onSend = async () => {
    const text = inputText;
    try {
      const { reply, reports } = await send(text);
      setLog((l) => appendLog(l, [`你: ${text}`, `AI: ${reply}`, ...reports.map((r) => `✔ ${r}`)]));
    } catch (e: any) {
      setLog((l) => appendLog(l, [`✘ 失敗: ${e.message}`]));
    }
  };

  const onNew = async () => {
    await newConversation();
    setLog((l) => appendLog(l, ["—— 已開新對話，模型忘掉上文 ——"]));
  };

  const onCleanup = async () => {
    try {
      const sessions = await listSessions().catch(() => [] as { sessionId: string; turns: number }[]);
      if (!sessions.length) {
        setLog((l) => appendLog(l, ["—— 沒有舊對話可清 ——"]));
        return;
      }
      if (!window.confirm(`清掉 30 天沒碰的對話？目前共 ${sessions.length} 段。`)) return;
      const r = await cleanupSessions(30);
      setLog((l) => appendLog(l, [`—— 已清 ${r.deletedSessions} 段、${r.deletedMessages} 條 ——`]));
    } catch (e: any) {
      setLog((l) => appendLog(l, [`✘ 清理失敗: ${e.message}`]));
    }
  };

  return (
    <div style={{ ...card, width: 340, padding: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h4 style={sectionTitle}>AI 作曲助理</h4>
        <div style={{ display: "flex", gap: 4 }}>
          <button style={btnGhost} onClick={() => void onNew()} disabled={busy} title="忘掉上文，重新開始">
            <PlusIcon size={14} />新對話
          </button>
          <button style={btnGhost} onClick={() => void onCleanup()} disabled={busy} title="清掉 30 天沒碰的舊對話">
            <TrashIcon size={14} />清舊
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 200 }}>
        {log.map(renderLine)}
      </div>
      <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} rows={3}
        style={{ ...input, marginTop: 8, resize: "vertical" }} />
      <button style={{ ...btnPrimary, marginTop: 8, justifyContent: "center" }} onClick={onSend} disabled={busy}>
        {busy ? "生成中…" : "送出給 AI"}
      </button>
    </div>
  );
}
