import { useEffect, useId, useRef, useState } from "react";
import styles from "./Dropdown.module.css";

export interface DropdownOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

// 模組：全站唯一下拉選單。動畫與互動規範見 Dropdown.module.css（源自「下拉式選單動畫.txt」）。
// 用法：<Dropdown value={v} options={[{value,label}]} onChange={setV} label="..." compact />
interface DropdownProps<T extends string | number> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
  label?: string;
  compact?: boolean;
  className?: string;
  placeholder?: string;
}

export default function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  label,
  compact = false,
  className,
  placeholder = "請選擇",
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value);

  // 點外部關閉（與規範 txt 的 window click 行為一致）
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const cls = [styles.wrap, compact ? styles.compact : "", className ?? ""].filter(Boolean).join(" ");

  return (
    <div ref={wrapRef} className={cls} data-open={open}>
      <div
        className={styles.trigger}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <span className={styles.label}>{current?.label ?? placeholder}</span>
        <div className={styles.arrow} aria-hidden />
      </div>
      <div className={styles.options} role="listbox" id={listId} aria-label={label}>
        {options.map((o) => (
          <div
            key={String(o.value)}
            className={styles.option}
            role="option"
            aria-selected={o.value === value}
            data-active={o.value === value}
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
          >
            {o.label}
          </div>
        ))}
      </div>
    </div>
  );
}
