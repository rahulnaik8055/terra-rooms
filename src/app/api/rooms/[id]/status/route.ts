import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromHeaders } from "@/lib/api";
import {
  canTransitionStatus,
  roleCanSetStatus,
} from "@/lib/permissions";
import type { Role, RoomStatus } from "@/lib/permissions";

const VALID_STATUSES: RoomStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "LAWYER_VERIFIED",
  "BANK_APPROVED",
  "CLOSED",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, userRole } = getAuthFromHeaders(request);

    if (!userId || !userRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

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

    if (!canTransitionStatus(room.status as RoomStatus, newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${room.status} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    if (!roleCanSetStatus(userRole as Role, newStatus)) {
      return NextResponse.json(
        {
          error: `Role ${userRole} is not permitted to set status to ${newStatus}`,
        },
        { status: 403 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRoom = await tx.room.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.activityLog.create({
        data: {
          roomId: id,
          userId,
          action: "STATUS_CHANGED",
          details: {
            from: room.status,
            to: newStatus,
          },
        },
      });

      return updatedRoom;
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("PATCH /api/rooms/[id]/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
