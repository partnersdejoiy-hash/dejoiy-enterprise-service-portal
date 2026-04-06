import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { hasPermission, AppRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;
    const searchParams = req.nextUrl.searchParams;

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const assignedToId = searchParams.get("assignedToId");
    const employeeId = searchParams.get("employeeId");
    const departmentId = searchParams.get("departmentId");
    const q = searchParams.get("q");

    const page = Number(searchParams.get("page") || "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") || "20"), 100);
    const skip = (page - 1) * pageSize;

    const canViewAll = hasPermission(role, "tickets:view:all");
    const canViewTeam = hasPermission(role, "tickets:view:team");
    const canViewOwn = hasPermission(role, "tickets:view:own");

    const whereClause: Record<string, unknown> = {};

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (category) whereClause.category = category;
    if (assignedToId) whereClause.assignedToId = assignedToId;
    if (departmentId) whereClause.departmentId = departmentId;

    if (q) {
      whereClause.OR = [
        {
          title: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          ticketNumber: {
            contains: q,
            mode: "insensitive",
          },
        },
      ];
    }

    if (canViewAll) {
      if (employeeId) {
        whereClause.employeeId = employeeId;
      }
    } else if (canViewTeam) {
      // Baseline team visibility by department.
      // In a more advanced system, this should use actual org hierarchy / reporting map.
      whereClause.departmentId = session.departmentId ?? undefined;

      if (employeeId) {
        whereClause.employeeId = employeeId;
      }
    } else if (canViewOwn) {
      whereClause.employeeId = session.id;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.ticket.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      data: tickets,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}