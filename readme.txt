可以，簡單整理成這樣比較清楚：

| 專案                        | 類型                    | AI 能力                                               | 技術 / 特點                                      | 適合你參考的部分                                        |
| ------------------------- | --------------------- | --------------------------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| **K.G.Studio**            | Web DAW / MIDI Editor | ✅ LLM 可直接新增、修改 MIDI notes、track、tempo 等             | TypeScript、瀏覽器執行、Tone.js、Piano Roll          | **最接近你想做的 MIDI AI**，非常適合直接研究 AI tool calling 架構 |
| **MidiEditor AI**         | Desktop MIDI Editor   | ✅ 內建 MidiPilot，可自然語言編曲、修改 MIDI                      | 傳統 MIDI Editor + AI Copilot + MCP            | 適合研究 **AI Agent、MCP、MIDI 工具設計**                 |
| **OpenDaw**               | 完整 DAW                | ✅ Claude AI Assistant，可建立 MIDI clip、notes、track、效果等 | C++、Qt 6、Tracktion Engine / JUCE             | 適合想往 **完整 AI DAW** 發展，但程式較複雜                    |
| **ComposeYogi**           | Web DAW               | ❌ 目前不是以 AI 為核心                                      | Next.js、TypeScript、Tone.js、Zustand，MIT       | 很適合當你自己開發 MIDI AI 的 **乾淨 Web DAW 基底**           |
| **Boundless MIDI Editor** | Web MIDI Editor       | ⚠️ AI 主要是 Audio→MIDI，不是 LLM Agent                   | React、TypeScript、Tone.js、FastAPI、Basic Pitch | 適合研究 **Piano Roll、MIDI 播放、Audio→MIDI**          |

### 1. K.G.Studio ⭐ 最值得先看

瀏覽器型 DAW，作者本身的定位就是類似 **「Cursor / Claude Code for DAW」**。AI 不是單純聊天，而是可以直接透過工具操作 Track、Region、MIDI Note，並立即播放。([GitHub][1])

[K.G.Studio GitHub](https://github.com/KGAudioLab/K.G.Studio?utm_source=chatgpt.com)

**你可以抄的概念：**

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

如果你只先研究一個，我會先看這個。

---

### 2. MidiEditor AI

這也是非常直接的 **AI MIDI Editor**。

內建 **MidiPilot AI Copilot**，可以用自然語言進行 MIDI composition、arrangement、analysis 和 editing；它是在既有 MidiEditor 基礎上加入完整 AI Agent。([GitHub][2])

[MidiEditor AI GitHub](https://github.com/happytunesai/MidiEditor_AI?utm_source=chatgpt.com)

尤其值得研究：

* MIDI Tool Calling
* Agent loop
* Project context
* MCP
* 外部 LLM 操作 MIDI Editor

如果你想做：

> ChatGPT / Claude → 直接控制 MIDI Editor

它的架構非常值得看。

---

### 3. OpenDaw

這已經不只是 MIDI Editor，而是完整 **Digital Audio Workstation**。

包含：

* MIDI Piano Roll
* Audio tracks
* VST3
* Effects
* Mixer / Routing
* Automation
* AI Assistant
* AI 建立 MIDI clip / notes

AI 是透過 agentic tool use 操作整個 DAW，目前提供約 30 類操作工具。([GitHub][3])

[OpenDaw GitHub](https://github.com/glenwrhodes/OpenDaw?utm_source=chatgpt.com)

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

* Multi-track
* Piano Roll
* Drum Sequencer
* Tone.js
* MIDI Export
* Mixer
* Built-in Synth
* Zustand
* Undo/Redo

而且是 **MIT License**。([GitHub][4])

[ComposeYogi GitHub](https://github.com/AppsYogi-com/ComposeYogi?utm_source=chatgpt.com)

技術棧：

```text
Next.js
TypeScript
Tone.js
Zustand
Tailwind
IndexedDB
```

如果你的想法是：

> 「我想自己實作 AI，不想直接改別人的 AI 系統。」

那我反而很推薦拿 **ComposeYogi 當 MIDI/DAW UI base，再自己加 OpenRouter Agent**。

---

### 5. Boundless MIDI Editor

比較單純、比較小型的 Web MIDI Editor。

已有：

* Piano Roll
* MIDI Import / Export
* Playback
* Undo / Redo
* Tone.js
* Audio → MIDI
* Hum / Voice → MIDI

Audio → MIDI 使用 Basic Pitch / pYIN。([GitHub][5])

[Boundless MIDI Editor GitHub](https://github.com/Boundless12/midi-editor?utm_source=chatgpt.com)

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

## 如果以你的目標排序

你要自己做 **「MIDI Editor + 播放 + OpenRouter AI 直接製作/修改 MIDI」**，我會依序看：

**① K.G.Studio → ② MidiEditor AI → ③ ComposeYogi → ④ Boundless → ⑤ OpenDaw**

其中：

* **K.G.Studio**：看整體 AI MIDI interaction
* **MidiEditor AI**：看 Agent / MCP / Tool architecture
* **ComposeYogi**：看 Web DAW/MIDI editor 本體
* **Boundless**：看簡潔的 Piano Roll + MIDI + Audio→MIDI
* **OpenDaw**：看真正完整 DAW 的 AI 架構

如果目標是**自己重新實作，而不是 fork 後直接改**，我認為最值得混合參考的是：

> **ComposeYogi 的 Web 編輯器架構 + K.G.Studio 的 AI Agent 設計 + MidiEditor AI 的 Tool/MCP 思路。**

[1]: https://github.com/KGAudioLab/K.G.Studio?utm_source=chatgpt.com "GitHub - KGAudioLab/K.G.Studio: K.G.Studio is a lightweight, browser‑based DAW with an LLM‑powered AI Agent \"K.G.Studio Musician Assistant\" for AI‑assisted composition and MIDI editing. · GitHub"
[2]: https://github.com/happytunesai/MidiEditor_AI?utm_source=chatgpt.com "GitHub - happytunesai/MidiEditor_AI: AI-powered MIDI editor - compose and edit MIDI with natural language via the built-in MidiPilot AI copilot. · GitHub"
[3]: https://github.com/glenwrhodes/OpenDaw?utm_source=chatgpt.com "GitHub - glenwrhodes/OpenDaw: OpenDaw — a free, open-source Digital Audio Workstation for Windows. Qt 6 UI, Tracktion Engine audio, MIDI piano roll, VST3 instruments, built-in effects, Claude AI assistant. · GitHub"
[4]: https://github.com/AppsYogi-com/ComposeYogi?utm_source=chatgpt.com "GitHub - AppsYogi-com/ComposeYogi: The open-source Ableton-style music composer for the web. · GitHub"
[5]: https://github.com/Boundless12/midi-editor?utm_source=chatgpt.com "GitHub - Boundless12/midi-editor: a midi editor, which can convert audio, like instruments and vocals, into midi. Can also edit midi in piano roll · GitHub"
