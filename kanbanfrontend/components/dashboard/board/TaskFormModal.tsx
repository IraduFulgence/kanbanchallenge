"use client";

import { useState } from "react";
import { createTask, updateTask, deleteTask, ApiError } from "@/lib/api";
import type { Task, Priority, TaskStatus, User } from "@/lib/types";
import Modal from "@/components/dashboard/Modal";
import { AuthInput } from "@/components/auth/AuthInput";
import { TrashIcon } from "@/components/dashboard/layout/icons";

const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];
const STATUSES: TaskStatus[] = ["Todo", "Inprogress", "Inreview", "Done", "Cancelled", "Onhold"];

type Props =
  | { mode: "create"; boardId: number; columnId: number; members: User[]; onClose: () => void; onSaved: (task: Task) => void }
  | { mode: "edit"; task: Task; members: User[]; onClose: () => void; onSaved: (task: Task) => void; onDeleted: (taskId: number) => void };

export default function TaskFormModal(props: Props) {
  const editing = props.mode === "edit";
  const existing = editing ? props.task : null;

  const [title, setTitle] = useState(existing?.task_title ?? "");
  const [details, setDetails] = useState(existing?.task_details ?? "");
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? "low");
  const [status, setStatus] = useState<TaskStatus>(existing?.task_status ?? "Todo");
  const [dueDate, setDueDate] = useState(existing?.task_duedate?.slice(0, 10) ?? "");
  const [assignedTo, setAssignedTo] = useState(existing?.assignee ? String(existing.assignee.id) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const assigned_to = assignedTo ? Number(assignedTo) : null;
      if (props.mode === "create") {
        const res = await createTask(props.boardId, props.columnId, {
          task_title: title,
          task_details: details,
          priority,
          task_duedate: dueDate || null,
          assigned_to,
        });
        props.onSaved(res.data);
      } else {
        const res = await updateTask(props.task.id, {
          task_title: title,
          task_details: details,
          priority,
          task_status: status,
          task_duedate: dueDate || null,
          assigned_to,
        });
        props.onSaved(res.data);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save task");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (props.mode !== "edit") return;
    if (!window.confirm("Delete this task? This can't be undone.")) return;

    setError("");
    setDeleting(true);
    try {
      await deleteTask(props.task.id);
      props.onDeleted(props.task.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete task");
      setDeleting(false);
    }
  }

  return (
    <Modal title={editing ? "Edit task" : "New task"} onClose={props.onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Details
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {editing && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <AuthInput label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Assignee
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
          >
            <option value="">Unassigned</option>
            {props.members.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || deleting}
            className="flex-1 rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update task" : "Create task"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              aria-label="Delete task"
              className="flex items-center justify-center rounded-lg border border-zinc-300 px-3 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-red-950/40"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
