import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { getSessionUser } from "@/lib/auth";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const user = getSessionUser();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">

        {/* Topbar */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>

      </div>
    </div>
  );
}