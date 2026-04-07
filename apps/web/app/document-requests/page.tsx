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
  employee: {
    name: string;
  };
};

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    COMPLETED: "bg-green-100 text-green-700",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${styles[value]}`}>
      {value}
    </span>
  );
}

function UrgencyBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${styles[value]}`}>
      {value}
    </span>
  );
}

export default function DocumentRequestsPage() {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [documentType, setDocumentType] = useState("Employment Letter");
  const [purpose, setPurpose] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("MEDIUM");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadUser() {
    const res = await fetch("/api/auth/me");

    if (!res.ok) return;

    const user = await res.json();
    setEmployeeId(user.id);
  }

  async function loadRequests() {
    try {
      const res = await fetch("/api/document-requests");

      if (!res.ok) return;

      const data = await res.json();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
    loadRequests();
  }, []);

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);

    await fetch("/api/document-requests", {
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

    setPurpose("");
    setUrgencyLevel("MEDIUM");

    await loadRequests();

    setSubmitting(false);
  }

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-3">

        {/* CREATE REQUEST */}
        <div>
          <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900">

            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-5 h-5" />
              <h1 className="font-semibold">New Document Request</h1>
            </div>

            <form onSubmit={createRequest} className="space-y-4">

              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full border rounded-xl p-3 dark:bg-slate-950"
              >
                <option>Employment Letter</option>
                <option>Salary Certificate</option>
                <option>Experience Letter</option>
                <option>Offer Letter Copy</option>
                <option>Relieving Letter</option>
              </select>

              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Explain why you need this document"
                className="w-full border rounded-xl p-3 dark:bg-slate-950"
                required
              />

              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value)}
                className="w-full border rounded-xl p-3 dark:bg-slate-950"
              >
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>URGENT</option>
              </select>

              <button
                disabled={submitting}
                className="w-full bg-indigo-600 text-white rounded-xl p-3"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>

            </form>
          </div>
        </div>

        {/* REQUEST LIST */}
        <div className="xl:col-span-2">

          <div className="rounded-2xl border p-6 bg-white dark:bg-slate-900">

            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5" />
              <h2 className="font-semibold">Document Requests</h2>
            </div>

            {loading ? (
              <p>Loading requests...</p>
            ) : requests.length === 0 ? (
              <p>No document requests found.</p>
            ) : (
              <div className="space-y-4">

                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800"
                  >
                    <h3 className="font-semibold">{request.documentType}</h3>

                    <p className="text-sm mt-1">{request.purpose}</p>

                    <div className="flex gap-2 mt-3">
                      <UrgencyBadge value={request.urgencyLevel} />
                      <StatusBadge value={request.status} />
                    </div>

                    <div className="text-sm text-gray-500 mt-2">
                      {request.employee?.name}
                    </div>

                    {request.documentUrl && (
                      <a
                        href={request.documentUrl}
                        target="_blank"
                        className="text-indigo-600 text-sm mt-3 inline-block"
                      >
                        Download Document
                      </a>
                    )}

                  </div>
                ))}

              </div>
            )}

          </div>

        </div>

      </div>
    </AppShell>
  );
}
