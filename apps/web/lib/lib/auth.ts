import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "EMPLOYEE" | "TEAM_LEAD" | "MANAGER" | "HR" | "IT_SUPPORT" | "ADMIN";
  departmentId?: string | null;
};

const COOKIE_NAME = "dejoiy_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function signAppToken(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), {
    expiresIn: "8h",
  });
}

export function verifyAppToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();

    const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
    const authHeader = headerStore.get("authorization");

    let token: string | undefined = cookieToken;

    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    }

    if (!token) {
      return null;
    }

    return verifyAppToken(token);
  } catch (error) {
    console.error("Failed to read session user:", error);
    return null;
  }
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}