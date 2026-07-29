"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { Button, Input, Select, Card } from "@/components/ui";

const ROLES = [
  { value: "BUYER", label: "Buyer" },
  { value: "SELLER", label: "Seller" },
  { value: "BANK", label: "Bank" },
  { value: "LAWYER", label: "Lawyer" },
  { value: "BROKER", label: "Broker" },
] as const;

interface Property { id: string; address: string; city: string; state: string; surveyNumber: string; }
interface UserResult { id: string; email: string; name: string; role: string; }
interface ParticipantEntry { userId: string; email: string; name: string; role: string; }

export default function CreateRoomPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [name, setName] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [selectedRole, setSelectedRole] = useState("BUYER");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ email: string; name: string; password: string } | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "BUYER") { router.push("/dashboard"); return; }
    fetch("/api/properties").then((r) => r.json()).then(setProperties).catch(() => {});
  }, [user, loading, router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    setLookingUp(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const found: UserResult = await res.json();
        if (participants.some((p) => p.userId === found.id)) {
          setLookupError(`${found.name} is already added`);
          return;
        }
        setParticipants((prev) => [...prev, { userId: found.id, email: found.email, name: found.name, role: selectedRole }]);
        setEmailInput("");
      } else {
        setCreating({ email: trimmed, name: trimmed.split("@")[0], password: "" });
        setEmailInput("");
      }
    } catch {
      setLookupError("Failed to look up user");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!creating || !creating.name.trim() || !creating.password.trim()) return;
    setCreatingUser(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: creating.email, name: creating.name.trim(), password: creating.password, role: selectedRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      const newUser: UserResult = await res.json();
      setParticipants((prev) => [...prev, { userId: newUser.id, email: newUser.email, name: newUser.name, role: selectedRole }]);
      setCreating(null);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  }

  function removeParticipant(userId: string) {
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
  }

  function updateParticipantRole(userId: string, role: string) {
    setParticipants((prev) => prev.map((p) => (p.userId === userId ? { ...p, role } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          propertyId,
          participantIds: participants.map((p) => ({ userId: p.userId, role: p.role })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create room");
      }
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user || user.role !== "BUYER") return null;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">Create room</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Set up a new due diligence workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 sm:mt-10 space-y-6 sm:space-y-8">
        <Card className="space-y-5 sm:space-y-6 p-6 sm:p-8">
          <Input label="Room name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Seaside Villa Acquisition" />

          <Select
            label="Property"
            required
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder={properties.length === 0 ? "Loading properties..." : "Select a property"}
            options={properties.map((p) => ({
              value: p.id,
              label: `${p.address}, ${p.city}, ${p.state}`,
            }))}
          />
        </Card>

        <Card className="p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-text">Participants</h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Enter an email to add participants. You will be added automatically as Buyer.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
            <div className="flex-1 min-w-0">
              <Input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Email address"
              />
            </div>
            <div className="flex gap-2 sm:shrink-0">
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                options={ROLES}
                className="flex-1 sm:w-32"
              />
              <Button
                type="button"
                size="md"
                variant="secondary"
                onClick={handleAdd}
                disabled={lookingUp || !emailInput.trim()}
                loading={lookingUp}
                className="shrink-0"
              >
                Add
              </Button>
            </div>
          </div>

          {lookupError && (
            <p className="mt-2 text-xs text-error">{lookupError}</p>
          )}

          {creating && (
            <div className="mt-3 rounded-xl border border-primary/30 bg-primary-light/20 px-4 sm:px-5 py-4">
              <p className="text-sm font-medium text-text">
                User &quot;{creating.email}&quot; not found — create one
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <Input
                  label="Name"
                  value={creating.name}
                  onChange={(e) => setCreating((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  placeholder="Full name"
                />
                <Input
                  label="Password"
                  type="password"
                  value={creating.password}
                  onChange={(e) => setCreating((prev) => prev ? { ...prev, password: e.target.value } : prev)}
                  placeholder="Set a password"
                />
              </div>
              {createError && <p className="mt-2 text-xs text-error">{createError}</p>}
              <div className="mt-3 flex items-center gap-2">
                <Button type="button" size="sm" onClick={handleCreateUser} loading={creatingUser} disabled={!creating.name.trim() || !creating.password.trim()}>
                  Create & add
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setCreating(null); setCreateError(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {participants.length > 0 && (
            <div className="mt-4 space-y-2">
              {participants.map((p) => (
                <div
                  key={p.userId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border px-4 py-3 gap-2 sm:gap-0"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-text">{p.name}</span>
                    <span className="ml-2 text-xs text-text-secondary">{p.email}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={p.role}
                      onChange={(e) => updateParticipantRole(p.userId, e.target.value)}
                      className="h-8 rounded-lg border border-border px-2 text-xs text-text focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeParticipant(p.userId)}
                      className="text-xs font-medium text-error hover:text-error/80"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {submitError && (
          <p className="text-sm text-error" role="alert">{submitError}</p>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button type="submit" loading={submitting} disabled={!name || !propertyId}>
            Create room
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/dashboard")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
