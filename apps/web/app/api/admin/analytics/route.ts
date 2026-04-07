import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();

    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    });

    const inactiveUsers = await prisma.user.count({
      where: { isActive: false },
    });

    const admins = await prisma.user.count({
      where: {
        role: { in: ["ADMIN", "IT"] },
      },
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      admins,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}