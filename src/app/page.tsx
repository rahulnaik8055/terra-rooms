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
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-white">
      <div className="mx-auto max-w-lg px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Property due diligence,<br />collaborative by design.
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-500">
          Terra Rooms brings buyers, sellers, banks, lawyers, and brokers into a
          single workspace. Each role sees the data they need — nothing more,
          nothing less.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Get started
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
