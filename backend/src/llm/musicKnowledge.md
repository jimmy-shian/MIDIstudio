# Music Knowledge

## 職責

本模組回答「音樂與 MIDI 工程使用哪些事實和詞彙」。它提供可查的理論、數字、音色和工具資料，不決定一首作品應如何發展。創作決策見 `../composerGuidelines/GUIDELINE_BOOK.md`；工具操作見 `../compositionEngine/ENGINE.md`。

## 單一事實來源

`musicKnowledge.ts` 將 `@midistudio/shared` 的音階、和弦、進行、功能、終止、曲式、節奏、力度及工具說明格式化，並供 system prompt 與 MCP resource 共用。新增或修正數值表時，優先改 shared 套件的資料來源；不要在 prompt 或文件手寫另一份可能過期的表。

## 涵蓋範圍

- MIDI pitch、C4 對應、velocity、beats、tempo 及聲部基本慣例。
- 音階與和弦音程表、調內級數。
- 和弦進行、和聲功能、接續提示、終止與曲式。
- GM 音色、鼓音符、常用節奏與力度參考。
- DAW 工具用途、使用時機與範例。

樂理選擇仍需服從作品意圖與使用者指定；表格是可用語彙，不是每首作品都必須套用的規則。
