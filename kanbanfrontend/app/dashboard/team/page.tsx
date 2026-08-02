"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUsers, deleteUserAccount, ApiError } from "@/lib/api";
import type { Role } from "@/lib/api";
import type { User } from "@/lib/types";
import { RoleBadge } from "@/components/dashboard/members/RoleBadge";
import UserFormModal from "@/components/dashboard/team/UserFormModal";
import AddToWorkspaceModal from "@/components/dashboard/team/AddToWorkspaceModal";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UsersIcon,
} from "@/components/dashboard/layout/icons";

const ROLE_FILTERS: { label: string; value: Role | "" }[] = [
  { label: "All roles", value: "" },
  { label: "Admin", value: "admin" },
  { label: "Project Manager", value: "project_manager" },
  { label: "Member", value: "member" },
];

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-zinc-700">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TeamPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [addingToWorkspace, setAddingToWorkspace] = useState<User | null>(null);

  function load() {
    setLoading(true);
    setLoadError("");
    getUsers({ page, search: search || undefined, role: roleFilter || undefined })
      .then((res) => {
        setUsers(res.data.data);
        setLastPage(res.data.last_page);
        setTotal(res.data.total);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load users"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (page === 1) {
      load();
    } else {
      setPage(1);
    }
  }

  async function handleDelete(target: User) {
    if (!window.confirm(`Permanently delete ${target.name}'s account? This can't be undone.`)) return;
    setActionError("");
    setBusyId(target.id);
    try {
      await deleteUserAccount(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      setTotal((t) => t - 1);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not delete user");
    } finally {
      setBusyId(null);
    }
  }

  if (!currentUser || currentUser.role === "member") {
    return <p className="text-sm text-red-600">You don&apos;t have permission to view this page.</p>;
  }

  const canEdit = currentUser.role === "admin";
  const canDelete = currentUser.role === "admin";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Employees</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total} registered {total === 1 ? "account" : "accounts"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          <PlusIcon className="h-4 w-4" />
          Create user
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="min-w-[200px] flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
          />
        </form>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as Role | "");
            setPage(1);
          }}
          className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
        >
          {ROLE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}
      {notice && <p className="mb-4 text-sm text-emerald-600">{notice}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : loadError ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {users.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Avatar name={u.name} />
                          {u.name}
                          {isSelf && <span className="text-xs text-zinc-400">(you)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                      <td className="px-4 py-3 text-zinc-500">{u.phone}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setAddingToWorkspace(u)}
                            className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            <UsersIcon className="h-3.5 w-3.5" />
                            Add to workspace
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          )}
                          {canDelete && !isSelf && (
                            <button
                              type="button"
                              disabled={busyId === u.id}
                              onClick={() => handleDelete(u)}
                              className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 disabled:opacity-40 dark:border-zinc-700"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Prev
              </button>
              <span>
                Page {page} of {lastPage}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 disabled:opacity-40 dark:border-zinc-700"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <UserFormModal
          mode="create"
          currentUserRole={currentUser.role}
          currentUserId={currentUser.id}
          onClose={() => setShowCreate(false)}
          onSaved={(created) => {
            setUsers((prev) => [created, ...prev]);
            setTotal((t) => t + 1);
            setShowCreate(false);
          }}
        />
      )}

      {editingUser && (
        <UserFormModal
          mode="edit"
          currentUserRole={currentUser.role}
          currentUserId={currentUser.id}
          initialUser={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            setEditingUser(null);
          }}
        />
      )}

      {addingToWorkspace && (
        <AddToWorkspaceModal
          user={addingToWorkspace}
          onClose={() => setAddingToWorkspace(null)}
          onAdded={(workspaceName) => {
            setNotice(`${addingToWorkspace.name} added to ${workspaceName}.`);
            setAddingToWorkspace(null);
          }}
        />
      )}
    </div>
  );
}
