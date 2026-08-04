"use client";

import { useState } from "react";
import { inviteMember, createUserAccount, ApiError } from "@/lib/api";
import type { Role } from "@/lib/api";
import type { Workspace } from "@/lib/types";
import Modal from "@/components/dashboard/Modal";
import { AuthInput } from "@/components/auth/AuthInput";

export default function AddMemberModal({
  workspaceId,
  currentUserRole,
  onClose,
  onAdded,
}: {
  workspaceId: number;
  currentUserRole: Role;
  onClose: () => void;
  onAdded: (workspace: Workspace) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("member");

  async function invite(targetEmail: string) {
    const res = await inviteMember(workspaceId, targetEmail);
    onAdded(res.data);
  }

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await invite(email);
    } catch (err) {
      if (err instanceof ApiError && err.fieldError("email")) {
        // no account exists for this email yet, create one or ask the user to create one
        setNeedsAccount(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Could not add member");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createUserAccount({ name, email, phone, password, role });
      await invite(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create account");
    } finally {
      setSaving(false);
    }
  }

  if (needsAccount) {
    return (
      <Modal title="Create account & add" onClose={onClose}>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <p className="text-sm text-zinc-500">
            No account exists for{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span>. Create
            one and add them to this workspace?
          </p>
          <AuthInput label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          <AuthInput
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <AuthInput
            label="Temporary password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {currentUserRole === "admin" && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
              >
                <option value="member">Member</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setError("");
                setNeedsAccount(false);
              }}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create & add"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal title="Add member" onClose={onClose}>
      <form onSubmit={handleInviteSubmit} className="space-y-4">
        <AuthInput
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
        <p className="text-xs text-zinc-500">
          If they already have an account, they&apos;ll be added right away. Otherwise
          you&apos;ll be able to create one for them.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add to workspace"}
        </button>
      </form>
    </Modal>
  );
}
