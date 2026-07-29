"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { useSocket } from "@/hooks/useSocket";
import { roleCanSetStatus } from "@/lib/permissions";
import type { Role, RoomStatus } from "@/lib/permissions";
import { Button, Badge, Card, RoleBadge, Spinner, StatusBadge } from "@/components/ui";

const STEPS: RoomStatus[] = ["DRAFT", "IN_REVIEW", "LAWYER_VERIFIED", "BANK_APPROVED", "CLOSED"];

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

function getNextStatus(current: string): RoomStatus | null {
  const next = STATUS_FLOW[current as RoomStatus];
  return next?.length ? next[0] : null;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const ACTION_LABELS: Record<string, string> = {
  ROOM_CREATED: "Room created",
  NOTE: "Note added",
  STATUS_CHANGED: "Status changed",
};

// ─── Sub-components ──────────────────────────────────────

interface Participant {
  id: string; role: string; joinedAt: string;
  user: { id: string; email: string; name: string; role: string };
}
interface ActivityLog {
  id: string; action: string; details: Record<string, unknown> | null;
  timestamp: string; user: { id: string; name: string; role: string };
}
interface RoomData {
  id: string; name: string; status: string; createdAt: string; updatedAt: string;
  myRole: string; createdBy: { id: string; name: string; role: string };
  property: Record<string, unknown>;
  participants: Participant[]; activityLogs: ActivityLog[];
}

function PropertySectionCard({
  label, detail, status, collapsed, onToggle,
}: {
  label: string; detail: unknown; status: string; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <Card className="overflow-hidden !p-0">
      <button type="button" onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-primary-light/30"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-text">{label}</span>
          <Badge variant={status === "verified" ? "success" : "warning"}>
            {status}
          </Badge>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`shrink-0 text-text-secondary transition duration-200 ${collapsed ? "" : "rotate-180"}`}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {!collapsed && (
        <div className="border-t border-border px-5 py-4">
          {detail != null ? (
            <pre className="max-h-96 overflow-auto text-xs leading-relaxed text-text-secondary">
              {JSON.stringify(detail, null, 2)}
            </pre>
          ) : (
            <p className="text-xs italic text-text-secondary/60">No data available</p>
          )}
        </div>
      )}
    </Card>
  );
}

