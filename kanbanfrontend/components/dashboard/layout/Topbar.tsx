"use client";

import { usePathname } from "next/navigation";
import { MenuIcon } from "./icons";

import UserMenu from "./UserMenu";

const SECTION_LABELS: { prefix: string; label: string }[] = [
  { prefix: "/dashboard/home", label: "Home" },
  { prefix: "/dashboard/projects", label: "Projects" },
  { prefix: "/dashboard/tasks", label: "My Tasks" },
  { prefix: "/dashboard/team", label: "Employees" },
  { prefix: "/dashboard/departments", label: "Departments" },
  { prefix: "/dashboard/reports", label: "Reports" },
  { prefix: "/dashboard/settings", label: "Settings" },
  { prefix: "/dashboard/profile", label: "My Profile" },
];

function sectionLabel(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  const match = SECTION_LABELS.find((s) => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`));
  return match?.label ?? "Dashboard";
}

export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur sm:gap-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900/80">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <div className="hidden shrink-0 md:block dark:bg-gray-900">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Dashboard</p>
        <p className="text-sm font-semibold text-zinc-900">{sectionLabel(pathname)}</p>
      </div>

      <div className="flex-1" />

      <UserMenu />
    </header>
  );
}
