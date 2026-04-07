import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

type AppShellProps = {
  children: ReactNode;
  user?: any;
};

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <Sidebar user={user} />

      <div className="lg:pl-72 flex flex-col min-h-screen">
        <Topbar />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}