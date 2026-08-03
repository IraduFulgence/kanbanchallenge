"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateMyProfile, ApiError } from "@/lib/api";
import type { Role } from "@/lib/api";
import { AuthInput } from "@/components/auth/AuthInput";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  member: "Team Member",
};

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xl font-medium text-white dark:bg-gray-800">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileNotice("");
    setSavingProfile(true);
    try {
      const res = await updateMyProfile({ name, email, phone });
      updateUser(res.data);
      setProfileNotice("Profile updated.");
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordNotice("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await updateMyProfile({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      updateUser(res.data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice("Password changed.");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Could not change password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">My Profile</h1>
        <p className="mt-1 text-sm text-zinc-500">View and update your account details.</p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <Avatar name={user.name} />
        <div>
          <p className="text-lg font-medium text-zinc-900 dark:text-white">{user.name}</p>
          <p className="text-sm text-zinc-500">{user.email}</p>
          <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-white">
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Account details</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <AuthInput label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <AuthInput
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthInput label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          {profileNotice && <p className="text-sm text-emerald-600">{profileNotice}</p>}
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <AuthInput
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <AuthInput
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <AuthInput
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordNotice && <p className="text-sm text-emerald-600">{passwordNotice}</p>}
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {savingPassword ? "Saving…" : "Change password"}
          </button>
        </form>
      </section>
    </div>
  );
}
