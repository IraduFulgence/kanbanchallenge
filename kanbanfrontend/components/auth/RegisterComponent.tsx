
"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/api";
import { AuthInput } from "./AuthInput";
import AuthLayout from "@/app/auth/layout";

export default function RegisterComponent(){
    const router = useRouter();
    const { register } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("member");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        await register({ name, email, phone, password, role });
        router.push("/dashboard/home");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
        console.log(err);
      } finally {
        setLoading(false);
      }
    }

    return (
      <AuthLayout>
        <form onSubmit={handleSubmit} className="space-y-4 ">
          <AuthInput
            label="Full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <AuthInput
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthInput
            label="Phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <AuthInput
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none ring-zinc-950/10 focus:ring-2 dark:border-zinc-700 dark:bg-gray-900 dark:text-zinc-50"
            >
              <option value="member">Team Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50">
            {loading ? "Creating account…" : "Create account"}
          </button>
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-green-900 dark:text-green-500">
              Sign in
            </Link>
          </p>
        </form>
      </AuthLayout>
    );
  }
