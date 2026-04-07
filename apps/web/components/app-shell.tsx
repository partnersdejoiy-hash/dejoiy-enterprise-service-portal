import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getSessionUser } from "@/lib/auth";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <Sidebar user={user} />

      <div className="lg:pl-72">
        <Topbar user={user} />

        <main className="min-h-[calc(100vh-80px)] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}