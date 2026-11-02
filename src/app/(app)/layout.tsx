import { requireUser } from "@/core/auth/session";
import { visibleModules } from "@/core/modules";
import { AppNav } from "@/core/ui/AppNav";
import styles from "./shell.module.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className={styles.shell}>
      <AppNav modules={visibleModules(user.isAdmin)} userName={user.displayName} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
