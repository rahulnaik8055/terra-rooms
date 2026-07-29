"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { useSocket } from "@/hooks/useSocket";
import { roleCanSetStatus } from "@/lib/permissions";
import type { Role, RoomStatus } from "@/lib/permissions";

// ---- Types ----

interface Participant {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; email: string; name: string; role: string };
}

interface ActivityLog {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  timestamp: string;
  user: { id: string; name: string; role: string };
}

interface RoomData {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  myRole: string;
  createdBy: { id: string; name: string; role: string };
  property: Record<string, unknown>;
  participants: Participant[];
  activityLogs: ActivityLog[];
}

// ---- Constants ----

const STEPS: RoomStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "LAWYER_VERIFIED",
  "BANK_APPROVED",
  "CLOSED",
];

const STATUS_FLOW: Record<RoomStatus, RoomStatus[]> = {
  DRAFT: ["IN_REVIEW"],
  IN_REVIEW: ["LAWYER_VERIFIED"],
  LAWYER_VERIFIED: ["BANK_APPROVED"],
  BANK_APPROVED: ["CLOSED"],
  CLOSED: [],
};

const STEP_LABELS: Record<RoomStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  LAWYER_VERIFIED: "Lawyer Verified",
  BANK_APPROVED: "Bank Approved",
  CLOSED: "Closed",
};

const SECTION_CONFIG = [
  { key: "ownershipHistory", label: "Ownership History" },
  { key: "encumbranceStatus", label: "Encumbrance" },
  { key: "taxRecords", label: "Tax Records" },
  { key: "titleChain", label: "Title Chain" },
] as const;

// ---- Helpers ----

