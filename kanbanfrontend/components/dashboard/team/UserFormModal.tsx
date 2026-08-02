"use client";

import { useState } from "react";
import { createUserAccount, updateUserAccount, ApiError } from "@/lib/api";
import type { Role } from "@/lib/api";
import type { User } from "@/lib/types";
import Modal from "@/components/dashboard/Modal";
import { AuthInput } from "@/components/auth/AuthInput";

export default function UserFormModal({
  mode,
  currentUserRole,
  currentUserId,
  initialUser,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  currentUserRole: Role;
  currentUserId: number;
  initialUser?: User;
  onClose: () => void;
  onSaved: (user: User) => void;
}) {
  const [name, setName] = useState(initialUser?.name ?? "");
  const [email, setEmail] = useState(initialUser?.email ?? "");
  const [phone, setPhone] = useState(initialUser?.phone ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initialUser?.role ?? "member");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // only an admin can pick a role at all — a project_manager creating an
  // account always gets a plain member back regardless of what's sent
  const canPickRole = currentUserRole === "admin";
  const isSelf = mode === "edit" && initialUser?.id === currentUserId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await createUserAccount({ name, email, phone, password, role });
        onSaved(res.data);
      } else {
        const res = await updateUserAccount(initialUser!.id, { name, email, phone, role });
        onSaved(res.data);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={mode === "create" ? "Create user" : "Edit user"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        <AuthInput
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthInput label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        {mode === "create" && (
          <AuthInput
            label="Temporary password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}
        {canPickRole && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={isSelf}
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
            >
              <option value="member">Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="admin">Admin</option>
            </select>
            {isSelf && <p className="text-xs text-zinc-500">You can&apos;t change your own role.</p>}
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "create" ? "Create user" : "Save changes"}
        </button>
      </form>
    </Modal>
  );
}
