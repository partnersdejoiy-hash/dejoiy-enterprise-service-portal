"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FileText, Plus } from "lucide-react";

type DocumentRequest = {
  id: string;
  employeeId: string;
  documentType: string;
  purpose: string;
  urgencyLevel: string;
  status: string;
  hrNotes?: string | null;
  documentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
  };
};

type MeResponse = {
  id: string;
  email: string;
  name: string;
  department?: {
    id: string;
    name: string;
  } | null;
};

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
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

function UrgencyBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    URGENT: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
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

export default function DocumentRequestsPage() {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [documentType, setDocumentType] = useState("Employment Letter");
  const [purpose, setPurpose] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("MEDIUM");
  const [statusFilter, setStatusFilter] = useState("");

  async function bootstrapUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data: MeResponse | { error?: string } = await res.json();

      if (res.ok) {
        setEmployeeId((data as MeResponse).id);
      }
    } catch {
      // ignore bootstrap failure silently
    }
  }

  async function fetchRequests(status?: string) {
    try {
      setLoading(true);
      setError("");

      const url =
        status && status.length > 0
          ? `/api/documents?status=${encodeURIComponent(status)}`
          : "/api/documents";

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch document requests");
        setLoading(false);
        return;
      }

      setRequests(data);
    } catch {
      setError("Something went wrong while loading document requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrapUser();
    fetchRequests();
  }, []);

  async function handleCreateRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!employeeId) {
      setError("Unable to identify current user");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          documentType,
          purpose,
          urgencyLevel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create document request");
        setSubmitting(false);
        return;
      }

      setPurpose("");
      setDocumentType("Employment Letter");
      setUrgencyLevel("MEDIUM");

      await fetchRequests(statusFilter);
    } catch {
      setError("Something went wrong while creating the document request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFilterChange(value: string) {
    setStatusFilter(value);
    await fetchRequests(value);
  }

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  New Document Request
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Request employment and HR-related documents
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleCreateRequest} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {[
                    "Employment Letter",
                    "Salary Certificate",
                    "Experience Letter",
                    "Offer Letter Copy",
                    "Relieving Letter",
                  ].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Purpose
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Explain why you need this document"
                  className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Urgency
                </label>
                <select
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Document Requests
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Track submitted HR document workflows
                  </p>
                </div>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                  Loading document requests...
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                  No document requests found.
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {request.documentType}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {request.purpose}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <UrgencyBadge value={request.urgencyLevel} />
                            <StatusBadge value={request.status} />
                          </div>
                        </div>

                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          <p>
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              Employee:
                            </span>{" "}
                            {request.employee.name}
                          </p>
                          <p className="mt-1">
                            {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {request.hrNotes ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          <span className="font-medium">HR Notes:</span> {request.hrNotes}
                        </div>
                      ) : null}

                      {request.documentUrl ? (
                        <div className="mt-4">
                          <a
                            href={request.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            Download Document
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}