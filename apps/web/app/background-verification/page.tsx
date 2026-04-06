"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FileCheck2, Search, ShieldAlert } from "lucide-react";

type BackgroundVerificationRecord = {
  id: string;
  employeeId: string;
  verificationCompany: string;
  verificationStatus: string;
  verificationNotes?: string | null;
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

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();

  let styles =
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  if (normalized.includes("complete") || normalized.includes("clear")) {
    styles =
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  } else if (normalized.includes("pending")) {
    styles =
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  } else if (
    normalized.includes("reject") ||
    normalized.includes("fail") ||
    normalized.includes("issue")
  ) {
    styles =
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  } else if (
    normalized.includes("review") ||
    normalized.includes("progress")
  ) {
    styles =
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {value}
    </span>
  );
}

export default function BackgroundVerificationPage() {
  const [records, setRecords] = useState<BackgroundVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeIdFilter, setEmployeeIdFilter] = useState("");

  async function fetchRecords(filters?: {
    verificationStatus?: string;
    employeeId?: string;
  }) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (filters?.verificationStatus) {
        params.set("verificationStatus", filters.verificationStatus);
      }

      if (filters?.employeeId) {
        params.set("employeeId", filters.employeeId);
      }

      const url = params.toString()
        ? `/api/background-verification?${params.toString()}`
        : "/api/background-verification";

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch background verification records");
        setLoading(false);
        return;
      }

      setRecords(data);
    } catch {
      setError("Something went wrong while loading background verification records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecords();
  }, []);

  async function handleApplyFilters(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await fetchRecords({
      verificationStatus: statusFilter || undefined,
      employeeId: employeeIdFilter || undefined,
    });
  }

  async function handleResetFilters() {
    setStatusFilter("");
    setEmployeeIdFilter("");
    await fetchRecords();
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Background Verification
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review employee background verification records, statuses, notes, and supporting documents.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Filters
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Narrow down verification records
                </p>
              </div>
            </div>

            <form onSubmit={handleApplyFilters} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Verification Status
                </label>
                <input
                  type="text"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  placeholder="e.g. Pending, Completed"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={employeeIdFilter}
                  onChange={(e) => setEmployeeIdFilter(e.target.value)}
                  placeholder="Enter employee UUID"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  Apply
                </button>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-500" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Background verification records are HR-controlled and may contain sensitive hiring information.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Verification Records
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Review current background verification history and supporting files
                </p>
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                  Loading background verification records...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              ) : records.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                  No background verification records found.
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                              {record.employee.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {record.employee.email}
                              {record.employee.employeeId
                                ? ` • ${record.employee.employeeId}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge value={record.verificationStatus} />
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                              {record.verificationCompany}
                            </span>
                          </div>

                          {record.verificationNotes ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                              <span className="font-medium">Notes:</span>{" "}
                              {record.verificationNotes}
                            </div>
                          ) : null}

                          {record.documentUrl ? (
                            <div>
                              <a
                                href={record.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                View Attached Report
                              </a>
                            </div>
                          ) : null}
                        </div>

                        <div className="text-sm text-slate-500 dark:text-slate-400 lg:text-right">
                          <p>
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              Created:
                            </span>{" "}
                            {new Date(record.createdAt).toLocaleString()}
                          </p>
                          <p className="mt-1">
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              Updated:
                            </span>{" "}
                            {new Date(record.updatedAt).toLocaleString()}
                          </p>
                          <p className="mt-1 break-all">
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              Record ID:
                            </span>{" "}
                            {record.id}
                          </p>
                        </div>
                      </div>
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