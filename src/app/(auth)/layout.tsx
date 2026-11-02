import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon.svg" alt="" width={44} height={44} className={styles.logo} />
          <span className={styles.wordmark}>Wesley</span>
        </div>
        {children}
      </div>
    </main>
  );
}
