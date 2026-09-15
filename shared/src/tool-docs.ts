// 模組：工具指令說明書。唯一來源，同時餵給：
// 1. TOOL_SCHEMAS（OpenRouter function calling） 2. MCP registerTool 3. system prompt
// 改一句話三端同步，避免三處各寫一套導致漂移。

export interface ToolDoc {
  title: string;
  /** 模型看的短描述：做什麼 */
  what: string;
  /** 何時用 + 順序 */
  when: string;
  /** 正/反例 */
  example: string;
}

export const TOOL_DOCS: Record<string, ToolDoc> = {
  create_track: {
    title: "建立音軌",
    what: "建立新音軌。kind 限 melody/chords/bass/drums；program 為 GM 0-127（見 gm.ts，鼓可省略）。",
    when: "動工第一步。先有軌再加音。已有同 kind 軌就直接用，不要重複建。",
    example: "正：{name:'Strings', kind:'chords'}；反：一次建 5 條空軌。",
  },
  add_notes: {
    title: "加入音符",
    what: "在指定音軌加音。pitch 0-127（C4=60）；時間一律 beats（4/4 一小節=4）；velocity 1-127；單次<=256音。",
    when: "軌建好後用。旋律只用調內音階音；和弦用 set_chord_progression 別手拼；貝斯跟根音低1-2八度；鼓 pitch 查 DRUM_MAP（36 kick/38 snare/42 hat）。",
    example: "正：C大調旋律 C4 E4 G4 = pitch 60,64,67，startBeat 0,1,2，durBeat 1。反：用秒或 tick 當時間。",
  },
  delete_notes: {
    title: "刪除音符",
    what: "依 note id 刪除。id 從工程摘要拿，不要猜。",
    when: "改錯、清和弦重寫、刪擁擠經過音時用。刪整軌改用 delete_track。",
    example: "正：先讀工程拿 id 再刪；反：編造 id。",
  },
  update_velocities: {
    title: "改力度",
    what: "改指定音符力度 1-127。重拍/高音 95-105，伴奏 65-80，貝斯 85-95。",
    when: "音寫完最後一步做 humanize。全曲同一值是大忌。",
    example: "正：把第1、3拍加到100，弱拍降到75。反：全部設 127。",
  },
  update_tempo: {
    title: "改速度",
    what: "改全曲速度 40-240 BPM。",
    when: "開工時定一次即可。 ballad 60-80，pop 100-124，EDM 124-140。",
    example: "正：{bpm:120}；反：{bpm:999} 會被校驗擋下。",
  },
  update_key: {
    title: "改調性",
    what: "改調性。keyRoot 0-11（C=0）；scale 見 SCALES 表（major/natural_minor/...)。",
    when: "開工第一步，和 tempo 一起定。轉調全曲只轉一次，寫完旋律就別再轉。",
    example: "正：{keyRoot:0, scale:'major'} = C大調；反：keyRoot:12。",
  },
  set_chord_progression: {
    title: "寫和弦進行",
    what: "用羅馬數字寫進行，自動按 keyRoot 展成 notes。一小節一組，startBeat=小節*4，durBeat=4。可選 velocity（預設80）、octave（預設3）。",
    when: "和聲骨架專用，比手拼 add_notes 快且不會錯音。流行 I-V-vi-IV，爵士 ii-V-I，小調 i-VI-III-VII。bars 須等於需求小節數。",
    example: "正：{progression:['I','V','vi','IV'], bars:4}；柔弦樂墊加 velocity:65 octave:4。反： progression:['C','G']（要羅馬數字）。",
  },
  delete_track: {
    title: "刪除音軌",
    what: "整條刪。刪前確認 id，刪了救不回（靠前端 undo，本工具無 undo）。",
    when: "空軌、重複軌、改配器時用。只刪音用 delete_notes。",
    example: "正：刪名為 Demo 的空軌；反：把唯一旋律軌刪了重寫。",
  },
};
