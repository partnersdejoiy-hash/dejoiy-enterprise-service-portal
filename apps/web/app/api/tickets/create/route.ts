import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, AppRole } from "@/lib/rbac";
import { generateTicketNumber } from "@/lib/ticket-id";
import { sendTicketCreatedEmail } from "@/lib/mail";
import { publishEvent } from "@/lib/queue";

const createTicketSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.enum([
    "HARDWARE",
    "SOFTWARE",
    "NETWORK",
    "VPN",
    "EMAIL",
    "ACCESS_REQUEST",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string().min(10).max(10000),
  employeeId: z.string().uuid(),
  departmentId: z.string().uuid().optional().nullable(),
  contactEmail: z.string().email(),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1).max(255),
        fileUrl: z.string().url(),
        contentType: z.string().max(100).optional(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;
    const canCreate = hasPermission(role, "tickets:create");

    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const isOwnTicket = parsed.data.employeeId === session.id;
    const canCreateForOthers =
      role === AppRole.TEAM_LEAD ||
      role === AppRole.MANAGER ||
      role === AppRole.ADMIN;

    if (!isOwnTicket && !canCreateForOthers) {
      return NextResponse.json(
        { error: "You can only create tickets for yourself" },
        { status: 403 }
      );
    }

    const employee = await prisma.user.findUnique({
      where: { id: parsed.data.employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        departmentId: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const ticketNumber = await generateTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: parsed.data.title,
        category: parsed.data.category,
        priority: parsed.data.priority,
        description: parsed.data.description,
        status: "OPEN",
        employeeId: parsed.data.employeeId,
        departmentId: parsed.data.departmentId ?? employee.departmentId ?? null,
        contactEmail: parsed.data.contactEmail,
        attachments: parsed.data.attachments?.length
          ? {
              create: parsed.data.attachments.map((file) => ({
                fileName: file.fileName,
                fileUrl: file.fileUrl,
                contentType: file.contentType,
                uploadedById: session.id,
              })),
            }
          : undefined,
      },
      include: {
        employee: {
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
        attachments: true,
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "TICKET_CREATED",
      entityType: "Ticket",
      entityId: ticket.id,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        employeeId: ticket.employeeId,
        category: ticket.category,
        priority: ticket.priority,
        attachmentCount: ticket.attachments.length,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    await publishEvent("ticket.created", {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      employeeId: ticket.employeeId,
      category: ticket.category,
      priority: ticket.priority,
      createdBy: session.id,
    });

    const recipients = new Set<string>();

    if (ticket.employee.email) {
      recipients.add(ticket.employee.email);
    }

    if (parsed.data.contactEmail) {
      recipients.add(parsed.data.contactEmail);
    }

    await sendTicketCreatedEmail({
      to: Array.from(recipients),
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      employeeName: ticket.employee.name,
      assignedTo: null,
      ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticket.id}`,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}