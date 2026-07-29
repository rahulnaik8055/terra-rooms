import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromHeaders } from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, userRole } = getAuthFromHeaders(request);

    if (!userId || !userRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const participant = await prisma.participant.findUnique({
      where: { roomId_userId: { roomId: id, userId } },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, details } = body;

    if (!action || typeof action !== "string" || action.trim().length === 0) {
      return NextResponse.json(
        { error: "action must be a non-empty string" },
        { status: 400 }
      );
    }

    if (details !== undefined && (typeof details !== "object" || details === null || Array.isArray(details))) {
      return NextResponse.json(
        { error: "details must be a plain object" },
        { status: 400 }
      );
    }

    const log = await prisma.activityLog.create({
      data: {
        roomId: id,
        userId,
        action,
        details: details ?? {},
      },
    });

    return NextResponse.json(
      {
        id: log.id,
        action: log.action,
        details: log.details,
        timestamp: log.timestamp,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/rooms/[id]/activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
