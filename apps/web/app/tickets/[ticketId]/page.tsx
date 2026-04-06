"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TicketThread } from "@/components/ticket-thread";
import { Paperclip } from "lucide-react";

type TicketComment = {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  attachments?: {
    id: string;
    fileName: string;
    fileUrl: string;
    contentType?: string | null;
  }[];
};

type TicketAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType?: string | null;
};

type TicketDetail = {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
  employeeId: string;
  assignedToId?: string | null;
  employee: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
    role: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
    role: string;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
  attachments: TicketAttachment[];
  comments: TicketComment[];
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
      className={`rounded-full px-3 py-1 text-xs font-medium ${
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
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[value] || "bg-slate-100 text-slate-700"
      }`}
    >
      {value}
    </span>
  );
}

export default function TicketDetailsPage({
  params,
}: {
  params: { ticketId: string };
}) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  async function fetchTicket() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/tickets/${params.ticketId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load ticket");
        setLoading(false);
        return;
      }

      setTicket(data);
      setStatus(data.status);
      setPriority(data.priority);
      setAssignedToId(data.assignedToId || "");
      setLoading(false);
    } catch {
      setError("Something went wrong while loading ticket.");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTicket();
  }, [params.ticketId]);

  async function handleUpdateTicket() {
    if (!ticket) return;

    try {
      setUpdating(true);
      setError("");

      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          priority,
          assignedToId: assignedToId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update ticket");
        setUpdating(false);
        return;
      }

      setTicket({
        ...ticket,
        ...data,
      });
    } catch {
      setError("Something went wrong while updating ticket.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading ticket details...
        </div>
      </AppShell>
    );
  }

  if (error && !ticket) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      </AppShell>
    );
  }

  if (!ticket) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Ticket not found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {ticket.ticketNumber}
                </p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {ticket.title}
                </h1>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {ticket.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <PriorityBadge value={ticket.priority} />
                <StatusBadge value={ticket.status} />
              </div>
            </div>

            {ticket.attachments.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Attachments
                </h3>

                <div className="mt-3 space-y-2">
                  {ticket.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Paperclip className="h-4 w-4 text-slate-400" />
                      <span>{file.fileName}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <TicketThread
            ticketId={ticket.id}
            comments={ticket.comments.map((comment) => ({
              id: comment.id,
              userName: comment.user.name,
              role: comment.user.role,
              timestamp: new Date(comment.createdAt).toLocaleString(),
              message: comment.message,
            }))}
            onCommentAdded={fetchTicket}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Ticket Details
            </h2>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">Employee</span>
                <span className="text-right font-medium text-slate-900 dark:text-white">
                  {ticket.employee.name}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">Contact Email</span>
                <span className="text-right font-medium text-slate-900 dark:text-white">
                  {ticket.contactEmail}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">Department</span>
                <span className="text-right font-medium text-slate-900 dark:text-white">
                  {ticket.department?.name || "-"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">Category</span>
                <span className="text-right font-medium text-slate-900 dark:text-white">
                  {ticket.category}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">Assigned To</span>
                <span className="text-right font-medium text-slate-900 dark:text-white">
                  {ticket.assignedTo?.name || "Unassigned"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">Created</span>
                <span className="text-right font-medium text-slate-900 dark:text-white">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">Updated</span>
                <span className="text-right font-medium text-slate-900 dark:text-white">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Update Ticket
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {[
                    "OPEN",
                    "ASSIGNED",
                    "IN_PROGRESS",
                    "PENDING",
                    "WAITING_FOR_EMPLOYEE",
                    "RESOLVED",
                    "CLOSED",
                  ].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Assigned To ID
                </label>
                <input
                  type="text"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  placeholder="Enter assignee user ID or leave blank"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleUpdateTicket}
                disabled={updating}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}