function RestrictedSectionCard({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[20px] border border-dashed border-border bg-surface/50 px-5 py-3.5">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-text-secondary/30">
        <path d="M7 3V7M7 10H7.01M3 1H11C12.1046 1 13 1.89543 13 3V11C13 12.1046 12.1046 13 11 13H3C1.89543 13 1 12.1046 1 11V3C1 1.89543 1.89543 1 3 1Z"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm text-text-secondary/60">{label}</span>
      <Badge className="ml-auto">Restricted</Badge>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────

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
    setCollapsed((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const sectionEntries = useMemo(() => {
    if (!room) return [];
    return SECTION_CONFIG.filter((c) => c.key in room.property).map((c) => ({ ...c, restricted: false }));
  }, [room]);

  const restrictedSections = useMemo(() => {
    if (!room) return [];
    return SECTION_CONFIG.filter((c) => !(c.key in room.property)).map((c) => ({ ...c, restricted: true }));
  }, [room]);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error(res.status === 403 ? "Access denied" : res.status === 404 ? "Room not found" : "Failed to load room");
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
    if (!user) { router.replace("/login"); return; }
    fetchRoom();
  }, [user, loading, router, fetchRoom]);

  const fetchRef = useRef(fetchRoom);
  fetchRef.current = fetchRoom;

  useEffect(() => {
    if (!socket) return;
    socket.emit("room:join", roomId);
    const onActivity = (data: { roomId: string }) => { if (data.roomId === roomId) fetchRef.current(); };
    const onStatus = (data: { roomId: string; status: string }) => {
      if (data.roomId !== roomId) return;
      setRoom((prev) => prev ? { ...prev, status: data.status } : prev);
      fetchRef.current();
    };
    socket.on("activity:new", onActivity);
    socket.on("room:status", onStatus);
    return () => { socket.off("activity:new", onActivity); socket.off("room:status", onStatus); };
  }, [socket, roomId]);

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
      if (!res.ok) throw new Error((await res.json()).error || "Failed to advance status");
      setRoom((prev) => prev ? { ...prev, status: next } : prev);
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
        body: JSON.stringify({ action: "NOTE", details: { message: activityInput.trim() } }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to post activity");
      emitActivity(roomId, { action: "NOTE", details: { message: activityInput.trim() } });
      setActivityInput("");
      fetchRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post activity");
    } finally {
      setPostingActivity(false);
    }
  }

  const currentIdx = STEPS.indexOf((room?.status as RoomStatus) ?? "DRAFT");
  const nextStatus = room ? getNextStatus(room.status) : null;
  const canAdvance = room && nextStatus && roleCanSetStatus(room.myRole as Role, nextStatus);

  if (loading || !user) return null;

  if (fetching) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-text-secondary">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-bg">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
            <span className="text-lg text-error">!</span>
          </div>
          <p className="mt-4 text-sm font-medium text-text">Could not load room</p>
          <p className="mt-1 text-xs text-text-secondary">{error}</p>
          <Button className="mt-6" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-bg">
        <ErrorState message="Room not found" onBack={() => router.push("/dashboard")} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back */}
        <button onClick={() => router.push("/dashboard")}
          className="group mb-6 flex items-center gap-1.5 text-xs text-text-secondary transition hover:text-text"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition group-hover:-translate-x-0.5">
            <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">{room.name}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Created by {room.createdBy.name} &middot; {room.participants.length} participant{room.participants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <RoleBadge role={room.myRole} />
        </div>

        {/* Main grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Property section */}
            <section>
              <h2 className="mb-4 text-sm font-semibold text-text">Property</h2>
              <div className="space-y-3">
                {/* Overview card */}
                <Card className="!p-0 overflow-hidden">
                  <div className="border-b border-border px-5 py-3.5">
                    <p className="text-sm font-medium text-text">
                      {(room.property.address as string) ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {[room.property.city as string, room.property.state as string].filter(Boolean).join(", ")}
                      {(room.property.surveyNumber as string) ? ` · Survey ${room.property.surveyNumber}` : ""}
                    </p>
                  </div>
                  <div className="px-5 py-3">
                    <span className="text-xs text-text-secondary">Status: </span>
                    <StatusBadge status={room.status} />
                  </div>
                </Card>

                {sectionEntries.map((section) => (
                  <PropertySectionCard key={section.key} label={section.label}
                    detail={room.property[section.key]}
                    status={(room.property.sectionStatus as Record<string, string> | undefined)?.[section.key] ?? "verified"}
                    collapsed={collapsed.has(section.key)} onToggle={() => toggleSection(section.key)} />
                ))}

                {restrictedSections.map((section) => (
                  <RestrictedSectionCard key={section.key} label={section.label} />
                ))}
              </div>
            </section>

            {/* Activity log */}
            <section>
              <h2 className="mb-4 text-sm font-semibold text-text">
                Activity
                {room.activityLogs.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-text-secondary">{room.activityLogs.length}</span>
                )}
              </h2>

              <div className="space-y-3">
                {room.activityLogs.length === 0 ? (
                  <Card className="px-5 py-8 text-center">
                    <p className="text-sm text-text-secondary">No activity recorded yet.</p>
                    <p className="mt-0.5 text-xs text-text-secondary/60">Use the form below to log a note.</p>
                  </Card>
                ) : (
                  room.activityLogs.map((log) => (
                    <Card key={log.id} className="!p-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-4 px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-text">{log.user.name}</span>
                          <RoleBadge role={log.user.role} />
                          <span className="hidden text-xs text-text-secondary sm:inline">
                            {ACTION_LABELS[log.action] ?? log.action.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] text-text-secondary">{formatTimestamp(log.timestamp)}</span>
                      </div>
                      {log.details && (
                        <div className="border-t border-border px-5 py-3">
                          <p className="text-xs text-text-secondary">
                            {log.details.message as string ?? JSON.stringify(log.details)}
                          </p>
                        </div>
                      )}
                    </Card>
                  ))
                )}

                {/* Post activity form */}
                <form onSubmit={handlePostActivity} className="flex gap-2">
                  <input type="text" value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    placeholder="Add a note to this room..."
                    className="h-10 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-text placeholder-text-secondary/50 transition focus:border-primary focus:ring-3 focus:ring-primary/10"
                  />
                  <Button type="submit" loading={postingActivity} disabled={!activityInput.trim()}>
                    Send
                  </Button>
                </form>
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-6">
            {/* Status stepper */}
            <Card className="p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Status</h3>
              <div className="mt-5">
                {STEPS.map((step, i) => {
                  const isCompleted = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={step} className="relative flex items-start gap-3">
                      {i < STEPS.length - 1 && (
                        <div className={`absolute left-[11px] top-5 h-8 w-px transition-colors duration-500 ${isCompleted ? "bg-primary" : "bg-border"}`} />
                      )}
                      <div className="relative z-10 mt-0.5 flex shrink-0">
                        {isCompleted ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary transition-all duration-500">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        ) : isCurrent ? (
                          <div className="relative flex h-5 w-5 items-center justify-center">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                            <div className="relative h-5 w-5 rounded-full border-2 border-primary bg-surface" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-border bg-surface" />
                        )}
                      </div>
                      <div className="pb-6">
                        <span className={`text-sm transition-colors duration-300 ${isCompleted || isCurrent ? "font-medium text-text" : "text-text-secondary/60"}`}>
                          {STEP_LABELS[step]}
                        </span>
                        {isCurrent && <Badge className="ml-2">Current</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {canAdvance && (
                <Button className="mt-2 w-full" onClick={handleAdvanceStatus} loading={advancingStatus}>
                  Advance to {STEP_LABELS[nextStatus!]}
                </Button>
              )}

              {room.status === "CLOSED" && (
                <div className="mt-3 rounded-xl bg-primary-light px-4 py-2.5 text-center text-xs font-medium text-primary">
                  This deal is closed.
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-xs text-error" role="alert">{error}</p>
              )}
            </Card>

            {/* Participants */}
            <Card className="p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Participants</h3>
              <div className="mt-4 space-y-2.5">
                {room.participants.map((p) => (
                  <div key={p.id}
                    className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5 transition hover:border-primary/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{p.user.name}</p>
                      <p className="truncate text-xs text-text-secondary">{p.user.email}</p>
                    </div>
                    <RoleBadge role={p.role} />
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="max-w-sm text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
        <span className="text-lg text-error">!</span>
      </div>
      <p className="mt-4 text-sm font-medium text-text">Could not load room</p>
      <p className="mt-1 text-xs text-text-secondary">{message}</p>
      <Button className="mt-6" onClick={onBack}>Back to dashboard</Button>
    </div>
  );
}
