"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  FileText,
  ShieldCheck,
  UserSearch,
  GraduationCap,
  Settings,
  Users,
  Building2,
} from "lucide-react";

type SidebarProps = {
  user?: {
    role?: string;
  } | null;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Tickets",
    href: "/tickets",
    icon: Ticket,
  },
  {
    label: "Document Requests",
    href: "/document-requests",
    icon: FileText,
  },
  {
    label: "Employment Verification",
    href: "/employment-verification",
    icon: ShieldCheck,
  },
  {
    label: "Background Verification",
    href: "/background-verification",
    icon: UserSearch,
  },
  {
    label: "Learning Center",
    href: "/learning-center",
    icon: GraduationCap,
  },
  {
    label: "Admin",
    href: "/admin",
    icon: Users,
    adminOnly: true,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavigation = navigation.filter((item) => {
    if (item.adminOnly && user?.role !== "ADMIN") {
      return false;
    }
    return true;
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col dark:border-slate-800 dark:bg-slate-900">

      {/* Logo */}
      <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-800">
        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <Building2 className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              DEJOIY Portal
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enterprise Service Platform
            </p>
          </div>

        </div>
      </div>

      {/* Navigation */}

      <nav className="flex-1 space-y-2 p-4">

        {filteredNavigation.map((item) => {

          const Icon = item.icon;

          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  active
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white"
                }`}
              />

              <span>{item.label}</span>

            </Link>
          );
        })}

      </nav>

      {/* Footer */}

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">

        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">

          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Enterprise Support
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Need access or facing issues? Contact IT or HR from the respective modules.
          </p>

        </div>

      </div>

    </aside>
  );
}