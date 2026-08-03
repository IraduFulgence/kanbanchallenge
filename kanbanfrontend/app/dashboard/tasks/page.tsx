"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyTasks, updateTask, ApiError } from "@/lib/api";
import type { Task, TaskStatus } from "@/lib/types";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, FlagIcon, TasksIcon } from "@/components/dashboard/layout/icons";

const STATUS_FILTERS: { label: string; value: TaskStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Todo", value: "Todo" },
  { label: "In progress", value: "Inprogress" },
  { label: "In review", value: "Inreview" },
  { label: "Done", value: "Done" },
  { label: "On hold", value: "Onhold" },
  { label: "Cancelled", value: "Cancelled" },
];

const STATUS_OPTIONS: TaskStatus[] = ["Todo", "Inprogress", "Inreview", "Done", "Onhold", "Cancelled"];

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function isOverdue(task: Task): boolean {
  if (!task.task_duedate) return false;
  return new Date(task.task_duedate) < new Date() && !["Done", "Cancelled"].includes(task.task_status);
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  function load() {
    setLoading(true);
    setLoadError("");
    getMyTasks({ page, status: statusFilter || undefined })
      .then((res) => {
        setTasks(res.data.data);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load your tasks"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.resolve().then(load);
  }, [page, statusFilter]);

  async function handleStatusChange(task: Task, status: TaskStatus) {
    setActionError("");
    setBusyId(task.id);
    try {
      const res = await updateTask(task.id, { task_status: status });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...res.data } : t)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update task status");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">My Tasks</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total} task{total === 1 ? "" : "s"} assigned to you across every workspace.
        </p>
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TaskStatus | "");
            setPage(1);
          }}
          className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : loadError ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <TasksIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-500">No tasks assigned to you{statusFilter ? " with this status" : ""}.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {tasks.map((task) => {
              const workspaceName = task.board?.workspace?.workspace_name;
              const boardId = task.board?.id ?? task.board_id;
              const workspaceId = task.board?.workspace?.id ?? task.board?.workspace_id;
              const overdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{task.task_title}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {workspaceName ?? "Workspace"}
                      {task.board?.board_name ? ` · ${task.board.board_name}` : ""}
                      {task.column?.name ? ` · ${task.column.name}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[task.priority]}`}>
                        <FlagIcon className="h-3 w-3" />
                        {task.priority}
                      </span>
                      {task.task_duedate && (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            overdue
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(task.task_duedate).toLocaleDateString()}
                          {overdue ? " (overdue)" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={task.task_status}
                      disabled={busyId === task.id}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className="h-9 rounded-lg border border-zinc-300 bg-white px-2 text-xs font-medium outline-none ring-zinc-950/10 focus:ring-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {boardId && workspaceId && (
                      <Link
                        href={`/dashboard/projects/${workspaceId}/boards/${boardId}`}
                        className="whitespace-nowrap rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Open board
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {lastPage > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 disabled:opacity-40 dark:border-zinc-700"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Prev
              </button>
              <span>
                Page {page} of {lastPage}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 disabled:opacity-40 dark:border-zinc-700"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
