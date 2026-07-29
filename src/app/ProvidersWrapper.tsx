"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthContext, AuthProvider } from "@/providers/AuthProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { Button, Badge } from "@/components/ui";

function NavBar() {
  const { user, loading, logout } = useAuthContext();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-sm font-semibold tracking-tight text-text"
        >
          Terra Rooms
        </Link>

        {loading ? null : user ? (
          <>
            <div className="hidden items-center gap-4 sm:flex">
              <span className="text-sm text-text-secondary">{user.email}</span>
              <Badge variant="primary">{user.role}</Badge>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-primary-light hover:text-primary sm:hidden"
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                {mobileOpen ? (
                  <>
                    <path d="M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <path d="M3 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M3 9H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M3 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
            {mobileOpen && (
              <div className="absolute inset-x-0 top-14 border-b border-border bg-surface px-6 py-4 shadow-lg sm:hidden">
                <div className="flex flex-col items-start gap-3">
                  <span className="text-sm text-text-secondary">{user.email}</span>
                  <Badge variant="primary">{user.role}</Badge>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Sign out
                  </Button>
                </div>
              </div>
            )}
          </>
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
