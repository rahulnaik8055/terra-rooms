"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { Button, Input, Select, Card, RoleBadge } from "@/components/ui";

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
  const [searchResults, setSearchResults] = useState<UserResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState<{ email: string; name: string; password: string; role: string } | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "BUYER") { router.push("/dashboard"); return; }
    fetch("/api/properties").then((r) => r.json()).then(setProperties).catch(() => {});
  }, [user, loading, router]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const trimmed = emailInput.trim();
    if (!trimmed) { setSearchResults(null); setShowDropdown(false); setSearching(false); return; }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const all: UserResult[] = await res.json();
          const addedIds = new Set(participants.map((p) => p.userId));
          setSearchResults(all.filter((u) => !addedIds.has(u.id)));
          setShowDropdown(true);
        }
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [emailInput, participants]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectUser(found: UserResult) {
    setParticipants((prev) => [...prev, { userId: found.id, email: found.email, name: found.name, role: found.role }]);
    setEmailInput("");
    setSearchResults(null);
    setShowDropdown(false);
  }

  function showCreateForm() {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    setCreating({ email: trimmed, name: trimmed.split("@")[0], password: "", role: "" });
    setShowDropdown(false);
    setEmailInput("");
  }

  async function handleCreateUser() {
    if (!creating || !creating.name.trim() || !creating.password.trim() || !creating.role) return;
    setCreatingUser(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: creating.email, name: creating.name.trim(), password: creating.password, role: creating.role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      const newUser: UserResult = await res.json();
      setParticipants((prev) => [...prev, { userId: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }]);
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

  const addedIds = new Set(participants.map((p) => p.userId));
  const filteredResults = searchResults?.filter((u) => !addedIds.has(u.id));

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
            Start typing an email to search. Already-added users are hidden.
          </p>

          <div className="mt-4 relative" ref={dropdownRef}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
              <div className="flex-1 min-w-0 relative">
                <Input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onFocus={() => { if (searchResults && searchResults.length > 0) setShowDropdown(true); }}
                  placeholder="Search by email..."
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
            </div>

            {showDropdown && filteredResults && filteredResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
                {filteredResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUser(u)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-primary-light/20"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-text">{u.name}</span>
                      <span className="ml-2 text-xs text-text-secondary">{u.email}</span>
                    </div>
                    <RoleBadge role={u.role} />
                  </button>
                ))}
              </div>
            )}

            {showDropdown && filteredResults && filteredResults.length === 0 && emailInput.trim() && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-surface shadow-lg">
                <button
                  type="button"
                  onClick={showCreateForm}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-text-secondary transition hover:bg-primary-light/20"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  No user found — create &quot;{emailInput.trim()}&quot;
                </button>
              </div>
            )}
          </div>

          {creating && (
            <div className="mt-3 rounded-xl border border-primary/30 bg-primary-light/20 px-4 sm:px-5 py-4">
              <p className="text-sm font-medium text-text">
                Create user &quot;{creating.email}&quot;
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
                <Select
                  label="Role"
                  value={creating.role}
                  onChange={(e) => setCreating((prev) => prev ? { ...prev, role: e.target.value } : prev)}
                  options={ROLES}
                />
              </div>
              {createError && <p className="mt-2 text-xs text-error">{createError}</p>}
              <div className="mt-3 flex items-center gap-2">
                <Button type="button" size="sm" onClick={handleCreateUser} loading={creatingUser} disabled={!creating.name.trim() || !creating.password.trim() || !creating.role}>
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
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-text">{p.name}</span>
                    <span className="ml-2 text-xs text-text-secondary">{p.email}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RoleBadge role={p.role} />
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
