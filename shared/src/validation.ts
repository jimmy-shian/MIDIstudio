import type { ProjectState, ToolOp, ValidationIssue } from "./types.js";
import { SCALES, ROMAN_MAJOR, ROMAN_MINOR } from "./music-theory.js";
import { getInstrumentProfile } from "./instruments-registry.js";
import { beatsToTicks, getMeasureTicks } from "./midi-utils.js";

export function validateOpsDetailed(project: ProjectState, ops: ToolOp[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const trackIds = new Set(project.tracks.map((t) => t.id));

  for (const op of ops) {
    switch (op.op) {
      case "create_composition": {
        const spec = op.spec;
        if (!spec) {
          issues.push({ severity: "error", message: "create_composition 缺少 spec", code: "SPEC_EMPTY" });
          break;
        }
        if (spec.tempo && (spec.tempo < 40 || spec.tempo > 240)) {
          issues.push({ severity: "error", message: `spec.tempo 超出範圍 (40-240): ${spec.tempo}`, code: "TEMPO_INVALID" });
        }
        if (spec.timeSignature) {
          const [num, den] = spec.timeSignature;
          if (num < 1 || num > 32 || ![2, 4, 8, 16].includes(den)) {
            issues.push({ severity: "error", message: `spec.timeSignature 非法: ${num}/${den}`, code: "TIME_SIG_INVALID" });
          }
        }
        if (!spec.sections || !spec.sections.length) {
          issues.push({ severity: "error", message: "spec.sections 不可為空", code: "SECTIONS_EMPTY" });
        }
        break;
      }

      case "update_time_signature": {
        const num = op.numerator;
        const den = op.denominator;
        if (num < 1 || num > 32) {
          issues.push({ severity: "error", message: `拍號分子超出合理範圍 (1-32): ${num}`, code: "NUMERATOR_INVALID" });
        }
        if (![2, 4, 8, 16].includes(den)) {
          issues.push({ severity: "error", message: `拍號分母必須為 2, 4, 8 或 16: ${den}`, code: "DENOMINATOR_INVALID" });
        }
        break;
      }

      case "create_track":
        if (!op.name || !op.kind) {
          issues.push({ severity: "error", message: "create_track 需要 name 與 kind", code: "TRACK_PARAM_MISSING" });
        }
        break;

      case "delete_track":
        if (!trackIds.has(op.trackId)) {
          issues.push({ severity: "error", message: `track 不存在: ${op.trackId}`, code: "TRACK_NOT_FOUND" });
        }
        break;

      case "add_notes": {
        if (!trackIds.has(op.trackId)) {
          issues.push({ severity: "error", message: `track 不存在: ${op.trackId}`, code: "TRACK_NOT_FOUND" });
          break;
        }
        if (!op.notes.length) {
          issues.push({ severity: "error", message: "add_notes 為空", code: "NOTES_EMPTY" });
        }
        if (op.notes.length > 512) {
          issues.push({ severity: "error", message: "單次 add_notes 最多 512 個音", code: "NOTES_LIMIT_EXCEEDED" });
        }
        for (const n of op.notes) {
          if (n.pitch < 0 || n.pitch > 127) {
            issues.push({ severity: "error", message: `pitch 超界 (0-127): ${n.pitch}`, code: "PITCH_OUT_OF_BOUNDS" });
          }
          if (n.startTick !== undefined && n.startTick < 0) {
            issues.push({ severity: "error", message: `startTick 不可為負: ${n.startTick}`, code: "START_TICK_INVALID" });
          }
          if (n.startBeat !== undefined && n.startBeat < 0) {
            issues.push({ severity: "error", message: `startBeat 不可為負: ${n.startBeat}`, code: "START_BEAT_INVALID" });
          }
          if (n.durBeat !== undefined && (n.durBeat <= 0 || n.durBeat > 64)) {
            issues.push({ severity: "error", message: `durBeat 非法: ${n.durBeat}`, code: "DURATION_INVALID" });
          }
          if (n.durationTicks !== undefined && (n.durationTicks <= 0 || n.durationTicks > 64 * 960)) {
            issues.push({ severity: "error", message: `durationTicks 非法: ${n.durationTicks}`, code: "DURATION_INVALID" });
          }
          if (n.velocity !== undefined && (n.velocity < 1 || n.velocity > 127)) {
            issues.push({ severity: "error", message: `velocity 非法 (1-127): ${n.velocity}`, code: "VELOCITY_INVALID" });
          }
        }
        // Level 3 音樂性警告：建議音域、大跳、低音混濁（不阻擋提交，僅提示修飾）。
        const target = project.tracks.find((t) => t.id === op.trackId);
        if (target) {
          const profile = getInstrumentProfile(target.kind, target.program);
          for (const n of op.notes) {
            if (n.pitch < profile.recommendedLow || n.pitch > profile.recommendedHigh) {
              issues.push({
                severity: "warning",
                message: `${target.name} 音高 ${n.pitch} 超出建議音域 ${profile.recommendedLow}-${profile.recommendedHigh}（${profile.name}）`,
                code: "REGISTER_WARNING",
              });
              break;
            }
          }
          if (target.kind === "melody" && op.notes.length >= 2) {
            const sorted = op.notes.slice().sort((a, b) => {
              const sa = a.startTick ?? (a.startBeat !== undefined ? beatsToTicks(a.startBeat) : 0);
              const sb = b.startTick ?? (b.startBeat !== undefined ? beatsToTicks(b.startBeat) : 0);
              return sa - sb;
            });
            for (let i = 1; i < sorted.length; i++) {
              if (Math.abs(sorted[i].pitch - sorted[i - 1].pitch) > 12) {
                issues.push({
                  severity: "warning",
                  message: `旋律連續大跳超過八度（${sorted[i - 1].pitch} -> ${sorted[i].pitch}），建議檢查歌唱性`,
                  code: "MELODY_LARGE_LEAP",
                });
                break;
              }
            }
          }
          if (target.kind === "bass") {
            const lowStacked = op.notes.filter((n) => n.pitch < 36).length >= 2;
            if (lowStacked) {
              issues.push({
                severity: "warning",
                message: `貝斯在 C2 以下堆疊多音，易混濁（Muddy Bass），建議精簡至根音`,
                code: "BASS_MUDDY_WARNING",
              });
            }
          }
          // Level 2 工程一致性：單音軌重疊、超長越界（阻擋提交，需修正）。
          if (profile.isMonophonic) {
            const all = [
              ...target.notes.map((n) => ({
                s: n.startTick ?? beatsToTicks(n.startBeat),
                e: (n.startTick ?? beatsToTicks(n.startBeat)) + (n.durationTicks ?? beatsToTicks(n.durBeat)),
              })),
              ...op.notes.map((n) => {
                const s = n.startTick ?? (n.startBeat !== undefined ? beatsToTicks(n.startBeat) : 0);
                const d =
                  n.durationTicks ?? (n.durBeat !== undefined ? beatsToTicks(n.durBeat) : 960);
                return { s, e: s + d };
              }),
            ].sort((a, b) => a.s - b.s);
            for (let i = 1; i < all.length; i++) {
              if (all[i].s < all[i - 1].e) {
                issues.push({
                  severity: "error",
                  message: `${target.name} 為單音軌，檢測到重疊發音（${all[i - 1].s} 與 ${all[i].s} ticks），請錯開或刪除其一`,
                  code: "MONO_OVERLAP",
                });
                break;
              }
            }
          }
          const maxTicks = 128 * getMeasureTicks(project.timeSig ?? [4, 4]);
          for (const n of op.notes) {
            const s = n.startTick ?? (n.startBeat !== undefined ? beatsToTicks(n.startBeat) : 0);
            if (s > maxTicks) {
              issues.push({
                severity: "warning",
                message: `音符起始 ${s} ticks 超出 128 小節合理範圍，可能放錯位置`,
                code: "NOTE_OUT_OF_RANGE",
              });
              break;
            }
          }
        }
        break;
      }

      case "delete_notes":
        if (!trackIds.has(op.trackId)) {
          issues.push({ severity: "error", message: `track 不存在: ${op.trackId}`, code: "TRACK_NOT_FOUND" });
        }
        break;

      case "update_velocities": {
        if (!trackIds.has(op.trackId)) {
          issues.push({ severity: "error", message: `track 不存在: ${op.trackId}`, code: "TRACK_NOT_FOUND" });
          break;
        }
        if (!op.edits.length) {
          issues.push({ severity: "error", message: "update_velocities 為空", code: "EDITS_EMPTY" });
        }
        for (const e of op.edits) {
          if (!e.id) issues.push({ severity: "error", message: "update_velocities 缺少 note id", code: "NOTE_ID_MISSING" });
          if (e.velocity < 1 || e.velocity > 127) {
            issues.push({ severity: "error", message: `velocity 非法 (1-127): ${e.velocity}`, code: "VELOCITY_INVALID" });
          }
        }
        break;
      }

      case "update_tempo":
        if (op.bpm < 40 || op.bpm > 240) {
          issues.push({ severity: "error", message: `bpm 超界 (40-240): ${op.bpm}`, code: "TEMPO_OUT_OF_BOUNDS" });
        }
        break;

      case "update_key":
        if (op.keyRoot < 0 || op.keyRoot > 11) {
          issues.push({ severity: "error", message: `keyRoot 須在 0-11 之間: ${op.keyRoot}`, code: "KEY_ROOT_INVALID" });
        }
        if (!SCALES[op.scale]) {
          issues.push({ severity: "error", message: `未知 scale: ${op.scale}`, code: "SCALE_UNKNOWN" });
        }
        break;

      case "set_chord_progression": {
        if (!op.progression || !op.progression.length) {
          issues.push({ severity: "error", message: "progression 為空", code: "PROGRESSION_EMPTY" });
        }
        if (op.velocity !== undefined && (op.velocity < 1 || op.velocity > 127)) {
          issues.push({ severity: "error", message: `velocity 非法: ${op.velocity}`, code: "VELOCITY_INVALID" });
        }
        if (op.octave !== undefined && (op.octave < 1 || op.octave > 7)) {
          issues.push({ severity: "error", message: `octave 非法: ${op.octave}`, code: "OCTAVE_INVALID" });
        }
        for (const r of op.progression ?? []) {
          const clean = r.trim();
          const valid =
            ROMAN_MAJOR[clean] ||
            ROMAN_MINOR[clean] ||
            ROMAN_MAJOR[clean.toUpperCase()] ||
            ROMAN_MINOR[clean.toLowerCase()];
          if (!valid) {
            issues.push({ severity: "warning", message: `非標準羅馬數字符號: ${r}`, code: "ROMAN_NON_STANDARD" });
          }
        }
        break;
      }

      case "generate_drum_pattern": {
        if (op.bars <= 0 || op.bars > 64) {
          issues.push({ severity: "error", message: `bars 超出合理範圍 (1-64): ${op.bars}`, code: "BARS_INVALID" });
        }
        break;
      }

      case "create_section": {
        if (!op.name) issues.push({ severity: "error", message: "create_section 缺少段落名稱", code: "SECTION_NAME_MISSING" });
        if (op.bars <= 0 || op.bars > 128) issues.push({ severity: "error", message: "bars 非法", code: "BARS_INVALID" });
        break;
      }

      case "clear_region":
      case "transpose_region":
      case "quantize_region":
      case "humanize_region":
      case "set_track_mixer": {
        if (!trackIds.has(op.trackId)) {
          issues.push({ severity: "error", message: `track 不存在: ${op.trackId}`, code: "TRACK_NOT_FOUND" });
        }
        break;
      }

      case "set_effect": {
        if (op.target === "track" && (!op.trackId || !trackIds.has(op.trackId))) {
          issues.push({ severity: "error", message: `找不到效果器目標音軌: ${op.trackId}`, code: "TRACK_NOT_FOUND" });
        }
        break;
      }
    }
  }

  return issues;
}

/** 保持相容性：回傳所有 Hard Error 訊息字串 */
export function validateOps(project: ProjectState, ops: ToolOp[]): string[] {
  const issues = validateOpsDetailed(project, ops);
  return issues.filter((i) => i.severity === "error").map((i) => i.message);
}
