import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export interface TokenPayload {
  sub: string;
  role: string;
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role } satisfies TokenPayload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
