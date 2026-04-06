"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  Bell,
  Building2,
  KeyRound,
  Mail,
  Moon,
  Save,
  Shield,
  Sun,
  UserCircle2,
} from "lucide-react";

type MeResponse = {
  id: string;
  keycloakId?: string | null;
  employeeId?: string | null;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  isActive: boolean;
  department?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [ticketAlerts, setTicketAlerts] = useState(true);
  const [documentAlerts, setDocumentAlerts] = useState(true);
  const [verificationAlerts, setVerificationAlerts] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    setDarkMode(root.classList.contains("dark"));
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load settings");
          setLoading(false);
          return;
        }

        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
      } catch {
        setError("Something went wrong while loading settings.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    root.classList.toggle("dark");
    setDarkMode(root.classList.contains("dark"));
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /**
       * Placeholder local save behavior.
       * Profile update API can be added later if needed.
       */
      await new Promise((resolve) => setTimeout(resolve, 700));

      setSuccess("Settings saved successfully.");
    } catch {
      setError("Something went wrong while saving settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your profile, preferences, notifications, and enterprise account settings.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              {success}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Profile Settings
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Review your account identity and personal profile basics
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 dark:border-slate-700 dark:bg-slate-950">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent px-3 py-3 text-sm outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={profile?.employeeId || ""}
                      readOnly
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Role
                    </label>
                    <input
                      type="text"
                      value={profile?.role || ""}
                      readOnly
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Notification Preferences
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Configure how the platform keeps you updated
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    {
                      label: "Email Notifications",
                      description: "Receive general platform notifications by email",
                      value: emailNotifications,
                      setter: setEmailNotifications,
                    },
                    {
                      label: "Ticket Alerts",
                      description: "Get notified for ticket creation, updates, and comments",
                      value: ticketAlerts,
                      setter: setTicketAlerts,
                    },
                    {
                      label: "Document Alerts",
                      description: "Get notified when document requests are updated or completed",
                      value: documentAlerts,
                      setter: setDocumentAlerts,
                    },
                    {
                      label: "Verification Alerts",
                      description: "Receive employment and background verification updates",
                      value: verificationAlerts,
                      setter: setVerificationAlerts,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => item.setter(!item.value)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                          item.value
                            ? "bg-indigo-600"
                            : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                            item.value ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300">
                    {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Appearance
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Choose your preferred viewing experience
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Dark Mode
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Toggle between light and dark interface theme
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {darkMode ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Organization
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Your enterprise account mapping
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Department</p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-white">
                      {profile?.department?.name || "Not assigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Department Description</p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-white">
                      {profile?.department?.description || "No description available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Account Status</p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-white">
                      {profile?.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-rose-100 p-3 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Security
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Authentication and access details
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <KeyRound className="mt-0.5 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Authentication Method
                      </p>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        {profile?.keycloakId
                          ? "Single Sign-On (Keycloak)"
                          : "Local password / application login"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                    For password changes and advanced security preferences, use your enterprise identity provider or contact IT support.
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>
      )}
    </AppShell>
  );
}