"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Input, Select, Card } from "@/components/ui";

const ROLES = [
  { value: "BUYER", label: "Buyer" },
  { value: "SELLER", label: "Seller" },
  { value: "BANK", label: "Bank" },
  { value: "LAWYER", label: "Lawyer" },
  { value: "BROKER", label: "Broker" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Registration failed");
      }
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
          <h1 className="text-2xl font-bold text-text">Create an account</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Join Terra Rooms and start collaborating.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Full name" required value={form.name} onChange={update("name")} placeholder="Jane Doe" />

            <Input label="Email" type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" />

            <Input label="Password" type="password" required value={form.password} onChange={update("password")} placeholder="Minimum 8 characters" />

            <Select label="Role" required value={form.role} onChange={update("role")} options={ROLES} placeholder="Select a role" />

            {error && (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" loading={submitting} className="w-full">
              Register
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
