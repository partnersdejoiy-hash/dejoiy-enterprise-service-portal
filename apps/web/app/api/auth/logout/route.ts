import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (session) {
      await createAuditLog({
        userId: session.id,
        action: "LOGOUT_SUCCESS",
        entityType: "User",
        entityId: session.id,
        metadata: {
          email: session.email,
          role: session.role,
        },
        ipAddress: req.ip ?? "",
        userAgent: req.headers.get("user-agent") ?? "",
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set("dejoiy_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}