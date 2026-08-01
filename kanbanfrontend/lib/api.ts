import { clearToken, getToken } from "./auth";
import type {
  Workspace,
  Board,
  Column,
  Task,
  Priority,
  TaskStatus,
  DashboardStats,
  WorkspaceAnalytics,
  PaginatedActivityLogs,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://kanbanapi.bellatis.com/api";
export type Role = "admin" | "project_manager" | "member";
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(opts.headers);
  headers.set("Accept", "application/json");
  if (opts.body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...opts,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Network error — check your connection and that the API is reachable.");
  }

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login?expired=1");
    }
    throw new ApiError(401, "Session expired");
  }

  if (res.status === 422) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(422, body.message ?? "Validation failed", body.errors);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
// user

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
};

// workspaces, boards, columns, tasks

export function getMySpaces() {
  return api.get<{ data: Workspace[] }>("/working_space/myspace");
}

export function getWorkspace(workspaceId: number) {
  return api.get<{ data: Workspace }>(`/working_space/${workspaceId}`);
}

export function createWorkspace(workspaceName: string) {
  return api.post<{ data: Workspace }>("/working_space/create", {
    workspace_name: workspaceName,
  });
}

export function inviteMember(workspaceId: number, email: string) {
  return api.post<{ data: Workspace }>(`/working_space/${workspaceId}/invite`, { email });
}

export function getBoards(workspaceId: number) {
  return api.get<{ data: Board[] }>(`/working_space/${workspaceId}/boards`);
}

export function createBoard(
  workspaceId: number,
  board: { board_name: string; board_details?: string; columns: string[] }
) {
  return api.post<{ data: Board }>(`/working_space/${workspaceId}/boards`, board);
}

export function getBoard(boardId: number) {
  return api.get<{ data: Board }>(`/boards/${boardId}`);
}

export function createColumn(boardId: number, name: string) {
  return api.post<{ data: Column }>(`/boards/${boardId}/columns`, { name });
}

export function createTask(
  boardId: number,
  columnId: number,
  task: {
    task_title: string;
    task_details: string;
    priority?: Priority;
    task_duedate?: string | null;
    assigned_to?: number | null;
  }
) {
  return api.post<{ data: Task }>(`/boards/${boardId}/columns/${columnId}/tasks`, task);
}

export function updateTask(
  taskId: number,
  task: Partial<{
    task_title: string;
    task_details: string;
    priority: Priority;
    task_status: TaskStatus;
    task_duedate: string | null;
    assigned_to: number | null;
  }>
) {
  return api.patch<{ data: Task }>(`/tasks/${taskId}`, task);
}

export function moveTask(taskId: number, boardColumn: number, position?: number) {
  return api.patch<{ data: Task }>(`/tasks/${taskId}/move`, {
    board_column: boardColumn,
    position,
  });
}

export function deleteTask(taskId: number) {
  return api.delete<{ message: string }>(`/tasks/${taskId}`);
}

export function deleteColumn(boardId: number, columnId: number) {
  return api.delete<{ message: string }>(`/boards/${boardId}/columns/${columnId}`);
}

export function deleteBoard(boardId: number) {
  return api.delete<{ message: string }>(`/boards/${boardId}`);
}

// dashboard, analytics + activity logs

export function getDashboardStats() {
  return api.get<{ data: DashboardStats }>("/dashboard/stats");
}

export function getWorkspaceAnalytics(workspaceId: number) {
  return api.get<{ data: WorkspaceAnalytics }>(`/working_space/${workspaceId}/analytics`);
}

export function getActivityLogs(params?: { user_id?: number; action?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.user_id) query.set("user_id", String(params.user_id));
  if (params?.action) query.set("action", params.action);
  if (params?.page) query.set("page", String(params.page));
  const qs = query.toString();
  return api.get<{ data: PaginatedActivityLogs }>(`/activity-logs${qs ? `?${qs}` : ""}`);
}
