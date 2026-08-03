"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardStats, getActivityLogs, ApiError } from "@/lib/api";
import type { DashboardStats, ActivityLogEntry } from "@/lib/types";
import StatTile from "@/components/dashboard/StatTile";
import { BuildingIcon, FolderIcon, TasksIcon, ClockIcon, FlagIcon } from "@/components/dashboard/layout/icons";

function RecentActivity() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getActivityLogs({ page: 1 })
      .then((res) => setLogs(res.data.data.slice(0, 5)))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load activity"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mt-8 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent activity</h2>
        <Link href="/dashboard/reports" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          View all
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-zinc-500">No activity recorded yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {logs.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate text-zinc-600 dark:text-zinc-300">
                <span className="font-medium text-zinc-900 dark:text-white">{entry.user?.name ?? "—"}</span>{" "}
                {entry.details ?? entry.action}
              </span>
              <span className="shrink-0 text-xs text-zinc-400">{new Date(entry.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  function load() {
    setLoading(true);
    setLoadError("");
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Unable to load data"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.resolve().then(load);
  }, []);

  return (
    <div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : !stats ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600">{loadError || "Unable to load data."}</p>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:bg-gray-900"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile icon={BuildingIcon} label="Workspaces" value={stats.workspaces_count} />
          <StatTile icon={FolderIcon} label="Boards" value={stats.boards_count} />
          <StatTile icon={TasksIcon} label="Tasks" value={stats.tasks_count} />
          <StatTile icon={ClockIcon} label="Overdue tasks" value={stats.overdue_tasks_count} />
          <StatTile icon={FlagIcon} label="Assigned to me" value={stats.my_assigned_tasks_count} />
        </div>
      )}

      {user?.role === "admin" && <RecentActivity />}
    </div>
  );
}