function getNextStatus(current: string): RoomStatus | null {
  const next = STATUS_FLOW[current as RoomStatus];
  return next && next.length > 0 ? next[0] : null;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---- Components ----

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        <p className="text-sm text-zinc-400">Loading workspace…</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <span className="text-lg text-red-500">!</span>
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-900">Could not load room</p>
        <p className="mt-1 text-xs text-zinc-500">{message}</p>
        <button
          onClick={onBack}
          className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const { socket, emitActivity, emitStatus } = useSocket();
  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activityInput, setActivityInput] = useState("");
  const [postingActivity, setPostingActivity] = useState(false);
  const [advancingStatus, setAdvancingStatus] = useState(false);

  const toggleSection = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sectionEntries = useMemo(() => {
    if (!room) return [];
    return SECTION_CONFIG.filter((c) => c.key in room.property).map((c) => ({
      ...c,
      restricted: false,
    }));
  }, [room]);

  const restrictedSections = useMemo(() => {
    if (!room) return [];
    return SECTION_CONFIG.filter((c) => !(c.key in room.property)).map(
      (c) => ({ ...c, restricted: true })
    );
  }, [room]);

  // ---- Data fetching ----

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error("Access denied");
        if (res.status === 404) throw new Error("Room not found");
        throw new Error("Failed to load room");
      }
      setRoom(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room");
    } finally {
      setFetching(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    fetchRoom();
  }, [user, loading, router, fetchRoom]);

  // ---- Socket real-time ----

  const fetchRef = useRef(fetchRoom);
  fetchRef.current = fetchRoom;

  useEffect(() => {
    if (!socket) return;

    socket.emit("room:join", roomId);

    const onActivity = (data: { roomId: string }) => {
      if (data.roomId === roomId) fetchRef.current();
    };

    const onStatus = (data: { roomId: string; status: string }) => {
      if (data.roomId !== roomId) return;
      setRoom((prev) =>
        prev ? { ...prev, status: data.status } : prev
      );
      fetchRef.current();
    };

    socket.on("activity:new", onActivity);
    socket.on("room:status", onStatus);

    return () => {
      socket.off("activity:new", onActivity);
      socket.off("room:status", onStatus);
    };
  }, [socket, roomId]);

  // ---- Actions ----

  async function handleAdvanceStatus() {
    const next = getNextStatus(room!.status);
    if (!next) return;

    setAdvancingStatus(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to advance status");
      }

      setRoom((prev) => (prev ? { ...prev, status: next } : prev));

      emitStatus(roomId, next);

      fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to advance status");
    } finally {
      setAdvancingStatus(false);
    }
  }

  async function handlePostActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityInput.trim()) return;
    setPostingActivity(true);

    try {
      const res = await fetch(`/api/rooms/${roomId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "NOTE",
          details: { message: activityInput.trim() },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post activity");
      }

      emitActivity(roomId, {
        action: "NOTE",
        details: { message: activityInput.trim() },
      });

      setActivityInput("");
      fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post activity");
    } finally {
      setPostingActivity(false);
    }
  }

  // ---- Derive status info ----

  const currentIdx = STEPS.indexOf((room?.status as RoomStatus) ?? "DRAFT");
  const nextStatus = room ? getNextStatus(room.status) : null;
  const canAdvance =
    room &&
    nextStatus &&
    roleCanSetStatus(room.myRole as Role, nextStatus);

  // ---- Guard: auth ----

  if (loading || !user) return null;

  // ---- States ----

  if (fetching) return <LoadingState />;
  if (error && !room) return <ErrorState message={error} onBack={() => router.push("/dashboard")} />;
  if (!room) return <ErrorState message="Room not found" onBack={() => router.push("/dashboard")} />;

  // ---- Render ----

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back */}
        <button
          onClick={() => router.push("/dashboard")}
          className="group mb-6 flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-zinc-600"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="transition group-hover:-translate-x-0.5"
          >
            <path
              d="M9 3L5 7L9 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Dashboard
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {room.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Created by {room.createdBy.name} &middot;{" "}
              {room.participants.length} participant
              {room.participants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
            {room.myRole}
          </span>
        </div>

        {/* Main grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* ── Left column ── */}
          <div className="space-y-8 lg:col-span-2">
            {/* ── Property section ── */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-800">Property</h2>
              </div>

              <div className="space-y-3">
                {/* Overview card — always visible */}
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
                  <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white px-5 py-3.5">
                    <p className="text-sm font-medium text-zinc-900">
                      {(room.property.address as string) ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {(room.property.city as string) ?? "—"}
                      {(room.property.city as string) && (room.property.state as string) ? ", " : ""}
                      {(room.property.state as string) ?? ""}
                      {(room.property.surveyNumber as string)
                        ? ` \u00b7 Survey ${room.property.surveyNumber}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Role-specific sections: accessible */}
                {sectionEntries.map((section) => (
                  <PropertySectionCard
                    key={section.key}
                    label={section.label}
                    detail={room.property[section.key]}
                    status={
                      (room.property.sectionStatus as Record<string, string> | undefined)?.[
                        section.key
                      ] ?? "verified"
                    }
                    collapsed={collapsed.has(section.key)}
                    onToggle={() => toggleSection(section.key)}
                  />
                ))}

                {/* Role-specific sections: restricted */}
                {restrictedSections.map((section) => (
                  <RestrictedSectionCard key={section.key} label={section.label} />
                ))}
              </div>
            </section>

            {/* ── Activity log ── */}
            <section>
              <h2 className="mb-4 text-sm font-semibold text-zinc-800">
                Activity
                {room.activityLogs.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-zinc-400">
                    {room.activityLogs.length}
                  </span>
                )}
              </h2>

              <div className="space-y-3">
                {room.activityLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 px-5 py-8 text-center">
                    <p className="text-sm text-zinc-400">No activity recorded yet.</p>
                    <p className="mt-0.5 text-xs text-zinc-300">
                      Use the form below to log a note.
                    </p>
                  </div>
                ) : (
                  room.activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="group rounded-xl border border-zinc-200 bg-white px-5 py-3.5 shadow-sm transition hover:border-zinc-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900">
                            {log.user.name}
                          </span>
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">
                            {log.user.role}
                          </span>
                          <span className="hidden text-xs text-zinc-400 sm:inline">
                            {ACTION_LABELS[log.action] ?? log.action.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] text-zinc-400">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      {log.details && (
                        <p className="mt-1.5 text-xs text-zinc-600">
                          {log.details.message as string ??
                            (typeof log.details === "object" && log.details !== null
                              ? JSON.stringify(log.details)
                              : String(log.details))}
                        </p>
                      )}
                    </div>
                  ))
                )}

                {/* Log activity form */}
                <form onSubmit={handlePostActivity} className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={activityInput}
                      onChange={(e) => setActivityInput(e.target.value)}
                      placeholder="Add a note to this room…"
                      className="block flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
                    />
                    <button
                      type="submit"
                      disabled={postingActivity || !activityInput.trim()}
                      className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {postingActivity ? (
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Sending
                        </span>
                      ) : (
                        "Send"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>

          {/* ── Right sidebar ── */}
          <aside className="space-y-6">
            {/* Status stepper */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Status
              </h3>

              <div className="mt-5">
                {STEPS.map((step, i) => {
                  const isCompleted = i < currentIdx;
                  const isCurrent = i === currentIdx;

                  return (
                    <div key={step} className="relative flex items-start gap-3">
                      {/* Connector line */}
                      {i < STEPS.length - 1 && (
                        <div
                          className={`absolute left-[11px] top-5 h-8 w-px transition-colors duration-500 ${
                            isCompleted ? "bg-zinc-900" : "bg-zinc-200"
                          }`}
                        />
                      )}

                      {/* Circle */}
                      <div className="relative z-10 mt-0.5 flex shrink-0">
                        {isCompleted ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 transition-all duration-500">
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                            >
                              <path
                                d="M2 5L4 7L8 3"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        ) : isCurrent ? (
                          <div className="relative flex h-5 w-5 items-center justify-center">
                            <div className="absolute inset-0 animate-ping rounded-full bg-zinc-900/15" />
                            <div className="relative h-5 w-5 rounded-full border-2 border-zinc-900 bg-white" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-zinc-200 bg-white" />
                        )}
                      </div>

                      {/* Label */}
                      <div className="pb-6">
                        <span
                          className={`text-sm transition-colors duration-300 ${
                            isCompleted || isCurrent
                              ? "font-medium text-zinc-900"
                              : "text-zinc-400"
                          }`}
                        >
                          {STEP_LABELS[step]}
                        </span>
                        {isCurrent && (
                          <span className="ml-2 inline-block rounded bg-zinc-900/5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advance button */}
              {canAdvance && (
                <button
                  onClick={handleAdvanceStatus}
                  disabled={advancingStatus}
                  className="mt-2 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {advancingStatus ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Advancing…
                    </span>
                  ) : (
                    `Advance to ${STEP_LABELS[nextStatus!]}`
                  )}
                </button>
              )}

              {room.status === "CLOSED" && (
                <div className="mt-3 rounded-lg bg-zinc-50 px-4 py-2.5 text-center text-xs text-zinc-500">
                  This deal is closed.
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Participants */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Participants
              </h3>

              <div className="mt-4 space-y-2.5">
                {room.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 px-3.5 py-2.5 transition hover:border-zinc-200"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {p.user.name}
                      </p>
                      <p className="truncate text-xs text-zinc-400">{p.user.email}</p>
                    </div>
                    <span className="ml-3 shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                      {p.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ----

const ACTION_LABELS: Record<string, string> = {
  ROOM_CREATED: "Room created",
  NOTE: "Note added",
  STATUS_CHANGED: "Status changed",
};

function PropertySectionCard({
  label,
  detail,
  status,
  collapsed,
  onToggle,
}: {
  label: string;
  detail: unknown;
  status: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-zinc-50"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-zinc-900">{label}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              status === "verified"
                ? "bg-green-50 text-green-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {status}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-zinc-400 transition duration-200 ${
            collapsed ? "" : "rotate-180"
          }`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-zinc-100 px-5 py-4 transition-all">
          {detail != null ? (
            <pre className="max-h-96 overflow-x-auto overflow-y-auto text-xs leading-relaxed text-zinc-600">
              {JSON.stringify(detail, null, 2)}
            </pre>
          ) : (
            <p className="text-xs italic text-zinc-400">No data available</p>
          )}
        </div>
      )}
    </div>
  );
}

function RestrictedSectionCard({ label }: { label: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0 text-zinc-300"
        >
          <path
            d="M7 3V7M7 10H7.01M3 1H11C12.1046 1 13 1.89543 13 3V11C13 12.1046 12.1046 13 11 13H3C1.89543 13 1 12.1046 1 11V3C1 1.89543 1.89543 1 3 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm text-zinc-400">{label}</span>
        <span className="ml-auto rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          Restricted
        </span>
      </div>
    </div>
  );
}
