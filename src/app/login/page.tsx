"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { Button, Input, Card } from "@/components/ui";

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

  async function handleDemoLogin(email: string) {
    setError(null);
    setSubmitting(true);

    try {
      await login({ email, password: "password123" });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary-light">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="8" width="16" height="11" rx="2" stroke="#7C5CFF" strokeWidth="1.5" />
              <path d="M11 3L3 8H19L11 3Z" fill="#7C5CFF" fillOpacity="0.1" stroke="#7C5CFF" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Sign in to your account to continue.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            {error && (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" loading={submitting} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-2 text-xs text-text-secondary">
                  Quick demo access
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((creds) => (
                <button
                  key={creds.email}
                  onClick={() => handleDemoLogin(creds.email)}
                  disabled={submitting}
                  className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-text-secondary transition hover:border-primary hover:bg-primary-light hover:text-primary disabled:opacity-40"
                >
                  {creds.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary-hover">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
