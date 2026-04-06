import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, AppRole } from "@/lib/rbac";
import {
  createEmploymentVerificationSchema,
  updateEmploymentVerificationSchema,
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

    const canApprove = hasPermission(role, "verification:approve");
    const canCreate = hasPermission(role, "verification:create");

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

    const records = await prisma.employmentVerification.findMany({
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
    console.error("Get employment verification records error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employment verification records" },
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

    if (!hasPermission(role, "verification:create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createEmploymentVerificationSchema.safeParse(body);

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
    const canCreateForOthers = hasPermission(role, "verification:approve");

    if (!isOwnRequest && !canCreateForOthers) {
      return NextResponse.json(
        { error: "You can only create verification requests for yourself" },
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

    const record = await prisma.employmentVerification.create({
      data: {
        employeeId: parsed.data.employeeId,
        employeeName: parsed.data.employeeName,
        companyName: parsed.data.companyName,
        requestEmail: parsed.data.requestEmail,
        verificationPurpose: parsed.data.verificationPurpose,
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
      action: "EMPLOYMENT_VERIFICATION_CREATED",
      entityType: "EmploymentVerification",
      entityId: record.id,
      metadata: {
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        companyName: record.companyName,
        requestEmail: record.requestEmail,
        status: record.status,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    await publishEvent("employment.verification.created", {
      verificationId: record.id,
      employeeId: record.employeeId,
      companyName: record.companyName,
      requestEmail: record.requestEmail,
      createdBy: session.id,
    });

    if (record.employee.email) {
      await sendEmail({
        to: record.employee.email,
        subject: `Employment Verification Submitted: ${record.companyName}`,
        html: `
          <h2>Employment Verification Submitted</h2>
          <p>Hello ${record.employee.name},</p>
          <p>Your employment verification request has been submitted successfully.</p>
          <p><strong>Company Name:</strong> ${record.companyName}</p>
          <p><strong>Request Email:</strong> ${record.requestEmail}</p>
          <p><strong>Purpose:</strong> ${record.verificationPurpose}</p>
          <p><strong>Status:</strong> ${record.status}</p>
        `,
        text: `Your employment verification request for ${record.companyName} has been submitted successfully.`,
      });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Create employment verification error:", error);
    return NextResponse.json(
      { error: "Failed to create employment verification request" },
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

    if (!hasPermission(role, "verification:approve")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const verificationId =
      typeof body?.verificationId === "string" ? body.verificationId : undefined;

    if (!verificationId) {
      return NextResponse.json(
        { error: "verificationId is required" },
        { status: 400 }
      );
    }

    const parsed = updateEmploymentVerificationSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existing = await prisma.employmentVerification.findUnique({
      where: { id: verificationId },
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
        { error: "Employment verification record not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.employmentVerification.update({
      where: { id: verificationId },
      data: {
        status: parsed.data.status ?? undefined,
        hrNotes:
          parsed.data.hrNotes !== undefined ? parsed.data.hrNotes : undefined,
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
      action: "EMPLOYMENT_VERIFICATION_UPDATED",
      entityType: "EmploymentVerification",
      entityId: updated.id,
      metadata: {
        previousStatus: existing.status,
        newStatus: updated.status,
        previousHrNotes: existing.hrNotes,
        newHrNotes: updated.hrNotes,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    await publishEvent("employment.verification.updated", {
      verificationId: updated.id,
      employeeId: updated.employeeId,
      status: updated.status,
      updatedBy: session.id,
    });

    if (updated.employee.email) {
      await sendEmail({
        to: updated.employee.email,
        subject: `Employment Verification Updated: ${updated.companyName}`,
        html: `
          <h2>Employment Verification Update</h2>
          <p>Hello ${updated.employee.name},</p>
          <p>Your employment verification request has been updated.</p>
          <p><strong>Company Name:</strong> ${updated.companyName}</p>
          <p><strong>Status:</strong> ${updated.status}</p>
          ${updated.hrNotes ? `<p><strong>HR Notes:</strong> ${updated.hrNotes}</p>` : ""}
        `,
        text: `Your employment verification request for ${updated.companyName} has been updated to ${updated.status}.`,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update employment verification error:", error);
    return NextResponse.json(
      { error: "Failed to update employment verification request" },
      { status: 500 }
    );
  }
}