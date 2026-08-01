"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getActivityLogs, ApiError } from "@/lib/api";
import type { PaginatedActivityLogs } from "@/lib/types";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/dashboard/layout/icons";

export default function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [logs, setLogs] = useState<PaginatedActivityLogs | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  function load(pageNumber: number) {
    setLoading(true);
    setLoadError("");
    getActivityLogs({ page: pageNumber })
      .then((res) => setLogs(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load activity logs"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!isAdmin) return;
    Promise.resolve().then(() => load(page));
  }, [isAdmin, page]);

  if (!isAdmin) {
    return (
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-zinc-900 dark:text-white">Reports</h1>
        <p className="text-sm text-zinc-500">Activity logs are only visible to admins.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900 dark:text-white">Activity log</h1>
      <p className="mb-6 text-sm text-zinc-500">Every action taken across the system.</p>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : !logs ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600">{loadError || "Could not load activity logs."}</p>
          <button
            type="button"
            onClick={() => load(page)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Try again
          </button>
        </div>
      ) : logs.data.length === 0 ? (
        <p className="text-sm text-zinc-500">No activity recorded yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.data.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-white">
                      {entry.user?.name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{entry.details ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
            <span>
              Page {logs.current_page} of {logs.last_page} · {logs.total} total
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={logs.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={logs.current_page >= logs.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
