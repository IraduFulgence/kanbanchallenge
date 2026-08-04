"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getMySpaces, createWorkspace, ApiError } from "@/lib/api";
import type { Workspace } from "@/lib/types";
import Modal from "@/components/dashboard/Modal";
import { AuthInput } from "@/components/auth/AuthInput";
import { PlusIcon, BuildingIcon } from "@/components/dashboard/layout/icons";

export default function ProjectsPage() {
  const { user } = useAuth();
  const canCreate = user?.role === "admin" || user?.role === "project_manager";

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    setLoading(true);
    setLoadError("");
    getMySpaces()
      .then((res) => setWorkspaces(res.data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load workspaces"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.resolve().then(load);
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Workspaces</h1>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <PlusIcon className="h-4 w-4" />
            New workspace
          </button>
        )}
      </div>

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
      ) : workspaces.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {canCreate
            ? "You haven't created a workspace yet."
            : "You haven't been invited to a workspace yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/projects/${ws.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-gray-900 dark:hover:border-zinc-600"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <BuildingIcon className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-zinc-900 dark:text-white">{ws.workspace_name}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {ws.boards_count ?? 0} board{ws.boards_count === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={(ws) => {
            setWorkspaces((prev) => [ws, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateWorkspaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await createWorkspace(name);
      onCreated(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create workspace");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New workspace" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create workspace"}
        </button>
      </form>
    </Modal>
  );
}
