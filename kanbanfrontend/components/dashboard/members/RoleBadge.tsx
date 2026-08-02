import type { Role } from "@/lib/api";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  member: "Member",
};

const ROLE_STYLE: Record<Role, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  project_manager: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  member: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function RoleBadge({ role, className = "" }: { role: Role; className?: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[role]} ${className}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

export function OwnerBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ${className}`}
    >
      Owner
    </span>
  );
}
