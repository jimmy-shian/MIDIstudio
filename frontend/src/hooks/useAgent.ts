import { useRef, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { selectProjectSnapshot } from "../store/selectors";
import { clearSession, sendToAgent } from "../api/agentClient";

// 模組：AI 對話邏輯。sessionId 常駐同一個 ref：同會話模型記得上文；新對話才換。
export function useAgent() {
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef<string | null>(null);

  const send = async (input: string): Promise<{ reply: string; reports: string[] }> => {
    setBusy(true);
    try {
      const s = useProjectStore.getState();
      const project = selectProjectSnapshot(s);
      const res = await sendToAgent(input, project, sessionRef.current);
      sessionRef.current = res.sessionId;
      useProjectStore.getState().loadProject(res.project);
      return { reply: res.reply, reports: res.reports };
    } finally {
      setBusy(false);
    }
  };

  const newConversation = async (): Promise<void> => {
    if (sessionRef.current) {
      try {
        await clearSession(sessionRef.current);
      } catch { /* 後端沒開也照樣開新會話 */ }
    }
    sessionRef.current = null;
  };

  return { busy, send, newConversation };
}
