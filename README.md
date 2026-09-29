# MIDIstudio

瀏覽器型 MIDI 編輯器 + 播放 + 自然語言 AI 作曲助理。AI 透過 Tool Calling 直接操作 Track / Note / Tempo / Key，並可即時在 Piano Roll 試聽、匯出 `.mid`。

## 功能

- Piano Roll 編輯：點格加音、點音刪音、力度著色、捲動縮放、snap、復原/重做
- 自然語言作曲：ChatPanel 經 `POST /api/agent` 呼叫 LLM Agent，最多 8 輪，會寫和弦、旋律、低音、調整力度
- 離線可用：無 API Key 時走本地 fallback 規則寫入基本和弦進行
- MIDI 匯入/匯出：`.mid` 解析與產生
- 工程持久化：後端 SQLite 為真相，前端 800ms 防抖自動儲存，斷線退回快取
- MCP 支援：16 tools + 3 resources，外部模型可直接調用同一批工程

## 快速開始

### Windows 一鍵啟動

雙擊 `start.bat`，會自動檢查 Node、安裝依賴、建立 `backend/.env`、啟動雙服務並開啟瀏覽器。停止用 `stop.bat`。

- 前端：<http://localhost:5173>
- 後端健康檢查：<http://localhost:3001/api/health>

### 手動啟動

```bash
npm install
cp backend/.env.example backend/.env
# 在 backend/.env 填入 OPENROUTER_API_KEY（不填則走離線 fallback）

npm run dev
```

底層指令：

```bash
npm run dev --workspace=@midistudio/backend   # :3001
npm run dev --workspace=@midistudio/frontend  # :5173
```

### 建置與型別檢查

```bash
npm run build
npm run typecheck
```

### MCP

```bash
npm run mcp --workspace=@midistudio/backend
```

Host 設定範本見 `mcp.json`，正式用先 `npm run build --workspace=@midistudio/backend` 再指向 `dist/mcp/server.js`。

## 專案結構

```text
frontend/  React + Vite + Zustand + Tone.js，Piano Roll 與播放
shared/    前後端共用唯一真相：型別、8 個 ToolOp、樂理表、校驗、套用
backend/   Express + OpenRouter Agent Loop + SQLite + MCP + MIDI 編解碼
```

三層完整說明見 [ARCHITECTURE.md](./ARCHITECTURE.md)。

作曲助理模組拆分見 [backend/src/llm/ARCHITECTURE.md](./backend/src/llm/ARCHITECTURE.md)：

- `composerGuidelines/`：作品構思與寫作原則
- `compositionEngine/`：計畫轉合法工程操作
- `musicCritic/`：成品檢查與修改方向
- `musicKnowledge.md`：MIDI 與樂理事實來源

UI 品牌契約見 [DESIGN.md](./DESIGN.md)，授權與參考紅線見 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)，本專案原創碼採 MIT（見 [LICENSE](./LICENSE)）。

## 參考 / 啟發來源

> 以下為本專案前期的調研筆記，原出自 `readme.txt`，內容完整保留，僅重排為正確 Markdown 以利網頁渲染。這些專案僅為概念參考，本 repo `frontend/ shared/ backend/` 為原創程式碼，未複製其原始碼。

| 專案 | 類型 | AI 能力 | 技術 / 特點 | 適合參考的部分 |
| --- | --- | --- | --- | --- |
| **K.G.Studio** | Web DAW / MIDI Editor | ✅ LLM 可直接新增、修改 MIDI notes、track、tempo 等 | TypeScript、瀏覽器執行、Tone.js、Piano Roll | **最接近想做的 MIDI AI**，非常適合直接研究 AI tool calling 架構 |
| **MidiEditor AI** | Desktop MIDI Editor | ✅ 內建 MidiPilot，可自然語言編曲、修改 MIDI | 傳統 MIDI Editor + AI Copilot + MCP | 適合研究 **AI Agent、MCP、MIDI 工具設計** |
| **OpenDaw** | 完整 DAW | ✅ Claude AI Assistant，可建立 MIDI clip、notes、track、效果等 | C++、Qt 6、Tracktion Engine / JUCE | 適合想往 **完整 AI DAW** 發展，但程式較複雜 |
| **ComposeYogi** | Web DAW | ❌ 目前不是以 AI 為核心 | Next.js、TypeScript、Tone.js、Zustand，MIT | 很適合當自己開發 MIDI AI 的 **乾淨 Web DAW 基底** |
| **Boundless MIDI Editor** | Web MIDI Editor | ⚠️ AI 主要是 Audio→MIDI，不是 LLM Agent | React、TypeScript、Tone.js、FastAPI、Basic Pitch | 適合研究 **Piano Roll、MIDI 播放、Audio→MIDI** |

### 1. K.G.Studio ⭐ 最值得先看

