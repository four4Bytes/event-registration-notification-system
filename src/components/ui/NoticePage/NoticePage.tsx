import clsx from "clsx";

import styles from "./NoticePage.module.css";

export interface NoticePageProps {
  title: string;
  message: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Full-page notice for terminal or informational app states (e.g. account
 * deactivated, access denied, access changed). Actions such as navigation links
 * are passed as children.
 */
export function NoticePage({ title, message, children, className }: NoticePageProps) {
  return (
    <main className={clsx(styles.page, className)}>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        {children}
      </div>
    </main>
  );
}
