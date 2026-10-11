import { useProjectStore } from "../store/useProjectStore";
import type { MusicSpec } from "@midistudio/shared";
import controls from "../styles/controls.module.css";
import styles from "./ChordPanel.module.css";
import Collapsible from "./Collapsible";

// 模組：6 大風格一鍵作曲（無需 LLM，直接走 create_composition 確定性編譯）。
const PRESETS: { name: string; desc: string; spec: MusicSpec; prompt: string }[] = [
  {
    name: "4/4 流行抒情",
    desc: "100BPM C大調 I-V-vi-IV",
    spec: {
      genre: "pop", tempo: 100, timeSignature: [4, 4], keyRoot: 0, scale: "major",
      sections: [{ name: "Verse", bars: 4, progression: ["I", "V", "vi", "IV"], grooveStyle: "standard" }],
    },
    prompt: "寫一段 8 小節 C 大調流行抒情，I-V-vi-IV，副歌配鼓組 backbeat（底鼓＋2、4 拍小鼓）",
  },
  {
    name: "3/4 浪漫華爾滋",
    desc: "90BPM C大調 I-IV-V",
    spec: {
      genre: "waltz", tempo: 90, timeSignature: [3, 4], keyRoot: 0, scale: "major",
      sections: [{ name: "A", bars: 4, progression: ["I", "IV", "V", "I"], grooveStyle: "waltz_34" }],
    },
    prompt: "寫一首 3/4 拍華爾滋，浪漫，4 小節，底鼓打第 1 拍、鈸鋪 2、3 拍",
  },
  {
    name: "6/8 搖滾抒情",
    desc: "75BPM C大調 I-V-vi-IV",
    spec: {
      genre: "rock", tempo: 75, timeSignature: [6, 8], keyRoot: 0, scale: "major",
      sections: [{ name: "Verse", bars: 4, progression: ["I", "V", "vi", "IV"], grooveStyle: "ballad_68" }],
    },
    prompt: "寫一段 6/8 拍搖滾抒情，慢板，鼓組鋪兩大拍律動",
  },
  {
    name: "Lo-Fi 慵懶雨天",
    desc: "80BPM A小調 i-VI-III-VII",
    spec: {
      genre: "lofi", tempo: 80, timeSignature: [4, 4], keyRoot: 9, scale: "natural_minor",
      sections: [{ name: "Loop", bars: 4, progression: ["i", "VI", "III", "VII"], grooveStyle: "boom_bap" }],
    },
    prompt: "寫一段 A 小調 Lo-Fi，慵懶雨天，boom bap 鼓組（切分底鼓＋鬆弛小鼓）",
  },
  {
    name: "80s 復古合成波",
    desc: "110BPM C小調 i-VI-III-VII",
    spec: {
      genre: "synthwave", tempo: 110, timeSignature: [4, 4], keyRoot: 0, scale: "natural_minor",
      sections: [{ name: "A", bars: 4, progression: ["i", "VI", "III", "VII"], grooveStyle: "four_on_floor" }],
    },
    prompt: "寫一段 80s 合成波，霓虹夜晚感，four on floor 底鼓＋2、4 拍小鼓",
  },
  {
    name: "EDM 舞曲熱潮",
    desc: "128BPM C大調 vi-IV-I-V",
    spec: {
      genre: "pop", tempo: 128, timeSignature: [4, 4], keyRoot: 0, scale: "major",
      sections: [{ name: "Drop", bars: 4, progression: ["vi", "IV", "I", "V"], grooveStyle: "four_on_floor" }],
    },
    prompt: "寫一段 128BPM EDM，派對熱潮，four on floor 底鼓＋2、4 拍小鼓",
  },
];

export default function StylePresets() {
  const localApply = useProjectStore((s) => s.localApply);
  return (
    <Collapsible title="風格範本" subtitle="6 大經典一鍵作曲" defaultOpen={false}>
      <div className={styles.grid}>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            title={`${p.desc}｜試著對 AI 說：「${p.prompt}」`}
            className={controls.btn}
            onClick={() => localApply([{ op: "create_composition", spec: p.spec }])}
          >
            {p.name} · {p.desc}
          </button>
        ))}
      </div>
      <div className={controls.muted}>點一下直接編曲；把 prompt 貼給 AI 可再變化。</div>
    </Collapsible>
  );
}
