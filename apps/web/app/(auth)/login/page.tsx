"use client";

import { useState } from "react";
import { Building2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@corp.dejoiy.com");
  const [password, setPassword] = useState("Jaymaakaali@321");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDevLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function handleSSOLogin() {
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM;
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "dejoiy-portal";
    const redirectUri = `${window.location.origin}/dashboard`;

    if (!keycloakUrl || !realm) {
      setError("SSO is not configured. Please contact administrator.");
      return;
    }

    const authUrl =
      `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&scope=openid profile email` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = authUrl;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950">
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-900 p-10 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-indigo-500 blur-3xl" />
          <div className="absolute right-10 top-24 h-72 w-72 rounded-full bg-cyan-500 blur-3xl" />
          <div className="absolute bottom-10 left-24 h-64 w-64 rounded-full bg-fuchsia-500 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
            <Building2 className="h-8 w-8" />
            <span className="text-lg font-semibold">DEJOIY Enterprise</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight">
            Welcome to DEJOIY Enterprise Service Portal
          </h1>

          <p className="mt-6 text-lg text-slate-200">
            Unified internal platform for IT support, HR requests, employment
            verification, background checks, learning resources, and enterprise
            administration.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <ShieldCheck className="mb-3 h-6 w-6 text-cyan-300" />
              <p className="font-semibold">Secure SSO Access</p>
              <p className="mt-1 text-sm text-slate-200">
                Enterprise-grade authentication with Keycloak and role-based access.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <LockKeyhole className="mb-3 h-6 w-6 text-indigo-300" />
              <p className="font-semibold">Centralized Workflows</p>
              <p className="mt-1 text-sm text-slate-200">
                Manage service tickets, documents, verifications, and learning in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
              <Building2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome to DEJOIY Enterprise Service Portal
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in with SSO or use local development login
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <button
            onClick={handleSSOLogin}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-700"
          >
            <ShieldCheck className="h-5 w-5" />
            Sign in with SSO
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                Development Login
              </span>
            </div>
          </div>

          <form onSubmit={handleDevLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                  placeholder="admin@corp.dejoiy.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            <p className="font-semibold">Default Admin Credentials</p>
            <p className="mt-1">Email: admin@corp.dejoiy.com</p>
            <p>Password: Jaymaakaali@321</p>
          </div>
        </div>
      </div>
    </div>
  );
}