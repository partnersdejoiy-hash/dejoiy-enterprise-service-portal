import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  ArrowRight,
  FileText,
  GraduationCap,
  ShieldCheck,
  Ticket,
} from "lucide-react";

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </h3>
      <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
        {subtext}
      </p>
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur transition hover:bg-white/15"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex rounded-xl bg-white/15 p-3 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-200">{description}</p>
        </div>

        <ArrowRight className="h-5 w-5 text-slate-200 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const recentTickets = [
    {
      ticketNumber: "DEJ-IT-0003",
      title: "Email login failure",
      priority: "CRITICAL",
      status: "OPEN",
      assignee: "Unassigned",
    },
    {
      ticketNumber: "DEJ-IT-0002",
      title: "Laptop keyboard issue",
      priority: "MEDIUM",
      status: "ASSIGNED",
      assignee: "Amit IT",
    },
    {
      ticketNumber: "DEJ-IT-0001",
      title: "VPN not connecting from home network",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignee: "Amit IT",
    },
  ];

  const pendingTasks = [
    "Approve 7 employment letter requests",
    "Review 3 background verification files",
    "Assign 5 unassigned support tickets",
    "Publish new onboarding guide to Learning Center",
  ];

  return (
    <AppShell>
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-900 p-8 text-white shadow-xl">
        <div className="relative">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-cyan-500/30 blur-3xl" />

          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
              DEJOIY Enterprise Service Portal
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight">
              Welcome back, {user?.name || user?.email}
            </h1>
            <p className="mt-4 max-w-3xl text-slate-200">
              Centralize IT support, HR document workflows, employment verification,
              background checks, internal learning, and administrative operations
              from one enterprise platform.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <QuickActionCard
                href="/tickets/create"
                icon={Ticket}
                title="Create Ticket"
                description="Raise and track IT service requests"
              />
              <QuickActionCard
                href="/document-requests"
                icon={FileText}
                title="Request Document"
                description="Apply for employment and salary documents"
              />
              <QuickActionCard
                href="/employment-verification"
                icon={ShieldCheck}
                title="Employment Verification"
                description="Submit or review verification workflows"
              />
              <QuickActionCard
                href="/learning-center"
                icon={GraduationCap}
                title="Learning Center"
                description="Access knowledge guides and tutorials"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open Tickets"
          value="184"
          subtext="+12% from last week"
        />
        <StatCard
          label="Pending Documents"
          value="37"
          subtext="4 urgent approvals pending"
        />
        <StatCard
          label="Verification Requests"
          value="22"
          subtext="8 awaiting HR review"
        />
        <StatCard
          label="Learning Articles"
          value="64"
          subtext="+6 published this month"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent IT Tickets
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Latest support issues submitted across teams
              </p>
            </div>

            <Link
              href="/tickets"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  <th className="pb-3 font-medium text-slate-500">Ticket #</th>
                  <th className="pb-3 font-medium text-slate-500">Title</th>
                  <th className="pb-3 font-medium text-slate-500">Priority</th>
                  <th className="pb-3 font-medium text-slate-500">Status</th>
                  <th className="pb-3 font-medium text-slate-500">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr
                    key={ticket.ticketNumber}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-4 font-medium text-indigo-600 dark:text-indigo-400">
                      {ticket.ticketNumber}
                    </td>
                    <td className="py-4 text-slate-900 dark:text-white">
                      {ticket.title}
                    </td>
                    <td className="py-4">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {ticket.assignee}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Pending Tasks
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Items requiring immediate attention
          </p>

          <div className="mt-6 space-y-4">
            {pendingTasks.map((task) => (
              <div
                key={task}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {task}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}