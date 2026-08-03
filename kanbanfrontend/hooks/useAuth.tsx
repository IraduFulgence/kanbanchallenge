"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Role } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated:boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string; role: Role }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }

    api
      .get<{ data: User }>("/user")
      .then((res) => setUser(res.data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; data: User }>("/auth/login", {
      email,
      password,
    });
    setToken(res.token);
    setUser(res.data);
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; phone: string; password: string; role: Role }) => {
      const res = await api.post<{ token: string; data: User }>("/auth/register", data);
      setToken(res.token);
      setUser(res.data);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch {
      // ignore — we clear client state regardless
    } finally {
      clearToken();
      setUser(null);
      router.push("/auth/login");
    }
  }, [router]);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated:user !==null,user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { ApiError };