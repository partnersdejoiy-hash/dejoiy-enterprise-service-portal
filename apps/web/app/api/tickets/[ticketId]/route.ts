import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, AppRole } from "@/lib/rbac";
import {
  sendTicketResolvedEmail,
  sendTicketUpdatedEmail,
} from "@/lib/mail";
import { publishEvent } from "@/lib/queue";

const updateTicketSchema = z.object({
  status: z
    .enum([
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "PENDING",
      "WAITING_FOR_EMPLOYEE",
      "RESOLVED",
      "CLOSED",
    ])
    .optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

function canAccessTicket(params: {
  role: AppRole;
  sessionUserId: string;
  ticketEmployeeId: string;
  ticketAssignedToId?: string | null;
}) {
  const canViewAll = hasPermission(params.role, "tickets:view:all");

  if (canViewAll) return true;
  if (params.ticketEmployeeId === params.sessionUserId) return true;
  if (params.ticketAssignedToId === params.sessionUserId) return true;

  return false;
}

function canUpdateTicket(params: {
  role: AppRole;
  sessionUserId: string;
  ticketEmployeeId: string;
  ticketAssignedToId?: string | null;
}) {
  const canAssign = hasPermission(params.role, "tickets:assign");
  const canUpdate = hasPermission(params.role, "tickets:update");

  if (canAssign || canUpdate) return true;

  // Optional future policy:
  // allow owners to update limited fields only, such as responding or reopening.
  if (params.ticketEmployeeId === params.sessionUserId) {
    return false;
  }

  return false;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            role: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const role = session.role as AppRole;

    const allowed = canAccessTicket({
      role,
      sessionUserId: session.id,
      ticketEmployeeId: ticket.employeeId,
      ticketAssignedToId: ticket.assignedToId,
    });

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Get ticket error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const role = session.role as AppRole;

    const allowed = canUpdateTicket({
      role,
      sessionUserId: session.id,
      ticketEmployeeId: existingTicket.employeeId,
      ticketAssignedToId: existingTicket.assignedToId,
    });

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (parsed.data.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: parsed.data.assignedToId },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!assignee) {
        return NextResponse.json(
          { error: "Assigned user not found" },
          { status: 404 }
        );
      }

      if (!assignee.isActive) {
        return NextResponse.json(
          { error: "Assigned user is inactive" },
          { status: 400 }
        );
      }

      const validAssigneeRoles = [AppRole.IT_SUPPORT, AppRole.ADMIN];

      if (!validAssigneeRoles.includes(assignee.role as AppRole)) {
        return NextResponse.json(
          { error: "Ticket can only be assigned to IT Support or Admin users" },
          { status: 400 }
        );
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: params.ticketId },
      data: {
        status: parsed.data.status ?? undefined,
        assignedToId:
          parsed.data.assignedToId !== undefined
            ? parsed.data.assignedToId
            : undefined,
        priority: parsed.data.priority ?? undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "TICKET_UPDATED",
      entityType: "Ticket",
      entityId: updatedTicket.id,
      metadata: {
        previousStatus: existingTicket.status,
        newStatus: updatedTicket.status,
        previousAssignedToId: existingTicket.assignedToId,
        newAssignedToId: updatedTicket.assignedToId,
        previousPriority: existingTicket.priority,
        newPriority: updatedTicket.priority,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    await publishEvent("ticket.updated", {
      ticketId: updatedTicket.id,
      ticketNumber: updatedTicket.ticketNumber,
      status: updatedTicket.status,
      assignedToId: updatedTicket.assignedToId,
      priority: updatedTicket.priority,
      updatedBy: session.id,
    });

    const recipients = new Set<string>();

    if (updatedTicket.employee.email) {
      recipients.add(updatedTicket.employee.email);
    }

    if (updatedTicket.assignedTo?.email) {
      recipients.add(updatedTicket.assignedTo.email);
    }

    if (session.email) {
      recipients.delete(session.email);
    }

    if (recipients.size > 0) {
      if (updatedTicket.status === "RESOLVED") {
        await sendTicketResolvedEmail({
          to: Array.from(recipients),
          ticketNumber: updatedTicket.ticketNumber,
          title: updatedTicket.title,
          status: updatedTicket.status,
          priority: updatedTicket.priority,
          employeeName: updatedTicket.employee.name,
          assignedTo: updatedTicket.assignedTo?.name ?? null,
          ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${updatedTicket.id}`,
        });
      } else {
        await sendTicketUpdatedEmail({
          to: Array.from(recipients),
          ticketNumber: updatedTicket.ticketNumber,
          title: updatedTicket.title,
          status: updatedTicket.status,
          priority: updatedTicket.priority,
          employeeName: updatedTicket.employee.name,
          assignedTo: updatedTicket.assignedTo?.name ?? null,
          ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${updatedTicket.id}`,
        });
      }
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}