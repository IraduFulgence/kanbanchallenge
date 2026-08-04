"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/api";
import {
  ChartBarIcon,
  FolderIcon,
  GearIcon,
  HomeIcon,
  TasksIcon,
  UsersIcon,
} from "./icons";

type NavItem = { href: string; label: string; icon: typeof HomeIcon };

const HOME: NavItem = { href: "/dashboard/home", label: "Home", icon: HomeIcon };
const PROJECTS: NavItem = { href: "/dashboard/projects", label: "Working space", icon: FolderIcon };
const TASKS: NavItem = { href: "/dashboard/tasks", label: "My Tasks", icon: TasksIcon };
const REPORTS: NavItem = { href: "/dashboard/reports", label: "Reports", icon: ChartBarIcon };
const EMPLOYEES: NavItem = { href: "/dashboard/team", label: "Team", icon: UsersIcon };

const ROLE_NAV: Record<Role, NavItem[]> = {
  admin: [
    HOME,
    PROJECTS,
    EMPLOYEES,
    
    REPORTS,
    { href: "/dashboard/profile", label: "Profile", icon: GearIcon },
  ],
  project_manager: [HOME, PROJECTS, EMPLOYEES, TASKS,{ href: "/dashboard/profile", label: "Profile", icon: GearIcon },],
  member: [HOME, TASKS, PROJECTS,{ href: "/dashboard/profile", label: "Profile", icon: GearIcon },],
};

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const nav = user ? ROLE_NAV[user.role] : [HOME];

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 dark:text-white">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          K
        </div>
        <span className="truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">{user?.name}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
