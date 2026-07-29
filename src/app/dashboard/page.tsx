"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">Terra Rooms</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">
            {user.name} ({user.role})
          </span>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-2xl font-semibold text-zinc-900">Dashboard</h2>
        <p className="mt-2 text-zinc-500">
          Welcome back, {user.name}. You are logged in as{" "}
          <span className="font-medium text-zinc-700">{user.role}</span>.
        </p>
      </main>
    </div>
  );
}
