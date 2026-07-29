import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeForOverview } from "@/lib/permissions";

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        surveyNumber: true,
      },
    });

    return NextResponse.json(properties.map(sanitizeForOverview));
  } catch (error) {
    console.error("GET /api/properties error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
