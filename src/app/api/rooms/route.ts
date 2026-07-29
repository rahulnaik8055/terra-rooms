import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromHeaders } from "@/lib/api";
import type { Role } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const { userId, userRole } = getAuthFromHeaders(request);

    if (!userId || !userRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== "BUYER") {
      return NextResponse.json(
        { error: "Only buyers can create rooms" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, propertyId, participantIds } = body;

    if (!name || !propertyId || !participantIds) {
      return NextResponse.json(
        {
          error: "name, propertyId, and participantIds are required",
        },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json(
        { error: "name must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof propertyId !== "string" || propertyId.length < 1) {
      return NextResponse.json(
        { error: "propertyId must be a valid property ID" },
        { status: 400 }
      );
    }

    if (!Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: "participantIds must be an array" },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const validRoles = ["BUYER", "SELLER", "BANK", "LAWYER", "BROKER"];

    for (const p of participantIds) {
      if (!p.userId || !p.role || !validRoles.includes(p.role)) {
        return NextResponse.json(
          {
            error:
              "Each participant must have a valid userId and role (BUYER, SELLER, BANK, LAWYER, BROKER)",
          },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: p.userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: `User ${p.userId} not found` },
          { status: 404 }
        );
      }
    }

    const isCreatorIncluded = participantIds.some(
      (p: { userId: string }) => p.userId === userId
    );

    const allParticipants = isCreatorIncluded
      ? participantIds
      : [
          ...participantIds,
          { userId, role: "BUYER" as const },
        ];

    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          name,
          propertyId,
          createdByUserId: userId,
          participants: {
            createMany: {
              data: allParticipants.map(
                (p: { userId: string; role: string }) => ({
                  userId: p.userId,
                  role: p.role as "BUYER" | "SELLER" | "BANK" | "LAWYER" | "BROKER",
                })
              ),
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, email: true, name: true, role: true },
              },
            },
          },
          property: {
            select: {
              id: true,
              address: true,
              city: true,
              state: true,
              surveyNumber: true,
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          roomId: newRoom.id,
          userId,
          action: "ROOM_CREATED",
          details: { participantCount: allParticipants.length },
        },
      });

      return newRoom;
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("POST /api/rooms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId, userRole } = getAuthFromHeaders(request);

    if (!userId || !userRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participantRooms = await prisma.participant.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            property: {
              select: {
                id: true,
                address: true,
                city: true,
                state: true,
                surveyNumber: true,
              },
            },
            participants: {
              include: {
                user: {
                  select: { id: true, email: true, name: true, role: true },
                },
              },
            },
            _count: {
              select: { activityLogs: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const rooms = participantRooms.map((pr) => ({
      ...pr.room,
      myRole: pr.role,
      activityCount: pr.room._count.activityLogs,
    }));

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