瀏覽器型 DAW，作者本身的定位就是類似 **「Cursor / Claude Code for DAW」**。AI 不是單純聊天，而是可以直接透過工具操作 Track、Region、MIDI Note，並立即播放。

[K.G.Studio GitHub](https://github.com/KGAudioLab/K.G.Studio)

**可以抄的概念：**

```text
自然語言
   ↓
LLM Agent
   ↓
Tool Calling
   ↓
Add / Edit MIDI Notes
   ↓
Piano Roll
   ↓
Playback
```

如果只先研究一個，會先看這個。

---

### 2. MidiEditor AI

這也是非常直接的 **AI MIDI Editor**。

內建 **MidiPilot AI Copilot**，可以用自然語言進行 MIDI composition、arrangement、analysis 和 editing；它是在既有 MidiEditor 基礎上加入完整 AI Agent。

[MidiEditor AI GitHub](https://github.com/happytunesai/MidiEditor_AI)

尤其值得研究：

- MIDI Tool Calling
- Agent loop
- Project context
- MCP
- 外部 LLM 操作 MIDI Editor

如果想做：

> ChatGPT / Claude → 直接控制 MIDI Editor

它的架構非常值得看。

---

### 3. OpenDaw

這已經不只是 MIDI Editor，而是完整 **Digital Audio Workstation**。

包含：

- MIDI Piano Roll
- Audio tracks
- VST3
- Effects
- Mixer / Routing
- Automation
- AI Assistant
- AI 建立 MIDI clip / notes

AI 是透過 agentic tool use 操作整個 DAW，目前提供約 30 類操作工具。

[OpenDaw GitHub](https://github.com/glenwrhodes/OpenDaw)

技術：

```text
C++
Qt 6
Tracktion Engine
JUCE
```

比較適合未來真的想做：

> **AI Ableton / AI Cubase**

但如果只是 MIDI AI，第一版不建議從這套開始，工程量太大。

---

### 4. ComposeYogi

一套很乾淨的 Web DAW，目前 AI 不是核心，但本身 MIDI 基礎功能已經不少：

- Multi-track
- Piano Roll
- Drum Sequencer
- Tone.js
- MIDI Export
- Mixer
- Built-in Synth
- Zustand
- Undo/Redo

而且是 **MIT License**。

[ComposeYogi GitHub](https://github.com/AppsYogi-com/ComposeYogi)

技術棧：

```text
Next.js
TypeScript
Tone.js
Zustand
Tailwind
IndexedDB
```

如果想法是：

> 「我想自己實作 AI，不想直接改別人的 AI 系統。」

那反而很推薦拿 **ComposeYogi 當 MIDI/DAW UI base，再自己加 OpenRouter Agent**。

---

### 5. Boundless MIDI Editor

比較單純、比較小型的 Web MIDI Editor。

已有：

- Piano Roll
- MIDI Import / Export
- Playback
- Undo / Redo
- Tone.js
- Audio → MIDI
- Hum / Voice → MIDI

Audio → MIDI 使用 Basic Pitch / pYIN。

[Boundless MIDI Editor GitHub](https://github.com/Boundless12/midi-editor)

技術：

```text
React
TypeScript
Vite
Zustand
Tone.js

Python
FastAPI
Basic Pitch
pretty_midi
```

這個專案規模相對小，所以其實**很適合拿來看 Piano Roll 怎麼實作**。

---

## 如果以目標排序

要自己做 **「MIDI Editor + 播放 + OpenRouter AI 直接製作/修改 MIDI」**，會依序看：

**① K.G.Studio → ② MidiEditor AI → ③ ComposeYogi → ④ Boundless → ⑤ OpenDaw**

其中：

- **K.G.Studio**：看整體 AI MIDI interaction
- **MidiEditor AI**：看 Agent / MCP / Tool architecture
- **ComposeYogi**：看 Web DAW/MIDI editor 本體
- **Boundless**：看簡潔的 Piano Roll + MIDI + Audio→MIDI
- **OpenDaw**：看真正完整 DAW 的 AI 架構

如果目標是**自己重新實作，而不是 fork 後直接改**，最值得混合參考的是：

> **ComposeYogi 的 Web 編輯器架構 + K.G.Studio 的 AI Agent 設計 + MidiEditor AI 的 Tool/MCP 思路。**

參考連結：

- [K.G.Studio](https://github.com/KGAudioLab/K.G.Studio)：瀏覽器 DAW + LLM Agent 直接編輯 MIDI
- [MidiEditor AI](https://github.com/happytunesai/MidiEditor_AI)：MidiPilot AI copilot，自然語言編曲與 MCP
- [OpenDaw](https://github.com/glenwrhodes/OpenDaw)：完整開源 DAW + Claude AI assistant
- [ComposeYogi](https://github.com/AppsYogi-com/ComposeYogi)：開源 Web 作曲工具，MIT
- [Boundless MIDI Editor](https://github.com/Boundless12/midi-editor)：輕量 MIDI 編輯器 + Audio→MIDI
