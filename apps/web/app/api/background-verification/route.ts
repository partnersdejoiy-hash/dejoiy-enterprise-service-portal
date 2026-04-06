import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, AppRole } from "@/lib/rbac";

const createBackgroundVerificationSchema = z.object({
  employeeId: z.string().uuid(),
  verificationCompany: z.string().min(2).max(200),
  verificationStatus: z.string().min(2).max(100),
  verificationNotes: z.string().max(5000).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

const updateBackgroundVerificationSchema = z.object({
  verificationCompany: z.string().min(2).max(200).optional(),
  verificationStatus: z.string().min(2).max(100).optional(),
  verificationNotes: z.string().max(5000).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;
    const canView = hasPermission(role, "background:view");
    const searchParams = req.nextUrl.searchParams;

    const employeeId = searchParams.get("employeeId");
    const verificationStatus = searchParams.get("verificationStatus");

    if (!canView && role !== AppRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause: Record<string, unknown> = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (verificationStatus) {
      whereClause.verificationStatus = verificationStatus;
    }

    const records = await prisma.backgroundVerification.findMany({
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

    return NextResponse.json(records);
  } catch (error) {
    console.error("Get background verification error:", error);
    return NextResponse.json(
      { error: "Failed to fetch background verification records" },
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
    const canManage = hasPermission(role, "background:manage");

    if (!canManage && role !== AppRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createBackgroundVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const employee = await prisma.user.findUnique({
      where: { id: parsed.data.employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const record = await prisma.backgroundVerification.create({
      data: {
        employeeId: parsed.data.employeeId,
        verificationCompany: parsed.data.verificationCompany,
        verificationStatus: parsed.data.verificationStatus,
        verificationNotes: parsed.data.verificationNotes ?? null,
        documentUrl: parsed.data.documentUrl ?? null,
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
      action: "BACKGROUND_VERIFICATION_CREATED",
      entityType: "BackgroundVerification",
      entityId: record.id,
      metadata: {
        employeeId: record.employeeId,
        verificationCompany: record.verificationCompany,
        verificationStatus: record.verificationStatus,
        hasDocumentUrl: Boolean(record.documentUrl),
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Create background verification error:", error);
    return NextResponse.json(
      { error: "Failed to create background verification record" },
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
    const canManage = hasPermission(role, "background:manage");

    if (!canManage && role !== AppRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const payloadSchema = z.object({
      backgroundVerificationId: z.string().uuid(),
      data: updateBackgroundVerificationSchema,
    });

    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existing = await prisma.backgroundVerification.findUnique({
      where: { id: parsed.data.backgroundVerificationId },
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

    if (!existing) {
      return NextResponse.json(
        { error: "Background verification record not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.backgroundVerification.update({
      where: { id: parsed.data.backgroundVerificationId },
      data: {
        verificationCompany:
          parsed.data.data.verificationCompany ?? undefined,
        verificationStatus:
          parsed.data.data.verificationStatus ?? undefined,
        verificationNotes:
          parsed.data.data.verificationNotes !== undefined
            ? parsed.data.data.verificationNotes
            : undefined,
        documentUrl:
          parsed.data.data.documentUrl !== undefined
            ? parsed.data.data.documentUrl
            : undefined,
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
      action: "BACKGROUND_VERIFICATION_UPDATED",
      entityType: "BackgroundVerification",
      entityId: updated.id,
      metadata: {
        previousVerificationCompany: existing.verificationCompany,
        newVerificationCompany: updated.verificationCompany,
        previousStatus: existing.verificationStatus,
        newStatus: updated.verificationStatus,
        hadDocumentUrl: Boolean(existing.documentUrl),
        hasDocumentUrl: Boolean(updated.documentUrl),
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update background verification error:", error);
    return NextResponse.json(
      { error: "Failed to update background verification record" },
      { status: 500 }
    );
  }
}