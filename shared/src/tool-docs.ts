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
  create_composition: {
    title: "宏觀風格作曲",
    what: "以結構化 MusicSpec 一鍵生成多軌（旋律/和弦/貝斯/鼓組）完整作品，全自動精準對齊拍號與樂理。",
    when: "需要全新創作一段完整樂曲時優先使用，避免逐一手動加入零散音符。",
    example: "正：{spec:{genre:'pop',tempo:120,timeSignature:[4,4],keyRoot:0,scale:'major',sections:[{name:'Verse',bars:4,progression:['I','V','vi','IV']}]}}",
  },
  update_time_signature: {
    title: "設定拍號",
    what: "設定全曲拍號（分子 1-32，分母 2/4/8/16）。支援 4/4、3/4、6/8、2/4、5/4 等。",
    when: "創作非 4/4 拍（如 3/4 華爾滋、6/8 搖滾）開工第一步呼叫。",
    example: "正：{numerator:3, denominator:4}（三拍子華爾滋）；{numerator:6, denominator:8}（六八拍抒情）。",
  },
  set_chord_progression: {
    title: "寫和弦進行",
    what: "用羅馬數字寫進行，自動依目前拍號與小節長度精確展開和弦音符。支援大調與小調（i, iv, v, VI, VII, V7）。",
    when: "和聲骨架專用。大調流行 I-V-vi-IV，小調 i-VI-III-VII，爵士 ii-V-I 或 ii°-V7-i。bars 須等於需求小節數。",
    example: "正：{progression:['i','VI','III','VII'], bars:4}（小調進行）；柔弦樂墊加 velocity:65 octave:4。",
  },
  generate_drum_pattern: {
    title: "編鼓組",
    what: "依指定風格（four_on_floor/boom_bap/waltz_34/ballad_68）寫套鼓編曲：底鼓定脈動、小鼓打 backbeat（2、4 拍）、踩鈸鋪律動。",
    when: "樂曲需要鼓組時使用。按鼓手分工寫 groove（Kick 定拍、Snare 打重拍、Hat 維持流動），段落銜接可加 fill；免去手工輸入數十個鼓音符。",
    example: "正：{pattern:'four_on_floor', bars:4}（四拍底鼓＋2、4 拍小鼓）；3/4 拍用 {pattern:'waltz_34', bars:4}。",
  },
  create_section: {
    title: "建立曲式段落",
    what: "在時間軸上標記段落（如 Intro, Verse, Chorus, Outro）。",
    when: "規劃完整多段落結構時使用。",
    example: "正：{name:'Chorus', bars:8}。",
  },
  create_track: {
    title: "建立音軌",
    what: "建立新音軌。kind 限 melody/chords/bass/drums；program 為 GM 0-127（鼓軌自動分配 Channel 10）。",
    when: "動工前或需要新增額外樂器聲部時使用。已有同類型音軌可直接沿用。",
    example: "正：{name:'Strings', kind:'chords', program:48}。",
  },
  delete_track: {
    title: "刪除音軌",
    what: "刪除指定音軌及其所有音符。",
    when: "改配器或清空重複軌道時使用。",
    example: "正：{trackId:'t-extra'}。",
  },
  add_notes: {
    title: "加入音符",
    what: "在指定音軌精確加音。pitch 0-127 (C4=60)；支援 startBeat 浮點拍或 startTick 整數刻度；velocity 1-127。",
    when: "微調主旋律、個性化裝飾音或局部補音時使用。",
    example: "正：{trackId:'t-melody', notes:[{pitch:60, startBeat:0, durBeat:1, velocity:90}]}",
  },
  delete_notes: {
    title: "刪除音符",
    what: "依 note id 刪除特定音符。",
    when: "修復局部錯音或刪除擁擠經過音時使用。",
    example: "正：{trackId:'t-melody', noteIds:['n-123']}",
  },
  clear_region: {
    title: "清空區域音符",
    what: "清空指定音軌在特定拍數或時間範圍內的音符；省略範圍則清空整軌。",
    when: "重新編寫副歌旋律或換掉某段伴奏時使用，免手動蒐集大量 noteId。",
    example: "正：{trackId:'t-melody', startBeat:0, endBeat:16}。",
  },
  transpose_region: {
    title: "區域移調",
    what: "將指定區域音符按半音數升降調（正數升音，負數降音）。",
    when: "段落調性轉換（如副歌升全音 +2）或八度調整時使用。",
    example: "正：{trackId:'t-chords', semitones:12}（整體升高一個八度）。",
  },
  quantize_region: {
    title: "區域量化",
    what: "將音符起音對齊至最近的網格刻度（如 0.25 拍或 240 ticks 十六分音符）。",
    when: "修正節奏游移或對位不準確時使用。",
    example: "正：{trackId:'t-melody', gridBeat:0.25}。",
  },
  humanize_region: {
    title: "人性化微調",
    what: "對指定音軌的音符力度與起音時間注入細微隨機擾動，消除機械感。",
    when: "作曲完成最後一步修飾，提升演奏生動感。",
    example: "正：{trackId:'t-piano', velocityVariance:8, timingVarianceTicks:15}。",
  },
  update_velocities: {
    title: "改力度",
    what: "批量修改指定音符力度 (1-127)。",
    when: "強調重拍或弱化過渡音時使用。",
    example: "正：{trackId:'t-melody', edits:[{id:'n-1', velocity:105}]}",
  },
  update_tempo: {
    title: "改速度",
    what: "改全曲速度 (40-240 BPM)。",
    when: "設定樂曲速度氛圍。抒情 60-80，流行 100-124，EDM 124-140。",
    example: "正：{bpm:128}。",
  },
  update_key: {
    title: "改調性",
    what: "改調性。keyRoot 0-11 (C=0)；scale 為 major/natural_minor/harmonic_minor 等。",
    when: "開工設定調性或歌曲結構調式轉換時使用。",
    example: "正：{keyRoot:9, scale:'natural_minor'}（A 小調）。",
  },
  set_track_mixer: {
    title: "調整混音通道",
    what: "設定音軌音量 volume (0-127)、立體聲聲相 pan (-1.0 至 1.0)、靜音 mute 與獨奏 solo。",
    when: "平衡聲部音量、創造左右耳空間寬度時使用。",
    example: "正：{trackId:'t-chords', volume:85, pan:-0.2}。",
  },
  set_effect: {
    title: "掛載與調整效果器",
    what: "在音軌或 Master Bus 掛載並調整 Reverb, Delay, Chorus, EQ3, Compressor, Distortion 等效果器。",
    when: "塑造空間殘響、聲音深度或加強低頻質感時使用。",
    example: "正：{target:'track', trackId:'t-chords', type:'reverb', params:{decay:2.5, wet:0.3}}。",
  },
};
