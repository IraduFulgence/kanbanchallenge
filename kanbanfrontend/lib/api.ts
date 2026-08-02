// lib/api.ts
import { clearToken, getToken } from "./auth";
import axios from "axios";
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
export type Role = "admin" | "project_manager" | "member";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  userMessage?: string; 

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
    
    
    this.userMessage = this.generateUserMessage(status, message, errors);
  }

  
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }

  
  private generateUserMessage(status: number, message: string, errors?: Record<string, string[]>): string {
    // If there are validation errors, get the first one
    if (errors && Object.keys(errors).length > 0) {
      const firstField = Object.keys(errors)[0];
      if (firstField && errors[firstField]?.length > 0) {
        return errors[firstField][0];
      }
    }

    // Map status codes to user-friendly messages
    switch (status) {
      case 400:
        return message || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 0:
        return 'Network error. Please check your connection.';
      default:
        return message || `Request failed (${status})`;
    }
  }

  
  getAllErrors(): string[] {
    if (this.errors) {
      return Object.values(this.errors).flat();
    }
    return [this.userMessage || this.message];
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

  // Handle 401 Unauthorized
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth/login")) {
      window.location.assign("/auth/login?expired=1");
    }
    throw new ApiError(401, "Session expired");
  }

  
  if (res.status === 422) {
    const body = await res.json().catch(() => ({}));
    
    // Extract errors from Laravel format
    let errors: Record<string, string[]> = {};
    if (body.errors) {
      errors = body.errors;
    } else if (body.message) {
      // If only message exists, convert to errors format
      errors = { general: [body.message] };
    }
    
    throw new ApiError(422, body.message ?? "Validation failed", errors);
  }

 
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    
    let errorMessage = body.message;
    
    // If message is an array 
    if (Array.isArray(errorMessage)) {
      errorMessage = errorMessage[0] || `Request failed (${res.status})`;
    }
    
    // If no message, try error property
    if (!errorMessage && body.error) {
      errorMessage = body.error;
    }
    
    // If still no message, use status text
    if (!errorMessage) {
      errorMessage = res.statusText || `Request failed (${res.status})`;
    }
    
    throw new ApiError(res.status, errorMessage, body.errors);
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


// USER Api


export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
};


// WORKSPACES, BOARDS, COLUMNS, TASKS

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