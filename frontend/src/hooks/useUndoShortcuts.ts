import { useEffect } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { stopPlayback } from "../audio/ToneEngine";
import { copyViewNotes, duplicateLastBar, pasteAtView } from "../utils/clipboard";

// 模組：Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y。在輸入框打字時不攔截；復原前先停播避免鬼音。
function isTyping(): boolean {
  const el = document.activeElement;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);
}

export function stopIfPlaying(): void {
  const s = useProjectStore.getState();
  if (s.isPlaying) {
    stopPlayback();
    s.setPlaying(false);
  }
}

export function useUndoShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        if (isTyping()) return;
        e.preventDefault();
        stopIfPlaying();
        useProjectStore.getState().undo();
      } else if (k === "y" || (k === "z" && e.shiftKey)) {
        if (isTyping()) return;
        e.preventDefault();
        stopIfPlaying();
        useProjectStore.getState().redo();
      } else if (k === "c" && !isTyping()) {
        e.preventDefault();
        copyViewNotes();
      } else if (k === "v" && !isTyping()) {
        e.preventDefault();
        pasteAtView();
      } else if (k === "d" && !isTyping()) {
        e.preventDefault();
        duplicateLastBar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
