# Skill: MIDI 作曲 Guideline Book

## 用途

在 MIDIstudio 裡創作、續寫或修改音樂時，將創作需求轉成有表達目標、整體發展與核心素材的作品。這是專案內的作曲工作指引；`index.ts` 提供模型執行時摘要，`GUIDELINE_BOOK.md` 是完整規格。

## 必讀資料

- `GUIDELINE_BOOK.md`：創作原則、完整流程和決策優先序。
- `../musicKnowledge.ts`：MIDI、音階、和弦、節奏、音色及工具文件資料。
- `../compositionEngine/ENGINE.md`：把音樂計畫落實成工程操作。
- `../musicCritic/CRITIC_CHECKLIST.md`：品質檢查與修改流程。

## 執行方式

先寫出一句意圖與一個簡短的全曲計畫，再依「核心素材—重複變化—張力釋放—編曲—演奏化」完成。尊重使用者指定的長度和修改範圍。完成後套用 Critic 檢查；若需修改，修完再檢查，沒有重大問題即停止。

## 維護規則

新增或調整作曲原則時，先更新 `GUIDELINE_BOOK.md`，再更新 `index.ts` 的模型摘要。工程操作規則放在 compositionEngine，品質檢查標準放在 musicCritic，樂理事實放在 musicKnowledge；避免跨模組複製同一份規則。
