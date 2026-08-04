"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getBoard,
  getWorkspace,
  createColumn,
  moveTask,
  deleteColumn,
  deleteBoard,
  ApiError,
} from "@/lib/api";
import type { Board, Column, Task, User } from "@/lib/types";
import { columnColor } from "@/lib/columnColors";
import { PlusIcon, TrashIcon } from "@/components/dashboard/layout/icons";
import TaskCard from "@/components/dashboard/board/TaskCard";
import TaskFormModal from "@/components/dashboard/board/TaskFormModal";
import Modal from "@/components/dashboard/Modal";
import { AuthInput } from "@/components/auth/AuthInput";

export default function BoardPage() {
  const { boardId, workspaceId } = useParams<{ boardId: string; workspaceId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "project_manager";

  const [board, setBoard] = useState<Board | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);
  const [createTaskColumn, setCreateTaskColumn] = useState<Column | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(false);

  function load() {
    setLoading(true);
    setLoadError("");
    Promise.all([getBoard(Number(boardId)), getWorkspace(Number(workspaceId))])
      .then(([boardRes, workspaceRes]) => {
        setBoard(boardRes.data);
        const owner = workspaceRes.data.owner;
        const invited = workspaceRes.data.members?.map((m) => m.user) ?? [];
        const all = owner ? [owner, ...invited] : invited;
        setMembers(all.filter((u, i) => all.findIndex((x) => x.id === u.id) === i));
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load board"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.resolve().then(load);
  }, [boardId, workspaceId]);

  function handleDragStart(e: React.DragEvent, task: Task) {
    e.dataTransfer.setData("text/plain", String(task.id));
    e.dataTransfer.effectAllowed = "move";
  }

  async function handleDrop(e: React.DragEvent, column: Column) {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskId = Number(e.dataTransfer.getData("text/plain"));
    if (!board || !taskId) return;

    const fromColumn = board.columns?.find((c) => c.tasks?.some((t) => t.id === taskId));
    const task = fromColumn?.tasks?.find((t) => t.id === taskId);
    if (!task || fromColumn?.id === column.id) return;

    // move it locally right away, then confirm with the server
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns?.map((c) => {
          if (c.id === fromColumn?.id) {
            return { ...c, tasks: c.tasks?.filter((t) => t.id !== taskId) };
          }
          if (c.id === column.id) {
            return { ...c, tasks: [...(c.tasks ?? []), { ...task, board_column: column.id }] };
          }
          return c;
        }),
      };
    });

    try {
      await moveTask(taskId, column.id);
    } catch {
      // couldn't move it server-side — pull the board back to a known-good state
      setLoadError("Couldn't move that task — showing the last saved state instead.");
      getBoard(Number(boardId)).then((res) => setBoard(res.data));
    }
  }

  function replaceTask(updated: Task) {
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns?.map((c) => ({
          ...c,
          tasks: c.tasks?.map((t) => (t.id === updated.id ? updated : t)),
        })),
      };
    });
  }

  function addTask(column: Column, task: Task) {
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns?.map((c) =>
          c.id === column.id ? { ...c, tasks: [...(c.tasks ?? []), task] } : c
        ),
      };
    });
  }

  function removeTask(taskId: number) {
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns?.map((c) => ({
          ...c,
          tasks: c.tasks?.filter((t) => t.id !== taskId),
        })),
      };
    });
  }

  async function handleDeleteColumn(column: Column) {
    if (!board) return;
    if (!window.confirm(`Delete "${column.name}"? Its tasks are deleted too.`)) return;

    try {
      await deleteColumn(board.id, column.id);
      setBoard((prev) =>
        prev ? { ...prev, columns: prev.columns?.filter((c) => c.id !== column.id) } : prev
      );
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not delete column");
    }
  }

  async function handleDeleteBoard() {
    if (!board) return;
    if (!window.confirm(`Delete "${board.board_name}"? Its columns and tasks go with it.`)) return;

    setDeletingBoard(true);
    try {
      await deleteBoard(board.id);
      router.push(`/dashboard/projects/${workspaceId}`);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not delete board");
      setDeletingBoard(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;

  if (!board) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{loadError || "Board not found."}</p>
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

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-zinc-900 dark:text-white">{board.board_name}</h1>
          {board.board_details && <p className="mt-1 text-sm text-zinc-500">{board.board_details}</p>}
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAddColumn(true)}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <PlusIcon className="h-4 w-4" />
              Add column
            </button>
            <button
              type="button"
              onClick={handleDeleteBoard}
              disabled={deletingBoard}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-red-950/40"
            >
              <TrashIcon className="h-4 w-4" />
              {deletingBoard ? "Deleting…" : "Delete board"}
            </button>
          </div>
        )}
      </div>

      {loadError && <p className="mb-4 text-sm text-red-600">{loadError}</p>}

      <div className="flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
        {board.columns?.map((column) => {
          const color = columnColor(column.position);
          const isDragOver = dragOverColumnId === column.id;
          return (
            <div
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumnId(column.id);
              }}
              onDragLeave={() => setDragOverColumnId((id) => (id === column.id ? null : id))}
              onDrop={(e) => handleDrop(e, column)}
              className={`flex w-[82vw] shrink-0 snap-start flex-col rounded-xl border p-3 sm:w-72 ${color.bg} ${
                isDragOver ? "border-zinc-400 dark:border-zinc-500" : color.border
              }`}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{column.name}</h2>
                <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-black/20 dark:text-zinc-300">
                  {column.tasks?.length ?? 0}
                </span>
                {canManage && (
                  <button
                    type="button"
                    aria-label="Delete column"
                    onClick={() => handleDeleteColumn(column)}
                    className="rounded p-1 text-zinc-500 hover:bg-white/70 hover:text-red-600 dark:hover:bg-black/20"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-2">
                {column.tasks?.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={() => setEditingTask(task)}
                    onDragStart={(e) => handleDragStart(e, task)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCreateTaskColumn(column)}
                className="mt-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-white/70 dark:text-zinc-300 dark:hover:bg-black/20"
              >
                <PlusIcon className="h-4 w-4" />
                Add task
              </button>
            </div>
          );
        })}
      </div>

      {createTaskColumn && (
        <TaskFormModal
          mode="create"
          boardId={board.id}
          columnId={createTaskColumn.id}
          members={members}
          onClose={() => setCreateTaskColumn(null)}
          onSaved={(task) => {
            addTask(createTaskColumn, task);
            setCreateTaskColumn(null);
          }}
        />
      )}

      {editingTask && (
        <TaskFormModal
          mode="edit"
          task={editingTask}
          members={members}
          onClose={() => setEditingTask(null)}
          onSaved={(task) => {
            replaceTask(task);
            setEditingTask(null);
          }}
          onDeleted={(taskId) => {
            removeTask(taskId);
            setEditingTask(null);
          }}
        />
      )}

      {showAddColumn && (
        <AddColumnModal
          boardId={board.id}
          onClose={() => setShowAddColumn(false)}
          onCreated={(column) => {
            setBoard((prev) =>
              prev ? { ...prev, columns: [...(prev.columns ?? []), { ...column, tasks: [] }] } : prev
            );
            setShowAddColumn(false);
          }}
        />
      )}
    </div>
  );
}

function AddColumnModal({
  boardId,
  onClose,
  onCreated,
}: {
  boardId: number;
  onClose: () => void;
  onCreated: (column: Column) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await createColumn(boardId, name);
      onCreated(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create column");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New column" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput label="Column name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create column"}
        </button>
      </form>
    </Modal>
  );
}
