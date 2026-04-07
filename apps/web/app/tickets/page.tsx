"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Plus, Search } from "lucide-react";

type Ticket = {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    comments: number;
    attachments: number;
  };
};

type TicketApiResponse = {
  data: Ticket[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    WAITING_FOR_EMPLOYEE:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    RESOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    CLOSED: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[value] || "bg-slate-100 text-slate-700"
      }`}
    >
      {value}
    </span>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[value] || "bg-slate-100 text-slate-700"
      }`}
    >
      {value}
    </span>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function fetchTickets(search = "") {
    try {
      setLoading(true);
      setError("");

      const url = search
        ? `/api/tickets?q=${encodeURIComponent(search)}`
        : "/api/tickets";

      const res = await fetch(url, {
        method: "GET",
      });

      const data: TicketApiResponse = await res.json();

      if (!res.ok) {
        setError((data as unknown as { error?: string }).error || "Failed to load tickets");
        setLoading(false);
        return;
      }

      setTickets(data.data || []);
      setLoading(false);
    } catch {
      setError("Something went wrong while fetching tickets.");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    fetchTickets(query);
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            IT Service Tickets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage enterprise technical support tickets and requests.
          </p>
        </div>

        <Link
          href="/tickets/create"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Create Ticket
        </Link>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
          <div className="flex flex-1 items-center rounded-2xl border border-slate-300 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800/70">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ticket number, title, or description..."
              className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading tickets...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No tickets found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr className="text-left text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-4 font-medium">Ticket #</th>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Employee</th>
                  <th className="px-6 py-4 font-medium">Assigned To</th>
                  <th className="px-6 py-4 font-medium">Comments</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </td>

                    <td className="px-6 py-4 text-slate-900 dark:text-white">
                      {ticket.title}
                    </td>

                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {ticket.category}
                    </td>

                    <td className="px-6 py-4">
                      <PriorityBadge value={ticket.priority} />
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge value={ticket.status} />
                    </td>

                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {ticket.employee?.name || "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {ticket.assignedTo?.name || "Unassigned"}
                    </td>

                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {ticket._count?.comments ?? 0}
                    </td>

                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
