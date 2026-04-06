import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {

    const [
      totalUsers,
      totalTickets,
      openTickets,
      closedTickets,
      totalDepartments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.ticket.count(),
      prisma.ticket.count({
        where: { status: "OPEN" }
      }),
      prisma.ticket.count({
        where: { status: "RESOLVED" }
      }),
      prisma.department.count()
    ]);

    return NextResponse.json({
      users: totalUsers,
      tickets: totalTickets,
      openTickets,
      closedTickets,
      departments: totalDepartments
    });

  } catch (error) {

    console.error("Analytics error:", error);

    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );

  }
}