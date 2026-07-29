import { NextRequest } from "next/server";

export function getAuthFromHeaders(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  return { userId, userRole };
}
