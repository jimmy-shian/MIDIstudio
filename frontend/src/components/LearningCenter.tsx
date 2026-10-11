import controls from "../styles/controls.module.css";
import Collapsible from "./Collapsible";

// 模組：三層教學（快速上手 / 參數指南 / 知識手冊摘要）。
export default function LearningCenter() {
  return (
    <Collapsible title="教學中心" subtitle="3 分鐘上手 → 參數 → 手冊" defaultOpen={false}>
      <div>
        <h5 className={controls.sectionTitle}>Level 1 · 3 分鐘快速上手</h5>
        <ol className={controls.muted}>
          <li>選拍號：要華爾滋先點風格範本「3/4 浪漫華爾滋」，或叫 AI「3/4 拍」。</li>
          <li>點範本：一鍵產生旋律/和弦/貝斯/鼓組（底鼓＋小鼓＋鈸的分工編曲），或在對話框貼 prompt。</li>
          <li>播放：按播放試聽，點進度條跳轉，M/S 試聽單軌。</li>
          <li>調空間：音軌「空間/回音」按鈕即 Aux 發送，音量/聲相拉出寬度。</li>
          <li>匯出：滿意後匯出 MIDI，自動存檔在後端 SQLite。</li>
        </ol>
        <h5 className={controls.sectionTitle}>Level 2 · 參數指南</h5>
        <ul className={controls.muted}>
          <li>BPM 40–240：抒情 60–80，流行 100–124，EDM 124–140。</li>
          <li>網格：1 拍/0.5 拍/0.25 拍 + 三連音 1/3、1/6；三連音適合 shuffle 與華爾滋裝飾。</li>
          <li>力度 1–127：重拍/高音 95–105，伴奏 65–80，貝斯 85–95；完成後用漸強/漸弱塑形。</li>
          <li>音量 0–127、聲相 -1–1：和弦稍左、鼓組稍右，主旋律居中。</li>
          <li>空間/回音：殘響 decay 2–3s、wet 0.2–0.3；回音 feedback 0.3–0.4 避免渾濁。</li>
          <li>貝斯禁超 C4，和弦 C3–E5，旋律 C4–C6；鼓組：36 底鼓定脈動、38 小鼓打 2、4 拍、42 踩鈸鋪律動。</li>
        </ul>
        <h5 className={controls.sectionTitle}>Level 3 · 作曲知識速查</h5>
        <ul className={controls.muted}>
          <li>大調 I-V-vi-IV，小調 i-VI-III-VII，爵士 ii-V-I / ii°-V7-i。</li>
          <li>6/8 拍是兩大拍（附點四分），不是三小拍；小節長同 3/4 但重音不同。</li>
          <li>複製/貼上：Ctrl+C 複製視窗，Ctrl+V 貼至視角起點，Ctrl+D 重複最後一小節。</li>
          <li>鼓是三件套分工：底鼓踩拍點、小鼓打 2、4 拍 backbeat、鈸維持律動；進副歌前加一小節加花（fill）。</li>
          <li>AI 指令範例：「A 小調 8 小節，副歌加鼓組」「副歌升全音」「鼓換 boom bap（切分底鼓＋鬆弛小鼓）」。</li>
        </ul>
      </div>
    </Collapsible>
  );
}
