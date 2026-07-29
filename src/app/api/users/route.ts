import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromHeaders } from "@/lib/api";
import bcrypt from "bcryptjs";

const VALID_ROLES = ["BUYER", "SELLER", "BANK", "LAWYER", "BROKER"];

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuthFromHeaders(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = request.nextUrl.searchParams.get("email");
    const search = request.nextUrl.searchParams.get("search");

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(user);
    }

    if (search && search.length >= 1) {
      const users = await prisma.user.findMany({
        where: {
          email: { contains: search },
        },
        select: { id: true, email: true, name: true, role: true },
        take: 10,
      });

      return NextResponse.json(users);
    }

    return NextResponse.json(
      { error: "email or search parameter is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuthFromHeaders(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: "email, name, password, and role are required" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, name, passwordHash: hashedPassword, role },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
