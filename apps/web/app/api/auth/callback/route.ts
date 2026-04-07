import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signAppToken } from "@/lib/server/auth";
import { createAuditLog } from "@/lib/audit";
import { AppRole } from "@/lib/rbac";

type KeycloakTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  refresh_token?: string;
  token_type: string;
  id_token?: string;
  scope?: string;
};

type KeycloakUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function inferRoleFromEmail(email?: string | null): AppRole {
  if (!email) return AppRole.EMPLOYEE;

  const normalized = email.toLowerCase();

  if (normalized.includes("admin")) return AppRole.ADMIN;
  if (normalized.includes("it.support") || normalized.includes("itsupport")) {
    return AppRole.IT_SUPPORT;
  }
  if (normalized.includes("hr")) return AppRole.HR;
  if (normalized.includes("manager")) return AppRole.MANAGER;
  if (normalized.includes("lead")) return AppRole.TEAM_LEAD;

  return AppRole.EMPLOYEE;
}

async function exchangeCodeForToken(code: string, redirectUri: string) {
  const keycloakBaseUrl = getRequiredEnv("NEXT_PUBLIC_KEYCLOAK_URL");
  const realm = getRequiredEnv("NEXT_PUBLIC_KEYCLOAK_REALM");
  const clientId = getRequiredEnv("KEYCLOAK_CLIENT_ID");
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  const tokenEndpoint = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code for token: ${errorText}`);
  }

  return (await response.json()) as KeycloakTokenResponse;
}

async function fetchUserInfo(accessToken: string) {
  const keycloakBaseUrl = getRequiredEnv("NEXT_PUBLIC_KEYCLOAK_URL");
  const realm = getRequiredEnv("NEXT_PUBLIC_KEYCLOAK_REALM");

  const userInfoEndpoint = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/userinfo`;

  const response = await fetch(userInfoEndpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch user info: ${errorText}`);
  }

  return (await response.json()) as KeycloakUserInfo;
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", error);
      return NextResponse.redirect(loginUrl);
    }

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const redirectUri = `${appUrl}/api/auth/callback`;

    const tokenResponse = await exchangeCodeForToken(code, redirectUri);
    const userInfo = await fetchUserInfo(tokenResponse.access_token);

    if (!userInfo.sub) {
      return NextResponse.json(
        { error: "Invalid user info response from identity provider" },
        { status: 400 }
      );
    }

    const email = userInfo.email?.toLowerCase() ?? null;
    const name =
      userInfo.name ||
      [userInfo.given_name, userInfo.family_name].filter(Boolean).join(" ") ||
      userInfo.preferred_username ||
      email ||
      "Enterprise User";

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { keycloakId: userInfo.sub },
          ...(email ? [{ email }] : []),
        ],
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      if (!email) {
        return NextResponse.json(
          { error: "Email not provided by identity provider" },
          { status: 400 }
        );
      }

      user = await prisma.user.create({
        data: {
          keycloakId: userInfo.sub,
          name,
          email,
          role: inferRoleFromEmail(email),
          isActive: true,
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          keycloakId: userInfo.sub,
          name,
          email: email ?? user.email,
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "User account is inactive" },
        { status: 403 }
      );
    }

    const token = signAppToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as AppRole,
      departmentId: user.departmentId,
    });

    await createAuditLog({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
        authProvider: "KEYCLOAK",
        keycloakId: user.keycloakId,
        state,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    const response = NextResponse.redirect(new URL("/dashboard", req.url));

    response.cookies.set("dejoiy_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Auth callback error:", error);

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "sso_callback_failed");

    return NextResponse.redirect(loginUrl);
  }
}
