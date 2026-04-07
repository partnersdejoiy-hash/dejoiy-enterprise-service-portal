import Link from "next/link";
import { FileText, GraduationCap, ShieldCheck, Ticket } from "lucide-react";

const actions = [
  { href: "/tickets/create", label: "Create Ticket", icon: Ticket },
  { href: "/document-requests", label: "Request Document", icon: FileText },
  { href: "/employment-verification", label: "Verify Employee", icon: ShieldCheck },
  { href: "/learning-center", label: "View Learning Center", icon: GraduationCap },
];

export function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/40 p-3 text-indigo-600 dark:text-indigo-300">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{action.label}</p>
              <p className="text-xs text-slate-500">Open module</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
