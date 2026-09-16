import { useState, type ReactNode } from "react";
import styles from "./Collapsible.module.css";

// 模組：全站唯一收合面板。動畫與 Dropdown 同源（scaleY＋opacity＋visibility，0.3s ease）。
interface CollapsibleProps {
  title: ReactNode;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Collapsible({ title, subtitle, defaultOpen = false, children, className }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={[styles.panel, className ?? ""].filter(Boolean).join(" ")} data-open={open}>
      <button type="button" className={styles.header} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={styles.title}>
          {title}
          {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        </span>
        <span className={styles.arrow} aria-hidden />
      </button>
      <div className={styles.bodyWrap} aria-hidden={!open}>
        <div className={styles.bodyInner}>
          <div className={styles.body}>{children}</div>
        </div>
      </div>
    </section>
  );
}
