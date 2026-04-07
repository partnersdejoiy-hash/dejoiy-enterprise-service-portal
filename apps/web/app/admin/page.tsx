"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  Shield,
  Users,
  UserCog,
  Activity,
  Search,
  Power,
} from "lucide-react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
  role: string;
  isActive: boolean;
  avatarUrl?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
};

function RoleBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    EMPLOYEE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    TEAM_LEAD: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    HR: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    IT_SUPPORT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    ADMIN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[value] || "bg-slate-100 text-slate-700"
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      }`}
    >
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterActive, setFilterActive] = useState("");

  async function fetchUsers(params?: {
    query?: string;
    role?: string;
    isActive?: string;
  }) {
    try {
      setLoading(true);
      setError("");

      const searchParams = new URLSearchParams();

      if (params?.query) searchParams.set("query", params.query);
      if (params?.role) searchParams.set("role", params.role);
      if (params?.isActive) searchParams.set("isActive", params.isActive);

      const url = searchParams.toString()
        ? `/api/admin/users?${searchParams.toString()}`
        : "/api/admin/users";

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch users");
        setLoading(false);
        return;
      }

      setUsers(data);
    } catch {
      setError("Something went wrong while loading admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await fetchUsers({
      query,
      role: filterRole,
      isActive: filterActive,
    });
  }

  async function handleDeactivate(userId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this user?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to deactivate user");
        return;
      }

      await fetchUsers({
        query,
        role: filterRole,
        isActive: filterActive,
      });
    } catch {
      setError("Something went wrong while deactivating the user.");
    }
  }

  return (
    <AppShell>
      <div className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-cyan-900 p-8 text-white shadow-xl">
        <div className="relative">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-cyan-500/30 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                  DEJOIY Administration
                </p>
                <h1 className="mt-1 text-3xl font-bold">Admin Control Center</h1>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-slate-200">
              Manage enterprise users, role assignments, account lifecycle, and
              access governance from a centralized administration workspace.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 inline-flex rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {users.length}
          </h3>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Activity className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Active Users</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {users.filter((user) => user.isActive).length}
          </h3>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 inline-flex rounded-2xl bg-cyan-100 p-3 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300">
            <UserCog className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Admins + IT</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {
              users.filter(
                (user) => user.role === "ADMIN" || user.role === "IT_SUPPORT"
              ).length
            }
          </h3>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 inline-flex rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
            <Power className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Inactive Users</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {users.filter((user) => !user.isActive).length}
          </h3>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form
          onSubmit={handleSearch}
          className="mb-6 grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr_auto]"
        >
          <div className="flex items-center rounded-2xl border border-slate-300 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800/70">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, employee ID..."
              className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">All Roles</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="TEAM_LEAD">TEAM LEAD</option>
            <option value="MANAGER">MANAGER</option>
            <option value="HR">HR</option>
            <option value="IT_SUPPORT">IT SUPPORT</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="true">ACTIVE</option>
            <option value="false">INACTIVE</option>
          </select>

          <button
            type="submit"
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 text-left dark:border-slate-800">
                <tr>
                  <th className="pb-4 font-medium text-slate-500">Name</th>
                  <th className="pb-4 font-medium text-slate-500">Email</th>
                  <th className="pb-4 font-medium text-slate-500">Employee ID</th>
                  <th className="pb-4 font-medium text-slate-500">Department</th>
                  <th className="pb-4 font-medium text-slate-500">Role</th>
                  <th className="pb-4 font-medium text-slate-500">Status</th>
                  <th className="pb-4 font-medium text-slate-500">Created</th>
                  <th className="pb-4 font-medium text-slate-500">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-4 font-medium text-slate-900 dark:text-white">
                      {user.name}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {user.email}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {user.employeeId || "-"}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {user.department?.name || "-"}
                    </td>
                    <td className="py-4">
                      <RoleBadge value={user.role} />
                    </td>
                    <td className="py-4">
                      <StatusBadge active={user.isActive} />
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      {user.isActive ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(user.id)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">No actions</span>
                      )}
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
