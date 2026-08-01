import type { Role } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  user_avatar: string | null;
  role: Role;
}

export interface Member {
  id: number;
  role: "owner" | "admin" | "member";
  user: User;
  created_at: string;
}

export interface Workspace {
  id: number;
  workspace_name: string;
  owner?: User;
  boards?: Board[];
  members?: Member[];
  boards_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: number;
  workspace_id: number;
  board_name: string;
  board_details: string | null;
  owner?: User;
  columns?: Column[];
  columns_count?: number;
  labels?: Label[];
  members?: Member[];
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
  tasks?: Task[];
}

export type Priority = "low" | "medium" | "high" | "critical";
export type TaskStatus =
  | "Todo"
  | "Inprogress"
  | "Inreview"
  | "Done"
  | "Cancelled"
  | "Onhold";

export interface Task {
  id: number;
  board_id: number;
  board_column: number;
  task_title: string;
  task_details: string;
  position: number;
  task_duedate: string | null;
  priority: Priority;
  task_status: TaskStatus;
  creator?: User;
  assignee?: User | null;
  labels?: Label[];
  comments?: Comment[];
  comments_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: number;
  board_id: number;
  name: string;
  colors: string;
}

export interface Comment {
  id: number;
  task_id: number;
  comment_text: string;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: number;
  action: string;
  details: string | null;
  properties: Record<string, unknown> | null;
  subject_type: string;
  subject_id: number;
  user: User | null;
  created_at: string;
}

export interface PaginatedActivityLogs {
  data: ActivityLogEntry[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface DashboardStats {
  workspaces_count: number;
  boards_count: number;
  tasks_count: number;
  overdue_tasks_count: number;
  my_assigned_tasks_count: number;
}

export interface WorkspaceAnalytics {
  total_tasks: number;
  status_breakdown: Partial<Record<TaskStatus, number>>;
  priority_breakdown: Partial<Record<Priority, number>>;
  overdue_tasks_count: number;
  workload_by_assignee: { user: User; count: number }[];
}
