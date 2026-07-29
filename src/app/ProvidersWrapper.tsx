"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext, AuthProvider } from "@/providers/AuthProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { Button, Badge } from "@/components/ui";

function NavBar() {
  const { user, loading, logout } = useAuthContext();
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-sm font-semibold tracking-tight text-text"
        >
          Terra Rooms
        </Link>

        {loading ? null : user ? (
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden min-w-0 truncate text-sm text-text-secondary sm:block">
              {user.email}
            </span>
            <Badge variant="primary" className="shrink-0">{user.role}</Badge>
            <Button variant="ghost" size="sm" onClick={logout} className="shrink-0">
              Sign out
            </Button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Sign in
          </Link>
        )}
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
