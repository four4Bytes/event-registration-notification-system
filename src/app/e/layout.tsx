import styles from "./layout.module.css";

export default function EventLinkLayout({ children }: { children: React.ReactNode }) {
  return <main className={styles.shell}>{children}</main>;
}
