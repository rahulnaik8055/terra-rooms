"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@/providers/AuthProvider";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  surveyNumber: string;
}

interface UserResult {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ParticipantEntry {
  userId: string;
  email: string;
  name: string;
  role: string;
}

const ROLES = [
  { value: "BUYER", label: "Buyer" },
  { value: "SELLER", label: "Seller" },
  { value: "BANK", label: "Bank" },
  { value: "LAWYER", label: "Lawyer" },
  { value: "BROKER", label: "Broker" },
] as const;

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "BUYER") {
      router.push("/dashboard");
      return;
    }
    fetch("/api/properties")
      .then((r) => r.json())
      .then(setProperties)
      .catch(() => {});
  }, [user, loading, router]);

  const lookupEmail = useCallback(async () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    setLookingUp(true);
    setLookupError(null);

    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const err = await res.json();
        setLookupError(err.error || "User not found");
        return;
      }
      const found: UserResult = await res.json();

      if (participants.some((p) => p.userId === found.id)) {
        setLookupError(`${found.name} is already added`);
        return;
      }

      setParticipants((prev) => [
        ...prev,
        {
          userId: found.id,
          email: found.email,
          name: found.name,
          role: selectedRole,
        },
      ]);
      setEmailInput("");
    } catch {
      setLookupError("Failed to look up user");
    } finally {
      setLookingUp(false);
    }
  }, [emailInput, selectedRole, participants]);

  function removeParticipant(userId: string) {
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
  }

  function updateParticipantRole(userId: string, role: string) {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, role } : p))
    );
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
          participantIds: participants.map((p) => ({
            userId: p.userId,
            role: p.role,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create room");
      }

      const room = await res.json();
      router.push(`/rooms/${room.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user || user.role !== "BUYER") return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Create room
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Set up a new due diligence workspace.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Room name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            placeholder="e.g. Seaside Villa Acquisition"
          />
        </div>

        <div>
          <label htmlFor="property" className="block text-sm font-medium text-zinc-700">
            Property
          </label>
          {properties.length === 0 ? (
            <p className="mt-1.5 text-sm text-zinc-400">Loading properties...</p>
          ) : (
            <select
              id="property"
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="">Select a property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}, {p.city}, {p.state}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Participants
          </label>
          <p className="mt-0.5 text-xs text-zinc-400">
            Search by email to add participants. You will be added automatically as Buyer.
          </p>

          <div className="mt-3 flex items-end gap-2">
            <div className="flex-1">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    lookupEmail();
                  }
                }}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                placeholder="Email address"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={lookupEmail}
              disabled={lookingUp || !emailInput.trim()}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lookingUp ? "..." : "Add"}
            </button>
          </div>

          {lookupError && (
            <p className="mt-2 text-xs text-red-600">{lookupError}</p>
          )}

          {participants.length > 0 && (
            <div className="mt-4 space-y-2">
              {participants.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-2.5"
                >
                  <div>
                    <span className="text-sm font-medium text-zinc-900">
                      {p.name}
                    </span>
                    <span className="ml-2 text-xs text-zinc-400">{p.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={p.role}
                      onChange={(e) =>
                        updateParticipantRole(p.userId, e.target.value)
                      }
                      className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-700 focus:border-zinc-400 focus:outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeParticipant(p.userId)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <p className="text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting || !name || !propertyId}
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create room"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
