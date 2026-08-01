"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardStats, ApiError } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import StatTile from "@/components/dashboard/StatTile";
import { BuildingIcon, FolderIcon, TasksIcon, ClockIcon, FlagIcon } from "@/components/dashboard/layout/icons";

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
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load dashboard stats"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.resolve().then(load);
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900 dark:text-white">
        Welcome back{user ? `, ${user.name}` : ""}
      </h1>
      <p className="mb-6 text-sm text-zinc-500">Here&apos;s what&apos;s happening across your workspaces.</p>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : !stats ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600">{loadError || "Could not load dashboard stats."}</p>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
    </div>
  );
}
