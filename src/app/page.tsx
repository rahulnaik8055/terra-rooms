"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/providers/AuthProvider";

export default function HomePage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-bg px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary-light">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="10" width="20" height="14" rx="2" stroke="#7C5CFF" strokeWidth="1.5" />
            <path d="M14 4L4 10H24L14 4Z" fill="#7C5CFF" fillOpacity="0.1" stroke="#7C5CFF" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M14 17V14" stroke="#7C5CFF" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="14" cy="20" r="1" fill="#7C5CFF" />
          </svg>
        </div>
        <h1 className="text-[40px] font-bold leading-tight tracking-tight text-text">
          Property due diligence,<br />collaborative by design.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-text-secondary">
          Terra Rooms brings buyers, sellers, banks, lawyers, and brokers into a
          single workspace. Each role sees the data they need — nothing more,
          nothing less.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Get started
          </Link>
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-base font-medium text-text transition hover:border-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
