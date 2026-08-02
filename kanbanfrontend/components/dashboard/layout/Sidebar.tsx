"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/api";
import {
  BuildingIcon,
  ChartBarIcon,
  FolderIcon,
  GearIcon,
  HomeIcon,
  TasksIcon,
  UsersIcon,
} from "./icons";

type NavItem = { href: string; label: string; icon: typeof HomeIcon };

const HOME: NavItem = { href: "/dashboard/home", label: "Home", icon: HomeIcon };
const PROJECTS: NavItem = { href: "/dashboard/projects", label: "Projects", icon: FolderIcon };
const TASKS: NavItem = { href: "/dashboard/tasks", label: "My Tasks", icon: TasksIcon };
const REPORTS: NavItem = { href: "/dashboard/reports", label: "Reports", icon: ChartBarIcon };
const EMPLOYEES: NavItem = { href: "/dashboard/team", label: "Employees", icon: UsersIcon };

const ROLE_NAV: Record<Role, NavItem[]> = {
  admin: [
    HOME,
    PROJECTS,
    EMPLOYEES,
    { href: "/dashboard/departments", label: "Departments", icon: BuildingIcon },
    REPORTS,
    { href: "/dashboard/settings", label: "Settings", icon: GearIcon },
  ],
  project_manager: [HOME, PROJECTS, EMPLOYEES, TASKS, REPORTS],
  member: [HOME, TASKS, PROJECTS],
};

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const nav = user ? ROLE_NAV[user.role] : [HOME];

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 dark:text-white">
      <div className="flex items-center gap-2 px-6 py-5">
       
        <span className="text-lg font-semibold text-zinc-900 dark:text-white">{user?.name}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium  ${
                active
                  ? "bg-zinc-900 text-gray-900 dark:bg-gray-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-gray-800 dark:text-white dark:hover:text-white"
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
