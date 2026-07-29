"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/providers/AuthProvider";
import { Button, Card, Badge, RoleBadge, EmptyState, Skeleton } from "@/components/ui";

interface Room {
  id: string;
  name: string;
  status: string;
  myRole: string;
  activityCount: number;
  property: { address: string; city: string; state: string };
  participants: Array<{ user: { name: string } }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    fetch("/api/rooms")
      .then((r) => r.json())
      .then(setRooms)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">Welcome, {user.name}.</p>
        </div>
        {user.role === "BUYER" && (
          <Link href="/rooms/create">
            <Button>Create room</Button>
          </Link>
        )}
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-text">Your rooms</h2>

        {fetching ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="mb-3 h-4 w-3/5" />
                <Skeleton className="mb-2 h-3 w-2/5" />
                <div className="mt-4 flex gap-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No rooms yet"
              description={user.role === "BUYER" ? "Create your first room to start collaborating." : "You haven't been added to any rooms."}
              icon={
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="16" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 6L8 16H32L20 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              }
              action={user.role === "BUYER" ? <Link href="/rooms/create"><Button size="sm">Create room</Button></Link> : undefined}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {rooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`}>
                <Card hover className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-text">{room.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">
                        {room.property.address}, {room.property.city}
                      </p>
                    </div>
                    <Badge variant={statusVariant(room.status)} className="shrink-0">
                      {room.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
                    <span>{room.participants.length} participant{room.participants.length !== 1 ? "s" : ""}</span>
                    <span>{room.activityCount} activit{room.activityCount === 1 ? "y" : "ies"}</span>
                    <RoleBadge role={room.myRole} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function statusVariant(status: string): "default" | "success" | "warning" | "error" | "primary" {
  switch (status) {
    case "DRAFT": return "default";
    case "IN_REVIEW": return "warning";
    case "LAWYER_VERIFIED": return "primary";
    case "BANK_APPROVED": return "success";
    case "CLOSED": return "default";
    default: return "default";
  }
}
