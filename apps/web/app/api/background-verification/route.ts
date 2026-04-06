import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, AppRole } from "@/lib/rbac";

const createSchema = z.object({
  employeeId: z.string().uuid(),
  verificationCompany: z.string().min(2).max(200),
  verificationStatus: z.string().min(2).max(100),
  verificationNotes: z.string().max(5000).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
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

    if (!hasPermission(role, "background:view") && role !== AppRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const verificationStatus = searchParams.get("verificationStatus");

    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const records = await prisma.backgroundVerification.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
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

    if (!hasPermission(role, "background:manage") && role !== AppRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const employee = await prisma.user.findUnique({
      where: { id: parsed.data.employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const record = await prisma.backgroundVerification.create({
      data: parsed.data,
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
      metadata: parsed.data,
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

    if (!hasPermission(role, "background:manage") && role !== AppRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.backgroundVerification.findUnique({
      where: { id: parsed.data.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.backgroundVerification.update({
      where: { id: parsed.data.id },
      data: {
        verificationCompany: parsed.data.verificationCompany ?? undefined,
        verificationStatus: parsed.data.verificationStatus ?? undefined,
        verificationNotes: parsed.data.verificationNotes ?? undefined,
        documentUrl: parsed.data.documentUrl ?? undefined,
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
        previousStatus: existing.verificationStatus,
        newStatus: updated.verificationStatus,
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