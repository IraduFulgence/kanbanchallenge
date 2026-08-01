"use client";

import type { Task } from "@/lib/types";
import { CalendarIcon, FlagIcon } from "@/components/dashboard/layout/icons";

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default function TaskCard({
  task,
  onOpen,
  onDragStart,
}: {
  task: Task;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="cursor-grab space-y-2 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-sm hover:border-zinc-300 active:cursor-grabbing dark:border-zinc-700 dark:bg-gray-800 dark:hover:border-zinc-600"
    >
      <p className="text-sm font-medium text-zinc-900 dark:text-white">{task.task_title}</p>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[task.priority]}`}>
          <FlagIcon className="h-3 w-3" />
          {task.priority}
        </span>
        {task.task_duedate && (
          <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <CalendarIcon className="h-3 w-3" />
            {new Date(task.task_duedate).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.assignee && (
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-medium text-white">
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-zinc-500">{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
}
