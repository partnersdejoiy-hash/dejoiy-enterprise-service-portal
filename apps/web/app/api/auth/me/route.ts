import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        keycloakId: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "User account is inactive" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: user.id,
      keycloakId: user.keycloakId,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      department: user.department,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Fetch current user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch current user" },
      { status: 500 }
    );
  }
}
