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
    </div>
  );
}
