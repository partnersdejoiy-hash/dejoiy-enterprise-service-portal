import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const AUTH_COOKIE = "dejoiy_token";

const publicRoutes = [
  "/",
  "/login",
];

const publicApiRoutes = [
  "/api/auth/login",
  "/api/auth/logout",
];

function isPublicRoute(pathname: string) {
  return publicRoutes.includes(pathname);
}

function isPublicApiRoute(pathname: string) {
  return publicApiRoutes.includes(pathname);
}

function verifyToken(token?: string) {
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore Next internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = verifyToken(token);

  // Prevent logged-in users from going back to login
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow public pages
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Protect everything else
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