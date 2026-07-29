"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { useSocket } from "@/hooks/useSocket";

interface Participant {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  timestamp: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
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

const statusColor: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600",
  IN_REVIEW: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  LAWYER_VERIFIED: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  BANK_APPROVED: "bg-green-50 text-green-700 ring-1 ring-green-200",
  CLOSED: "bg-zinc-900 text-white",
};

const sectionLabels: Record<string, string> = {
  ownershipHistory: "Ownership History",
  encumbranceStatus: "Encumbrance Status",
  taxRecords: "Tax Records",
  titleChain: "Title Chain",
};

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const { socket, emitActivity } = useSocket();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityInput, setActivityInput] = useState("");
  const [postingActivity, setPostingActivity] = useState(false);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Room not found");
        if (res.status === 403) throw new Error("Access denied");
        throw new Error("Failed to load room");
      }
      setRoom(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room");
    } finally {
      setFetching(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchRoom();
  }, [user, loading, router, fetchRoom]);

  const roomId = room?.id;

  useEffect(() => {
    if (!socket || !roomId) return;

    function handleActivity(data: { roomId: string; action: string; details?: Record<string, unknown> }) {
      if (data.roomId !== roomId) return;
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.action === "STATUS_CHANGED" ? (data.details?.newStatus as string) ?? prev.status : prev.status,
        };
      });
      fetchRoom();
    }

    socket.on("activity:new", handleActivity);

    return () => {
      socket.off("activity:new", handleActivity);
    };
  }, [socket, roomId, fetchRoom]);

  async function handlePostActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityInput.trim()) return;
    setPostingActivity(true);

    try {
      const res = await fetch(`/api/rooms/${params.id}/activity`, {
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

      emitActivity(params.id as string, {
        action: "NOTE",
        details: { message: activityInput.trim() },
      });

      setActivityInput("");
      fetchRoom();
    } catch (err) {
      console.error(err);
    } finally {
      setPostingActivity(false);
    }
  }

  if (loading || !user) return null;

  if (fetching) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm text-zinc-400">Loading room...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm text-red-600">{error || "Room not found"}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const propertySections = Object.keys(room.property).filter(
    (k) => k in sectionLabels
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-3 text-xs text-zinc-400 hover:text-zinc-600"
          >
            &larr; Dashboard
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {room.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Created by {room.createdBy.name}
          </p>
        </div>
        <span
          className={`rounded-md px-3 py-1 text-xs font-medium ${
            statusColor[room.status] ?? "bg-zinc-100 text-zinc-600"
          }`}
        >
          {room.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-sm font-medium text-zinc-700">Property</h2>
            <div className="mt-3 rounded-lg border border-zinc-200">
              <div className="border-b border-zinc-100 px-5 py-3">
                <p className="text-sm font-medium text-zinc-900">
                  {room.property.address as string}
                </p>
                <p className="text-xs text-zinc-400">
                  {(room.property.city as string)}, {(room.property.state as string)} &middot; Survey: {(room.property.surveyNumber as string)}
                </p>
              </div>
              {propertySections.length > 0 && (
                <div className="divide-y divide-zinc-100">
                  {propertySections.map((section) => (
                    <div key={section} className="px-5 py-4">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        {sectionLabels[section]}
                      </h3>
                      <pre className="mt-2 overflow-x-auto text-xs text-zinc-700">
                        {JSON.stringify(room.property[section], null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
              {propertySections.length === 0 && (
                <div className="px-5 py-4 text-xs text-zinc-400">
                  No additional property data available for your role.
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-zinc-700">Activity Log</h2>
            <div className="mt-3 space-y-3">
              {room.activityLogs.length === 0 ? (
                <p className="text-sm text-zinc-400">No activity yet.</p>
              ) : (
                room.activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-zinc-200 px-5 py-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-medium text-zinc-900">
                          {log.user.name}
                        </span>
                        <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                          {log.user.role}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{log.action}</p>
                    {log.details && (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                ))
              )}

              <form onSubmit={handlePostActivity} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={activityInput}
                  onChange={(e) => setActivityInput(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <button
                  type="submit"
                  disabled={postingActivity || !activityInput.trim()}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {postingActivity ? "..." : "Post"}
                </button>
              </form>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-zinc-700">Participants</h2>
            <div className="mt-3 space-y-2">
              {room.participants.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-zinc-200 px-4 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900">
                      {p.user.name}
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                      {p.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{p.user.email}</p>
                </div>
              ))}
            </div>
          </section>

          {room.myRole !== "BUYER" && room.myRole !== "SELLER" && room.myRole !== "BROKER" && (
            <section>
              <h2 className="text-sm font-medium text-zinc-700">Actions</h2>
              <div className="mt-3 rounded-lg border border-zinc-200 px-4 py-3">
                <p className="text-xs text-zinc-500">Status management coming soon.</p>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
