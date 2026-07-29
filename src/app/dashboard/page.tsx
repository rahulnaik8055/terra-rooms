"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/providers/AuthProvider";

interface Room {
  id: string;
  name: string;
  status: string;
  myRole: string;
  activityCount: number;
  property: {
    address: string;
    city: string;
    state: string;
  };
  participants: Array<{
    user: { name: string };
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => setRooms(data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user, loading, router]);

  if (loading || !user) return null;

  const statusColor: Record<string, string> = {
    DRAFT: "bg-zinc-100 text-zinc-600",
    IN_REVIEW: "bg-amber-50 text-amber-700",
    LAWYER_VERIFIED: "bg-blue-50 text-blue-700",
    BANK_APPROVED: "bg-green-50 text-green-700",
    CLOSED: "bg-zinc-900 text-white",
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Welcome, {user.name}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "BUYER" && (
            <Link
              href="/rooms/create"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Create room
            </Link>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-zinc-700">Your rooms</h2>

        {fetching ? (
          <p className="mt-6 text-sm text-zinc-400">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <div className="mt-6 rounded-lg border border-zinc-200 px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">You haven&apos;t been added to any rooms yet.</p>
            {user.role === "BUYER" && (
              <Link
                href="/rooms/create"
                className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline"
              >
                Create the first room
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className="block rounded-lg border border-zinc-200 p-5 transition hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900">
                      {room.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {room.property.address}, {room.property.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        statusColor[room.status] ?? "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {room.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
                  <span>{room.participants.length} participant{room.participants.length !== 1 ? "s" : ""}</span>
                  <span>{room.activityCount} activit{room.activityCount === 1 ? "y" : "ies"}</span>
                  <span className="font-medium text-zinc-500">You: {room.myRole}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
