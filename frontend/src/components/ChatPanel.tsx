import { useState } from "react";
import { useAgent } from "../hooks/useAgent";
import { cleanupSessions, listSessions } from "../api/agentClient";
import controls from "../styles/controls.module.css";
import styles from "./ChatPanel.module.css";
import { PlusIcon, TrashIcon } from "./icons";

// 對話記錄上限：避免長時間會話無限增長吃掉記憶體，保留最近 200 條
const MAX_LOG = 200;
function appendLog(prev: string[], lines: string[]): string[] {
  const next = [...prev, ...lines];
  return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next;
}

function renderLine(l: string, i: number) {
  if (l.startsWith("你: ")) return <div key={i} className={styles.bubbleMine}>{l.slice(3)}</div>;
  if (l.startsWith("AI: ")) return <div key={i} className={styles.bubbleAi}>{l.slice(4)}</div>;
  return <div key={i} className={styles.sysLine}>{l}</div>;
}

export default function ChatPanel() {
  const [inputText, setInputText] = useState("C大調 I-V-vi-IV，8小節，旋律用五聲音階");
  const [log, setLog] = useState<string[]>(["AI 就緒。試著輸入：120BPM 悲傷小調，4小節低音+和弦"]);
  const { busy, send, newConversation } = useAgent();

  const onSend = async () => {
    const text = inputText.trim();
    if (!text || busy) return;
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
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4 className={controls.sectionTitle}>AI 作曲助理</h4>
        <div className={styles.actions}>
          <button className={controls.btnGhost} onClick={() => void onNew()} disabled={busy} title="忘掉上文，重新開始">
            <PlusIcon size={14} />新對話
          </button>
          <button className={controls.btnGhost} onClick={() => void onCleanup()} disabled={busy} title="清掉 30 天沒碰的舊對話">
            <TrashIcon size={14} />清舊
          </button>
        </div>
      </div>
      <div className={styles.log}>
        {log.map(renderLine)}
      </div>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => {
          // Enter 送出、Shift+Enter 換行（輸入框 typing 時 undo 快捷鍵已禮讓）
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void onSend();
          }
        }}
        rows={2}
        placeholder="描述想要的音樂…（Enter 送出，Shift+Enter 換行）"
        aria-label="和 AI 的對話輸入框"
        className={styles.input}
      />
      <div className={styles.hint}>Enter 送出 · Shift+Enter 換行</div>
      <button className={styles.send} onClick={onSend} disabled={busy}>
        {busy ? "生成中…" : "送出給 AI"}
      </button>
    </div>
  );
}
