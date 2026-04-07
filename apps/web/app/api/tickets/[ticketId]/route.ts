import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, AppRole } from "@/lib/rbac";
import {
  sendTicketResolvedEmail,
  sendTicketUpdatedEmail,
} from "@/lib/mail";

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
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      include: {
        employee: true,
        assignedTo: true,
      },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const role = session.role as AppRole;

    if (!hasPermission(role, "tickets:update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        employee: true,
        assignedTo: true,
      },
    });

    /* ---------------- AUDIT LOG ---------------- */

    await createAuditLog({
      userId: session.id,
      action: "TICKET_UPDATED",
      entityType: "Ticket",
      entityId: updatedTicket.id,
      metadata: {
        previousStatus: existingTicket.status,
        newStatus: updatedTicket.status,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    /* ---------------- EMAIL NOTIFICATIONS ---------------- */

    const recipients = new Set<string>();

    if (updatedTicket.employee?.email) {
      recipients.add(updatedTicket.employee.email);
    }

    if (updatedTicket.assignedTo?.email) {
      recipients.add(updatedTicket.assignedTo.email);
    }

    if (session.email) {
      recipients.delete(session.email);
    }

    const emailList = Array.from(recipients);

    if (emailList.length > 0) {

      /* Ticket resolved email */

      if (
        updatedTicket.status === "RESOLVED" &&
        existingTicket.status !== "RESOLVED"
      ) {
        await sendTicketResolvedEmail({
          to: emailList,
          ticketNumber: updatedTicket.ticketNumber,
          title: updatedTicket.title,
          status: updatedTicket.status,
          priority: updatedTicket.priority,
          employeeName: updatedTicket.employee.name,
          assignedTo: updatedTicket.assignedTo?.name ?? null,
          ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${updatedTicket.id}`,
        });
      }

      /* Generic update email */

      else {
        await sendTicketUpdatedEmail({
          to: emailList,
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