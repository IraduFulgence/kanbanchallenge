"use client";

import { useEffect, useState } from "react";
import { getMySpaces, inviteMember, ApiError } from "@/lib/api";
import type { Workspace, User } from "@/lib/types";
import Modal from "@/components/dashboard/Modal";

export default function AddToWorkspaceModal({
  user,
  onClose,
  onAdded,
}: {
  user: User;
  onClose: () => void;
  onAdded: (workspaceName: string) => void;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMySpaces()
      .then((res) => {
        setWorkspaces(res.data);
        setWorkspaceId(res.data[0]?.id ?? null);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Could not load workspaces"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) return;
    setError("");
    setSaving(true);
    try {
      await inviteMember(workspaceId, user.email);
      const workspace = workspaces.find((w) => w.id === workspaceId);
      onAdded(workspace?.workspace_name ?? "workspace");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add to workspace");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Add ${user.name} to a workspace`} onClose={onClose}>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading your workspaces…</p>
      ) : workspaces.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {loadError || "You don't have any workspaces to add them to."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Workspace
            </label>
            <select
              value={workspaceId ?? ""}
              onChange={(e) => setWorkspaceId(Number(e.target.value))}
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.workspace_name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add to workspace"}
          </button>
        </form>
      )}
    </Modal>
  );
}
