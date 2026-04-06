import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, AppRole } from "@/lib/rbac";
import {
  createDocumentRequestSchema,
  updateDocumentRequestSchema,
} from "@/lib/validations";
import { sendEmail } from "@/lib/mail";
import { publishEvent } from "@/lib/queue";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const canApprove = hasPermission(role, "documents:approve");
    const canCreate = hasPermission(role, "documents:create");

    if (!canApprove && !canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause: Record<string, unknown> = {};

    if (status) {
      whereClause.status = status;
    }

    if (canApprove) {
      if (employeeId) {
        whereClause.employeeId = employeeId;
      }
    } else {
      whereClause.employeeId = session.id;
    }

    const requests = await prisma.documentRequest.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Get document requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;

    if (!hasPermission(role, "documents:create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createDocumentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const isOwnRequest = parsed.data.employeeId === session.id;
    const canCreateForOthers = hasPermission(role, "documents:approve");

    if (!isOwnRequest && !canCreateForOthers) {
      return NextResponse.json(
        { error: "You can only create document requests for yourself" },
        { status: 403 }
      );
    }

    const employee = await prisma.user.findUnique({
      where: { id: parsed.data.employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (!employee.isActive) {
      return NextResponse.json(
        { error: "Employee account is inactive" },
        { status: 400 }
      );
    }

    const documentRequest = await prisma.documentRequest.create({
      data: {
        employeeId: parsed.data.employeeId,
        documentType: parsed.data.documentType,
        purpose: parsed.data.purpose,
        urgencyLevel: parsed.data.urgencyLevel,
        status: "PENDING",
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "DOCUMENT_REQUEST_CREATED",
      entityType: "DocumentRequest",
      entityId: documentRequest.id,
      metadata: {
        employeeId: documentRequest.employeeId,
        documentType: documentRequest.documentType,
        urgencyLevel: documentRequest.urgencyLevel,
        status: documentRequest.status,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    await publishEvent("document.request.created", {
      requestId: documentRequest.id,
      employeeId: documentRequest.employeeId,
      documentType: documentRequest.documentType,
      urgencyLevel: documentRequest.urgencyLevel,
      createdBy: session.id,
    });

    if (documentRequest.employee.email) {
      await sendEmail({
        to: documentRequest.employee.email,
        subject: `Document Request Submitted: ${documentRequest.documentType}`,
        html: `
          <h2>Document Request Submitted</h2>
          <p>Hello ${documentRequest.employee.name},</p>
          <p>Your document request has been submitted successfully.</p>
          <p><strong>Document Type:</strong> ${documentRequest.documentType}</p>
          <p><strong>Purpose:</strong> ${documentRequest.purpose}</p>
          <p><strong>Urgency:</strong> ${documentRequest.urgencyLevel}</p>
          <p><strong>Status:</strong> ${documentRequest.status}</p>
        `,
        text: `Your document request for ${documentRequest.documentType} has been submitted successfully.`,
      });
    }

    return NextResponse.json(documentRequest, { status: 201 });
  } catch (error) {
    console.error("Create document request error:", error);
    return NextResponse.json(
      { error: "Failed to create document request" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;

    if (!hasPermission(role, "documents:approve")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const requestId =
      typeof body?.requestId === "string" ? body.requestId : undefined;

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    const parsed = updateDocumentRequestSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existing = await prisma.documentRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Document request not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.documentRequest.update({
      where: { id: requestId },
      data: {
        status: parsed.data.status ?? undefined,
        hrNotes:
          parsed.data.hrNotes !== undefined ? parsed.data.hrNotes : undefined,
        documentUrl:
          parsed.data.documentUrl !== undefined
            ? parsed.data.documentUrl
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
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "DOCUMENT_REQUEST_UPDATED",
      entityType: "DocumentRequest",
      entityId: updated.id,
      metadata: {
        previousStatus: existing.status,
        newStatus: updated.status,
        previousHrNotes: existing.hrNotes,
        newHrNotes: updated.hrNotes,
        previousDocumentUrl: existing.documentUrl,
        newDocumentUrl: updated.documentUrl,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    await publishEvent("document.request.updated", {
      requestId: updated.id,
      employeeId: updated.employeeId,
      status: updated.status,
      updatedBy: session.id,
    });

    if (updated.employee.email) {
      await sendEmail({
        to: updated.employee.email,
        subject: `Document Request Updated: ${updated.documentType}`,
        html: `
          <h2>Document Request Update</h2>
          <p>Hello ${updated.employee.name},</p>
          <p>Your document request has been updated.</p>
          <p><strong>Document Type:</strong> ${updated.documentType}</p>
          <p><strong>Status:</strong> ${updated.status}</p>
          ${updated.hrNotes ? `<p><strong>HR Notes:</strong> ${updated.hrNotes}</p>` : ""}
          ${
            updated.documentUrl
              ? `<p><a href="${updated.documentUrl}" target="_blank" rel="noreferrer">Download Document</a></p>`
              : ""
          }
        `,
        text: `Your document request for ${updated.documentType} has been updated to ${updated.status}.`,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update document request error:", error);
    return NextResponse.json(
      { error: "Failed to update document request" },
      { status: 500 }
    );
  }
}