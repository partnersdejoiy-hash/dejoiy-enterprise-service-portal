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

    // check department
    let departmentCode = "EMP";

    if (parsed.data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: parsed.data.departmentId },
        select: { name: true },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 }
        );
      }

      departmentCode = department.name.substring(0, 3).toUpperCase();
    }

    // find last employeeId in that department
    const lastUser = await prisma.user.findFirst({
      where: {
        employeeId: {
          startsWith: departmentCode,
        },
      },
      orderBy: {
        employeeId: "desc",
      },
    });

    let nextNumber = 1;

    if (lastUser?.employeeId) {
      const numberPart = lastUser.employeeId.replace(departmentCode, "");
      nextNumber = parseInt(numberPart) + 1;
    }

    const generatedEmployeeId =
      departmentCode + String(nextNumber).padStart(3, "0");

    const passwordHash = parsed.data.password
      ? await bcrypt.hash(parsed.data.password, 10)
      : null;

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        employeeId: generatedEmployeeId,
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