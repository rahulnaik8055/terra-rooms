"use client";

import Link from "next/link";
import { useAuthContext, AuthProvider } from "@/providers/AuthProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { usePathname } from "next/navigation";

function NavBar() {
  const { user, loading, logout } = useAuthContext();
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-sm font-semibold tracking-tight text-zinc-900"
        >
          Terra Rooms
        </Link>

        <div className="flex items-center gap-4">
          {loading ? null : user ? (
            <>
              <span className="text-xs text-zinc-500">{user.email}</span>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {user.role}
              </span>
              <button
                onClick={logout}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Inner({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();

  return (
    <SocketProvider user={user}>
      <NavBar />
      <main className="flex-1">{children}</main>
    </SocketProvider>
  );
}

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Inner>{children}</Inner>
    </AuthProvider>
  );
}
