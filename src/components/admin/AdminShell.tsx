"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminShell({ children, title = "Dashboard" }: AdminShellProps) {
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState("");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const handleRebuild = async () => {
    setRebuilding(true);
    setRebuildMsg("");
    try {
      const res = await fetch("/api/rebuild", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRebuildMsg("Site rebuilt successfully!");
      } else {
        setRebuildMsg(`Build failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      setRebuildMsg("Build request failed");
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--border)] flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-[var(--border)]">
          <h1 className="text-lg font-bold tracking-tight">Studio Admin</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Content Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <a
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </a>
          <a
            href="/admin/works/new"
            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
          >
            <PlusCircle size={16} />
            New Work
          </a>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
          >
            <ExternalLink size={16} />
            View Site
          </a>
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-[var(--border)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            {rebuilding ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Rebuild Site
          </button>
          {rebuildMsg && (
            <p className={`text-[10px] ${rebuildMsg.includes("failed") ? "text-red-500" : "text-green-500"}`}>
              {rebuildMsg}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-[var(--border)] hover:bg-[var(--muted)] transition-colors text-red-500"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] px-8 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
