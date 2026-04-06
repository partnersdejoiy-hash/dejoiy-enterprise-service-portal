"use client";

import { useMemo, useState } from "react";
import { Paperclip, Upload, X } from "lucide-react";

type UploadedAttachment = {
  fileName: string;
  fileUrl: string;
  contentType?: string;
};

type MeResponse = {
  id: string;
  email: string;
  name: string;
  role: string;
  employeeId?: string | null;
  department?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
};

const categories = [
  "HARDWARE",
  "SOFTWARE",
  "NETWORK",
  "VPN",
  "EMAIL",
  "ACCESS_REQUEST",
  "OTHER",
] as const;

const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export function TicketForm() {
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("SOFTWARE");
  const [priority, setPriority] =
    useState<(typeof priorities)[number]>("MEDIUM");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

  const [bootstrapping, setBootstrapping] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useMemo(() => {
    async function loadMe() {
      try {
        setBootstrapping(true);
        const res = await fetch("/api/auth/me");
        const data: MeResponse | { error?: string } = await res.json();

        if (!res.ok) {
          setBootstrapping(false);
          return;
        }

        const me = data as MeResponse;

        setEmployeeId(me.id);
        setContactEmail(me.email);
        setDepartmentId(me.department?.id || "");
      } catch {
        // silent fallback
      } finally {
        setBootstrapping(false);
      }
    }

    loadMe();
  }, []);

  async function handleFileUpload(file: File) {
    setError("");
    setUploading(true);

    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          module: "tickets",
        }),
      });

      const presignData = await presignRes.json();

      if (!presignRes.ok) {
        setError(presignData.error || "Failed to prepare file upload");
        setUploading(false);
        return;
      }

      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        setError("Failed to upload file to storage");
        setUploading(false);
        return;
      }

      setAttachments((prev) => [
        ...prev,
        {
          fileName: presignData.fileName || file.name,
          fileUrl: presignData.fileUrl,
          contentType: file.type || undefined,
        },
      ]);
    } catch {
      setError("Something went wrong while uploading the file.");
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/tickets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          category,
          priority,
          description,
          employeeId,
          departmentId: departmentId || null,
          contactEmail,
          attachments,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create ticket");
        setSubmitting(false);
        return;
      }

      setSuccess(`Ticket ${data.ticketNumber} created successfully`);

      setTitle("");
      setCategory("SOFTWARE");
      setPriority("MEDIUM");
      setDescription("");
      setAttachments([]);

      setTimeout(() => {
        window.location.href = `/tickets/${data.id}`;
      }, 1000);
    } catch {
      setError("Something went wrong while creating the ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {bootstrapping ? (
        <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          Loading user context...
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {success}
        </div>
      ) : null}

      <div className="grid gap-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Ticket Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a clear issue summary"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof categories)[number])
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
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
              onChange={(e) =>
                setPriority(e.target.value as (typeof priorities)[number])
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue, symptoms, error messages, impact, and steps already tried..."
            className="min-h-[180px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Department ID
            </label>
            <input
              type="text"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              placeholder="Auto-filled if available"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Attachments
          </label>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800">
            <Upload className="h-4 w-4" />
            <span>{uploading ? "Uploading..." : "Upload files"}</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.currentTarget.value = "";
              }}
              disabled={uploading}
            />
          </label>

          {attachments.length > 0 ? (
            <div className="mt-4 space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.fileUrl}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {file.contentType || "Unknown file type"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <input type="hidden" value={employeeId} readOnly />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={submitting || bootstrapping}
          className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating Ticket..." : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}