"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BookOpen, Search, GraduationCap } from "lucide-react";

type LearningArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export default function LearningCenterPage() {
  const [articles, setArticles] = useState<LearningArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<LearningArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function fetchArticles() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/learning");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch learning articles");
        setLoading(false);
        return;
      }

      setArticles(data);
      setFilteredArticles(data);
    } catch {
      setError("Something went wrong while loading learning content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchArticles();
  }, []);

  function handleSearch(value: string) {
    setQuery(value);

    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      setFilteredArticles(articles);
      return;
    }

    const filtered = articles.filter((article) => {
      return (
        article.title.toLowerCase().includes(normalized) ||
        (article.excerpt || "").toLowerCase().includes(normalized) ||
        article.content.toLowerCase().includes(normalized) ||
        (article.author?.name || "").toLowerCase().includes(normalized)
      );
    });

    setFilteredArticles(filtered);
  }

  return (
    <AppShell>
      <div className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-900 p-8 text-white shadow-xl">
        <div className="relative">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-cyan-500/30 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                  DEJOIY Knowledge Hub
                </p>
                <h1 className="mt-1 text-3xl font-bold">
                  Learning Center
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-slate-200">
              Access internal guides, onboarding resources, self-service tutorials,
              troubleshooting knowledge, and enterprise process documentation.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center rounded-2xl border border-slate-300 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800/70">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search guides, tutorials, onboarding, troubleshooting..."
            className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading learning articles...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No learning articles found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                <BookOpen className="h-5 w-5" />
              </div>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {article.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {article.excerpt || article.content.slice(0, 160)}
                {(article.excerpt || article.content).length > 160 ? "..." : ""}
              </p>

              <div className="mt-5 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Author:
                  </span>{" "}
                  {article.author?.name || "System"}
                </p>
                <p>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Published:
                  </span>{" "}
                  {new Date(article.createdAt).toLocaleDateString()}
                </p>
              </div>

              <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <summary className="cursor-pointer text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  Read article
                </summary>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {article.content}
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
