import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromHeaders } from "@/lib/api";
import { sanitizePropertyForRole } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, userRole } = getAuthFromHeaders(request);

    if (!userId || !userRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        property: true,
        participants: {
          include: {
            user: {
              select: { id: true, email: true, name: true, role: true },
            },
          },
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { timestamp: "desc" },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isParticipant = room.participants.some(
      (p) => p.userId === userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const myParticipation = room.participants.find(
      (p) => p.userId === userId
    );

    const filteredProperty = sanitizePropertyForRole(
      room.property,
      userRole as Role
    );

    return NextResponse.json({
      id: room.id,
      name: room.name,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      myRole: myParticipation?.role,
      createdBy: room.createdBy,
      property: filteredProperty,
      participants: room.participants.map((p) => ({
        id: p.id,
        role: p.role,
        joinedAt: p.joinedAt,
        user: p.user,
      })),
      activityLogs: room.activityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        timestamp: log.timestamp,
        user: log.user,
      })),
    });
  } catch (error) {
    console.error("GET /api/rooms/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
