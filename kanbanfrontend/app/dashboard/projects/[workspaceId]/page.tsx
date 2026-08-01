"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getWorkspace, getWorkspaceAnalytics, createBoard, inviteMember, ApiError } from "@/lib/api";
import type { Workspace, WorkspaceAnalytics, TaskStatus, Priority } from "@/lib/types";
import Modal from "@/components/dashboard/Modal";
import { AuthInput } from "@/components/auth/AuthInput";
import StatTile from "@/components/dashboard/StatTile";
import BreakdownBar from "@/components/dashboard/BreakdownBar";
import {
  PlusIcon,
  TrashIcon,
  UsersIcon,
  FolderIcon,
  TasksIcon,
  ClockIcon,
} from "@/components/dashboard/layout/icons";
import { columnColor } from "@/lib/columnColors";

const STATUS_ORDER: TaskStatus[] = ["Todo", "Inprogress", "Inreview", "Done", "Cancelled", "Onhold"];
const STATUS_COLOR: Record<TaskStatus, string> = {
  Todo: "bg-zinc-400",
  Inprogress: "bg-blue-500",
  Inreview: "bg-violet-500",
  Done: "bg-emerald-500",
  Cancelled: "bg-rose-400",
  Onhold: "bg-amber-500",
};

const PRIORITY_ORDER: Priority[] = ["low", "medium", "high", "critical"];
const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-zinc-400",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  critical: "bg-red-500",
};

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [analytics, setAnalytics] = useState<WorkspaceAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");

  function load() {
    setLoading(true);
    setLoadError("");
    getWorkspace(Number(workspaceId))
      .then((res) => setWorkspace(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load workspace"))
      .finally(() => setLoading(false));
  }

  function loadAnalytics() {
    setAnalyticsError("");
    getWorkspaceAnalytics(Number(workspaceId))
      .then((res) => setAnalytics(res.data))
      .catch((err) =>
        setAnalyticsError(err instanceof ApiError ? err.message : "Could not load task analytics")
      );
  }

  useEffect(() => {
    Promise.resolve().then(load);
    Promise.resolve().then(loadAnalytics);
  }, [workspaceId]);

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;

  if (!workspace) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{loadError || "Workspace not found."}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const isOwner = workspace.owner?.id === user?.id;
  const canManage = user?.role === "admin" || user?.role === "project_manager";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            {workspace.workspace_name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {(workspace.members?.length ?? 0) + 1} member
            {(workspace.members?.length ?? 0) + 1 === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <UsersIcon className="h-4 w-4" />
              Invite member
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateBoard(true)}
              className="flex items-center gap-2 rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              <PlusIcon className="h-4 w-4" />
              New board
            </button>
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {workspace.owner && (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {workspace.owner.name} · Owner
          </span>
        )}
        {workspace.members?.map((member) => (
          <span
            key={member.id}
            className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {member.user.name}
          </span>
        ))}
      </div>

      {!workspace.boards || workspace.boards.length === 0 ? (
        <p className="text-sm text-zinc-500">No boards yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspace.boards.map((board) => (
            <Link
              key={board.id}
              href={`/dashboard/projects/${workspace.id}/boards/${board.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-gray-900 dark:hover:border-zinc-600"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <FolderIcon className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-zinc-900 dark:text-white">{board.board_name}</h3>
              {board.board_details && (
                <p className="mt-1 truncate text-sm text-zinc-500">{board.board_details}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {analytics && analytics.total_tasks > 0 && (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Task analytics</h2>

          <div className="mb-6 grid grid-cols-2 gap-4 sm:w-1/2">
            <StatTile icon={TasksIcon} label="Total tasks" value={analytics.total_tasks} />
            <StatTile icon={ClockIcon} label="Overdue" value={analytics.overdue_tasks_count} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-500">Status breakdown</h3>
              <BreakdownBar
                rows={STATUS_ORDER.map((status) => ({
                  label: status,
                  count: analytics.status_breakdown[status] ?? 0,
                  colorClass: STATUS_COLOR[status],
                }))}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-500">Priority breakdown</h3>
              <BreakdownBar
                rows={PRIORITY_ORDER.map((priority) => ({
                  label: priority,
                  count: analytics.priority_breakdown[priority] ?? 0,
                  colorClass: PRIORITY_COLOR[priority],
                }))}
              />
            </div>
          </div>

          {analytics.workload_by_assignee.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-zinc-500">Workload by assignee</h3>
              <div className="flex flex-wrap gap-3">
                {analytics.workload_by_assignee.map(({ user: assignee, count }) => (
                  <div
                    key={assignee.id}
                    className="flex items-center gap-2 rounded-full bg-zinc-100 py-1 pl-1 pr-3 dark:bg-zinc-800"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-medium text-white">
                      {assignee.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      {assignee.name}
                    </span>
                    <span className="text-xs text-zinc-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {analyticsError && <p className="mt-4 text-sm text-red-600">{analyticsError}</p>}

      {showInvite && (
        <InviteMemberModal
          workspaceId={workspace.id}
          onClose={() => setShowInvite(false)}
          onInvited={(updated) => {
            setWorkspace(updated);
            setShowInvite(false);
          }}
        />
      )}

      {showCreateBoard && (
        <CreateBoardModal
          workspaceId={workspace.id}
          onClose={() => setShowCreateBoard(false)}
          onCreated={(board) => {
            setWorkspace((prev) =>
              prev ? { ...prev, boards: [board, ...(prev.boards ?? [])] } : prev
            );
            setShowCreateBoard(false);
          }}
        />
      )}
    </div>
  );
}

function InviteMemberModal({
  workspaceId,
  onClose,
  onInvited,
}: {
  workspaceId: number;
  onClose: () => void;
  onInvited: (workspace: Workspace) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await inviteMember(workspaceId, email);
      onInvited(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not invite member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Invite member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          {saving ? "Inviting…" : "Send invite"}
        </button>
      </form>
    </Modal>
  );
}

function CreateBoardModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: number;
  onClose: () => void;
  onCreated: (board: import("@/lib/types").Board) => void;
}) {
  const [boardName, setBoardName] = useState("");
  const [boardDetails, setBoardDetails] = useState("");
  const [columns, setColumns] = useState(["Todo", "In Progress", "Done"]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateColumn(index: number, value: string) {
    setColumns((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  function removeColumn(index: number) {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanColumns = columns.map((c) => c.trim()).filter(Boolean);
    if (cleanColumns.length === 0) {
      setError("Add at least one column");
      return;
    }

    setSaving(true);
    try {
      const res = await createBoard(workspaceId, {
        board_name: boardName,
        board_details: boardDetails || undefined,
        columns: cleanColumns,
      });
      onCreated(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create board");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New board" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Board name"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          autoFocus
        />
        <AuthInput
          label="Description (optional)"
          value={boardDetails}
          onChange={(e) => setBoardDetails(e.target.value)}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Columns
          </label>
          {columns.map((column, index) => {
            const color = columnColor(index);
            return (
              <div key={index} className="flex items-center gap-2">
                <span className={`h-3 w-3 shrink-0 rounded-full ${color.dot}`} />
                <input
                  value={column}
                  onChange={(e) => updateColumn(index, e.target.value)}
                  className="h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
                />
                <button
                  type="button"
                  aria-label="Remove column"
                  onClick={() => removeColumn(index)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setColumns((prev) => [...prev, ""])}
            className="flex items-center gap-1 text-sm font-medium text-green-900 hover:underline dark:text-green-500"
          >
            <PlusIcon className="h-4 w-4" />
            Add column
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create board"}
        </button>
      </form>
    </Modal>
  );
}
