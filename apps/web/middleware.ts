import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const AUTH_COOKIE = "dejoiy_token";

const publicRoutes = ["/login"];

const publicApiRoutes = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/callback",
];

function isPublicRoute(pathname: string) {
  return publicRoutes.includes(pathname);
}

function isPublicApiRoute(pathname: string) {
  return publicApiRoutes.includes(pathname);
}

function verifyToken(token?: string) {
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;

// In middleware just check token existence
// Full verification happens in API / server routes
const session = token ? true : null;

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};