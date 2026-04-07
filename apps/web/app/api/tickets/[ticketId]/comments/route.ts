import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, AppRole } from "@/lib/rbac";
import { sendEmail } from "@/lib/mail";
import { publishEvent } from "@/lib/queue";

const attachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  contentType: z.string().max(100).optional(),
});

const createCommentSchema = z.object({
  message: z.string().min(1).max(5000),
  attachments: z.array(attachmentSchema).optional(),
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
      select: {
        id: true,
        employeeId: true,
        assignedToId: true,
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

    const comments = await prisma.ticketComment.findMany({
      where: {
        ticketId: params.ticketId,
      },
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
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Get ticket comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
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

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: ticket.id,
        userId: session.id,
        message: parsed.data.message,
        attachments: parsed.data.attachments?.length
          ? {
              create: parsed.data.attachments.map((file) => ({
                fileName: file.fileName,
                fileUrl: file.fileUrl,
                contentType: file.contentType,
              })),
            }
          : undefined,
      },
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
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "TICKET_COMMENT_CREATED",
      entityType: "TicketComment",
      entityId: comment.id,
      metadata: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        attachmentCount: parsed.data.attachments?.length ?? 0,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    await publishEvent("ticket.comment.created", {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      commentId: comment.id,
      createdBy: session.id,
    });

    const recipients = new Set<string>();

    if (ticket.employee.email) {
      recipients.add(ticket.employee.email);
    }

    if (ticket.assignedTo?.email) {
      recipients.add(ticket.assignedTo.email);
    }

    if (session.email) {
      recipients.delete(session.email);
    }

    if (recipients.size > 0) {
      await sendEmail({
        to: Array.from(recipients),
        subject: `New Comment on Ticket ${ticket.ticketNumber}`,
        html: `
          <h2>New Ticket Comment</h2>
          <p>A new comment has been added to ticket <strong>${ticket.ticketNumber}</strong>.</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Comment By:</strong> ${comment.user.name}</p>
          <p><strong>Message:</strong></p>
          <div style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
            ${comment.message}
          </div>
        `,
        text: `A new comment has been added to ticket ${ticket.ticketNumber} by ${comment.user.name}.`,
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create ticket comment error:", error);
    return NextResponse.json(
      { error: "Failed to create ticket comment" },
      { status: 500 }
    );
  }
}