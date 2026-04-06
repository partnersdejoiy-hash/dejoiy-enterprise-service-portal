"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ShieldCheck, Send } from "lucide-react";

type EmploymentVerification = {
  id: string;
  employeeId: string;
  employeeName: string;
  companyName: string;
  requestEmail: string;
  verificationPurpose: string;
  status: string;
  hrNotes?: string | null;
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
  name: string;
  email: string;
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

export default function EmploymentVerificationPage() {
  const [records, setRecords] = useState<EmploymentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [verificationPurpose, setVerificationPurpose] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function bootstrapUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data: MeResponse | { error?: string } = await res.json();

      if (res.ok) {
        const me = data as MeResponse;
        setEmployeeId(me.id);
        setEmployeeName(me.name);
      }
    } catch {
      // silent fallback
    }
  }

  async function fetchRecords(status?: string) {
    try {
      setLoading(true);
      setError("");

      const url =
        status && status.length > 0
          ? `/api/employment-verification?status=${encodeURIComponent(status)}`
          : "/api/employment-verification";

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch verification requests");
        setLoading(false);
        return;
      }

      setRecords(data);
    } catch {
      setError("Something went wrong while loading verification requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrapUser();
    fetchRecords();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!employeeId || !employeeName) {
      setError("Unable to identify the current employee");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/employment-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          employeeName,
          companyName,
          requestEmail,
          verificationPurpose,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit verification request");
        setSubmitting(false);
        return;
      }

      setCompanyName("");
      setRequestEmail("");
      setVerificationPurpose("");

      await fetchRecords(statusFilter);
    } catch {
      setError("Something went wrong while submitting the request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFilterChange(value: string) {
    setStatusFilter(value);
    await fetchRecords(value);
  }

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  New Verification Request
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Submit an employment verification workflow
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Employee Name
                </label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Verifying Company
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Request Email
                </label>
                <input
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="verification@company.com"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Verification Purpose
                </label>
                <textarea
                  value={verificationPurpose}
                  onChange={(e) => setVerificationPurpose(e.target.value)}
                  placeholder="Explain the purpose of this verification"
                  className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Verification"}
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Employment Verification Requests
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Track submitted employment verification workflows
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
                  Loading verification requests...
                </div>
              ) : records.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
                  No employment verification requests found.
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {record.companyName}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {record.verificationPurpose}
                          </p>

                          <div className="mt-3">
                            <StatusBadge value={record.status} />
                          </div>
                        </div>

                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          <p>
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              Employee:
                            </span>{" "}
                            {record.employeeName}
                          </p>
                          <p className="mt-1">
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              Email:
                            </span>{" "}
                            {record.requestEmail}
                          </p>
                          <p className="mt-1">
                            {new Date(record.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {record.hrNotes ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          <span className="font-medium">HR Notes:</span> {record.hrNotes}
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