"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { XIcon } from "./icons";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:border-r md:border-zinc-200">
        <Sidebar />
      </div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close menu"
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] border-r border-zinc-200 bg-white shadow-xl">
            <div className="flex justify-end p-2">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-col md:pl-64">
        <Topbar onOpenMenu={() => setOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
