import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signAppToken } from "@/lib/server/auth";
import { createAuditLog } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

function getRequestIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid credentials format",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const { password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "User account is inactive" },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error:
            "Password login is not enabled for this account. Please use SSO.",
        },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await createAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        entityType: "User",
        entityId: user.id,
        metadata: {
          email,
          reason: "INVALID_PASSWORD",
        },
        ipAddress: getRequestIp(req),
        userAgent: req.headers.get("user-agent") ?? "",
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = signAppToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
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
      },
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get("user-agent") ?? "",
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          employeeId: user.employeeId,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          department: user.department,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );

    response.cookies.set("dejoiy_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
