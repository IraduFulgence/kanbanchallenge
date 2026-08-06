
"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AuthInput } from "./AuthInput";
export default function LoginComponent(){
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
        await login(email, password);
        router.push("/dashboard/home");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
        console.log(err);
      } finally {
        setLoading(false);
      }
    }

    return (
      <div>
        <h1 className="mb-6 text-center text-xl font-semibold text-zinc-900 dark:text-white">
          Sign in to your account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthInput
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          {/* hide register route for security  */}
          {/* <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Need an account?{" "}
            <Link href="/auth/register" className="font-medium text-emerald-700 dark:text-emerald-400">
              Create one
            </Link>
          </p> */}
        </form>
      </div>
    );
  }
