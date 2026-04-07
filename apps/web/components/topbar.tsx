"use client";

import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, Search, UserCircle2 } from "lucide-react";

type CurrentUser = {
  id: string;
  employeeId?: string | null;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

type TopbarProps = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch] = useState("");

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && search.trim() !== "") {
      window.location.href = `/tickets?search=${search}`;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        setLoading(true);

        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const data = await res.json();

        if (!cancelled) {
          setUser(data);
        }
      } catch (error) {
        console.error("Failed to load current user:", error);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        
        {/* LEFT SIDE */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 md:flex dark:border-slate-800 dark:bg-slate-900/80">
            <Search className="h-4 w-4 text-slate-400" />

            <input
              type="text"
              placeholder="Search portal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="w-64 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (window.location.href = "/notifications")}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {loading ? "Loading..." : user?.name || "Unknown User"}
              </p>
              <p className="text-xs text-slate-500">
                {loading ? "Please wait" : user?.role || "No Role"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <UserCircle2 className="h-6 w-6" />
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
