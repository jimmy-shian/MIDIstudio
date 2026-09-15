// 模組：@tonejs/midi 載入。該包是 UMD，具名匯出在執行期才掛上 module.exports，
// ESM `import { Midi }` 會在 link 期炸掉。這裡統一走 namespace interop，全後端只從這裡拿。
import * as MidiModule from "@tonejs/midi";

const MidiCtor: typeof MidiModule.Midi =
  ((MidiModule as any).Midi ?? (MidiModule as any).default?.Midi);

if (!MidiCtor) throw new Error("@tonejs/midi 載入失敗：找不到 Midi 建構子");

export const Midi = MidiCtor;
