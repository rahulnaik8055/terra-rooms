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

    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      sanitizePropertyForRole(property, userRole as Role)
    );
  } catch (error) {
    console.error("GET /api/properties/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
