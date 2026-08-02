"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getWorkspace, removeWorkspaceMember, deleteUserAccount, ApiError } from "@/lib/api";
import type { Workspace, Member } from "@/lib/types";
import { RoleBadge, OwnerBadge } from "@/components/dashboard/members/RoleBadge";
import AddMemberModal from "@/components/dashboard/members/AddMemberModal";
import { ChevronLeftIcon, PlusIcon, TrashIcon } from "@/components/dashboard/layout/icons";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-medium text-white dark:bg-zinc-700">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    setLoadError("");
    getWorkspace(Number(workspaceId))
      .then((res) => setWorkspace(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load workspace"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.resolve().then(load);
  }, [workspaceId]);

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;

  if (!workspace) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{loadError || "Workspace not found."}</p>
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

  const isOwner = workspace.owner?.id === user?.id;
  // mirrors WorkspaceController::canManageMembers on the backend
  const canManageMembers = isOwner || user?.role === "admin" || user?.role === "project_manager";
  const canDeletePermanently = user?.role === "admin";
  const members = workspace.members ?? [];

  async function handleRemoveAccess(member: Member) {
    if (
      !window.confirm(
        `Remove ${member.user.name}'s access to "${workspace!.workspace_name}"? They can be re-invited later.`
      )
    ) {
      return;
    }
    setActionError("");
    setBusyId(member.user.id);
    try {
      const res = await removeWorkspaceMember(workspace!.id, member.user.id);
      setWorkspace(res.data);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not remove access");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeletePermanently(member: Member) {
    if (
      !window.confirm(
        `Permanently delete ${member.user.name}'s account? This removes them from every workspace and can't be undone.`
      )
    ) {
      return;
    }
    setActionError("");
    setBusyId(member.user.id);
    try {
      await deleteUserAccount(member.user.id);
      setWorkspace((prev) =>
        prev ? { ...prev, members: prev.members?.filter((m) => m.user.id !== member.user.id) } : prev
      );
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not delete account");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <Link
        href={`/dashboard/projects/${workspace.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to {workspace.workspace_name}
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Members</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {members.length + 1} {members.length + 1 === 1 ? "person" : "people"} with access to{" "}
            {workspace.workspace_name}
          </p>
        </div>
        {canManageMembers && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            <PlusIcon className="h-4 w-4" />
            Add member
          </button>
        )}
      </div>

      {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/60">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              {canManageMembers && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {workspace.owner && (
              <tr>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <Avatar name={workspace.owner.name} />
                    {workspace.owner.name}
                    {workspace.owner.id === user?.id && (
                      <span className="text-xs text-zinc-400">(you)</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-500">{workspace.owner.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <OwnerBadge />
                    <RoleBadge role={workspace.owner.role} />
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatDate(workspace.created_at)}</td>
                {canManageMembers && <td className="px-4 py-3 text-right text-xs text-zinc-400">—</td>}
              </tr>
            )}
            {members.map((member) => {
              const isSelf = member.user.id === user?.id;
              return (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Avatar name={member.user.name} />
                      {member.user.name}
                      {isSelf && <span className="text-xs text-zinc-400">(you)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{member.user.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.user.role} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{formatDate(member.created_at)}</td>
                  {canManageMembers && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busyId === member.user.id}
                          onClick={() => handleRemoveAccess(member)}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Remove access
                        </button>
                        {canDeletePermanently && !isSelf && (
                          <button
                            type="button"
                            disabled={busyId === member.user.id}
                            onClick={() => handleDeletePermanently(member)}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete permanently
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td
                  colSpan={canManageMembers ? 5 : 4}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No members invited yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && user && (
        <AddMemberModal
          workspaceId={workspace.id}
          currentUserRole={user.role}
          onClose={() => setShowAdd(false)}
          onAdded={(updated) => {
            setWorkspace(updated);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}
