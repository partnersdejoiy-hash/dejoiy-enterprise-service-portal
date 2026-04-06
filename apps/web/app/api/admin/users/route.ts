import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, AppRole } from "@/lib/rbac";
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
} from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;

    if (!hasPermission(role, "admin:users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query");
    const filterRole = searchParams.get("role");
    const isActive = searchParams.get("isActive");

    const whereClause: Record<string, unknown> = {};

    if (filterRole) {
      whereClause.role = filterRole;
    }

    if (isActive === "true") {
      whereClause.isActive = true;
    }

    if (isActive === "false") {
      whereClause.isActive = false;
    }

    if (query) {
      whereClause.OR = [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          employeeId: {
            contains: query,
            mode: "insensitive",
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
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

    if (!hasPermission(role, "admin:users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (existingByEmail) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    if (parsed.data.employeeId) {
      const existingByEmployeeId = await prisma.user.findUnique({
        where: { employeeId: parsed.data.employeeId },
        select: { id: true },
      });

      if (existingByEmployeeId) {
        return NextResponse.json(
          { error: "A user with this employee ID already exists" },
          { status: 409 }
        );
      }
    }

    if (parsed.data.keycloakId) {
      const existingByKeycloakId = await prisma.user.findUnique({
        where: { keycloakId: parsed.data.keycloakId },
        select: { id: true },
      });

      if (existingByKeycloakId) {
        return NextResponse.json(
          { error: "A user with this Keycloak ID already exists" },
          { status: 409 }
        );
      }
    }

    if (parsed.data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: parsed.data.departmentId },
        select: { id: true },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }
    }

    const passwordHash = parsed.data.password
      ? await bcrypt.hash(parsed.data.password, 10)
      : null;

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        employeeId: parsed.data.employeeId ?? null,
        role: parsed.data.role,
        departmentId: parsed.data.departmentId ?? null,
        keycloakId: parsed.data.keycloakId ?? null,
        avatarUrl: parsed.data.avatarUrl ?? null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
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
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      metadata: {
        createdUserEmail: user.email,
        createdUserRole: user.role,
        createdUserDepartmentId: user.department?.id ?? null,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Create admin user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
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

    if (!hasPermission(role, "admin:users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (parsed.data.data.email && parsed.data.data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: parsed.data.data.email },
        select: { id: true },
      });

      if (emailTaken) {
        return NextResponse.json(
          { error: "Another user already uses this email" },
          { status: 409 }
        );
      }
    }

    if (
      parsed.data.data.employeeId &&
      parsed.data.data.employeeId !== existingUser.employeeId
    ) {
      const employeeIdTaken = await prisma.user.findUnique({
        where: { employeeId: parsed.data.data.employeeId },
        select: { id: true },
      });

      if (employeeIdTaken) {
        return NextResponse.json(
          { error: "Another user already uses this employee ID" },
          { status: 409 }
        );
      }
    }

    if (
      parsed.data.data.keycloakId &&
      parsed.data.data.keycloakId !== existingUser.keycloakId
    ) {
      const keycloakIdTaken = await prisma.user.findUnique({
        where: { keycloakId: parsed.data.data.keycloakId },
        select: { id: true },
      });

      if (keycloakIdTaken) {
        return NextResponse.json(
          { error: "Another user already uses this Keycloak ID" },
          { status: 409 }
        );
      }
    }

    if (parsed.data.data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: parsed.data.data.departmentId },
        select: { id: true },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }
    }

    const passwordHash =
      parsed.data.data.password !== undefined
        ? await bcrypt.hash(parsed.data.data.password, 10)
        : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.data.name ?? undefined,
        email: parsed.data.data.email ?? undefined,
        passwordHash,
        employeeId:
          parsed.data.data.employeeId !== undefined
            ? parsed.data.data.employeeId
            : undefined,
        role: parsed.data.data.role ?? undefined,
        departmentId:
          parsed.data.data.departmentId !== undefined
            ? parsed.data.data.departmentId
            : undefined,
        keycloakId:
          parsed.data.data.keycloakId !== undefined
            ? parsed.data.data.keycloakId
            : undefined,
        avatarUrl:
          parsed.data.data.avatarUrl !== undefined
            ? parsed.data.data.avatarUrl
            : undefined,
        isActive:
          parsed.data.data.isActive !== undefined
            ? parsed.data.data.isActive
            : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
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
      action: "USER_UPDATED",
      entityType: "User",
      entityId: updatedUser.id,
      metadata: {
        previousName: existingUser.name,
        newName: updatedUser.name,
        previousEmail: existingUser.email,
        newEmail: updatedUser.email,
        previousRole: existingUser.role,
        newRole: updatedUser.role,
        previousIsActive: existingUser.isActive,
        newIsActive: updatedUser.isActive,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update admin user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;

    if (!hasPermission(role, "admin:users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = deleteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (parsed.data.userId === session.id) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
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
      action: "USER_DEACTIVATED",
      entityType: "User",
      entityId: updatedUser.id,
      metadata: {
        deactivatedUserEmail: updatedUser.email,
        previousIsActive: existingUser.isActive,
        newIsActive: updatedUser.isActive,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Deactivate admin user error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate user" },
      { status: 500 }
    );
  }
}