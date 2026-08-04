import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 py-12 dark:from-gray-950 dark:to-gray-900 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-sm shadow-emerald-900/20">
            K
          </div>
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">Kanban</span>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-gray-900 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
