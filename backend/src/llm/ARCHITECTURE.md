# 作曲助理架構

MIDIstudio 作曲助理將五種責任分開，讓樂理資料、音樂判斷、工程操作與品質檢查不再混成一份 `systemPrompt.ts`。

| 元件 | 回答的問題 | 主要規格 | 執行時入口 |
| --- | --- | --- | --- |
| `musicKnowledge.ts` | 音樂/MIDI 的事實是什麼？ | `musicKnowledge.md` | `musicKnowledge.ts` |
| `composerGuidelines/` | 作品要怎麼構思與寫作？ | `composerGuidelines/GUIDELINE_BOOK.md` | `composerGuidelines/index.ts` |
| `compositionEngine/` | 計畫如何轉成合法工程操作？ | `compositionEngine/ENGINE.md` | `compositionEngine/index.ts` 與 `agentLoop.ts` |
| `musicCritic/` | 作品是否有效，該修改什麼？ | `musicCritic/CRITIC_CHECKLIST.md` | `musicCritic/index.ts` |
| `systemPrompt.ts` | 如何把最必要的上下文組成模型指令？ | 本文件及各模組規格 | `SYSTEM_PROMPT` |

## 一次請求的資料流

1. `agentLoop.ts` 收集對話歷史、需求與目前工程。
2. `SYSTEM_PROMPT` 注入 Guideline Book、Engine、Critic 的精簡執行摘要，以及樂理和工具知識。
3. 模型按「意圖 → 發展 → 素材 → 變化 → 張力/釋放 → 編曲 → 演奏化」作決策；Engine 將決策映射成工具操作。
4. Engine 的 `executeCompositionOps` 呼叫 schema/`validateOps` 驗證；成功操作才更新工程，錯誤則回饋模型修正。
5. 每批成功操作後，Critic 產生檢查指令，要求模型依更新後作品檢查；前 7 次模型呼叫可修改，第 8 次強制禁用工具作最終檢查/摘要。若模型提早判斷需求滿足就立即停止。離線 fallback 不執行生成式 Critic。

## 規格維護

Markdown 是人類可讀的完整規格，TypeScript `index.ts` 是有限上下文下提供模型的執行摘要。Engine 的 `executeCompositionOps` 負責硬驗證與套用；Critic 的 `buildCriticReviewInstruction` 將品質檢查帶回 agent 迴圈，由模型評估音樂表達。改動流程時，先更新完整規格，再同步執行摘要，最後調整 `systemPrompt.ts` 或迴圈。工程硬限制由程式驗證；審美判斷由模型按清單檢查，不是確定性音樂分析器。
