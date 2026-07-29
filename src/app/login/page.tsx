"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuthContext } from "@/providers/AuthProvider";

const DEMO_CREDENTIALS = [
  { label: "Buyer", email: "buyer@test.com" },
  { label: "Seller", email: "seller@test.com" },
  { label: "Bank", email: "bank@test.com" },
  { label: "Lawyer", email: "lawyer@test.com" },
  { label: "Broker", email: "broker@test.com" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(creds: { label: string; email: string }) {
    setError(null);
    setSubmitting(true);
    setEmail(creds.email);
    setPassword("password123");

    try {
      await login({ email: creds.email, password: "password123" });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your credentials to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs text-zinc-400">
              <span className="bg-gradient-to-b from-zinc-50 to-white px-2">Quick demo access</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {DEMO_CREDENTIALS.map((creds) => (
              <button
                key={creds.email}
                onClick={() => handleDemoLogin(creds)}
                disabled={submitting}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900 disabled:opacity-50"
              >
                {creds.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-zinc-900 hover:underline">
            Register
          </Link>
        </p>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-medium text-zinc-600">All demo accounts</p>
          <p className="mt-1 text-xs text-zinc-400">
            Password: <span className="font-mono">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
