// 模組：曲式/功能和聲/節奏型。agent 作曲時的「套路庫」，避免每次都寫 I-V-vi-IV。
// 羅馬數字皆以大調為基準，小調另標。

/** 功能組：T=主 S=下屬 D=屬 */
export const FUNCTIONS: Record<string, string[]> = {
  T: ["I", "vi", "iii"],
  S: ["IV", "ii"],
  D: ["V", "vii"],
};

/** 下一個和弦建議：current -> candidates（流行/爵士通用） */
export const NEXT_CHORD: Record<string, string[]> = {
  I: ["V", "vi", "IV", "ii"],
  ii: ["V", "vii", "IV"],
  iii: ["vi", "IV"],
  IV: ["V", "I", "ii"],
  V: ["I", "vi"],
  vi: ["IV", "ii", "V"],
  vii: ["I"],
};

/** 終止式 */
export const CADENCES: Record<string, string[]> = {
  authentic: ["V", "I"],
  plagal: ["IV", "I"],
  deceptive: ["V", "vi"],
  half: ["ii", "V"],
  minor_authentic: ["V", "i"],
};

/** 曲式模板（每字母=段，數字=小節數） */
export const FORMS: Record<string, string> = {
  pop_8: "前奏2 + 主歌4 + 副歌4（先做副歌的 I-V-vi-IV 再回頭寫主歌）",
  loop_4: "4小節循環：和弦每小節一組，貝斯跟根音，旋律2拍一動機",
  jazz_12: "12小節藍調：I I I I / IV IV I I / V IV I V（可用 dominant7）",
};

/** 鼓節奏型：每格=1/16拍，K=kick S=snare H=hat（1小節16格） */
export const RHYTHMS: Record<string, string> = {
  backbeat: "K...S...K...S...",
  four_on_floor: "K...K...K...K...",
  trap: "K.....S..K...S..",
};

/** 力度指南 */
export const VELOCITY_GUIDE = "重拍/高音/每句開頭 95-105；伴奏和弦 65-80；貝斯 85-95；鬼音/經過音 50-65。全曲勿同一值。";
