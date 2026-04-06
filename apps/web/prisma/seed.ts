import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Jaymaakaali@321", 10);

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: "IT Support" },
      update: {
        description: "Internal technical support and infrastructure operations",
      },
      create: {
        name: "IT Support",
        description: "Internal technical support and infrastructure operations",
      },
    }),
    prisma.department.upsert({
      where: { name: "Human Resources" },
      update: {
        description: "HR operations, documents, employee services, and compliance",
      },
      create: {
        name: "Human Resources",
        description: "HR operations, documents, employee services, and compliance",
      },
    }),
    prisma.department.upsert({
      where: { name: "Engineering" },
      update: {
        description: "Software engineering and product delivery",
      },
      create: {
        name: "Engineering",
        description: "Software engineering and product delivery",
      },
    }),
    prisma.department.upsert({
      where: { name: "Operations" },
      update: {
        description: "Business operations and execution support",
      },
      create: {
        name: "Operations",
        description: "Business operations and execution support",
      },
    }),
  ]);

  const itDepartment = departments.find((d) => d.name === "IT Support");
  const hrDepartment = departments.find((d) => d.name === "Human Resources");
  const engineeringDepartment = departments.find((d) => d.name === "Engineering");
  const operationsDepartment = departments.find((d) => d.name === "Operations");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@corp.dejoiy.com" },
    update: {
      name: "DEJOIY Super Admin",
      passwordHash,
      role: Role.ADMIN,
      employeeId: "DEJ-ADMIN-001",
      isActive: true,
      departmentId: itDepartment?.id,
    },
    create: {
      name: "DEJOIY Super Admin",
      email: "admin@corp.dejoiy.com",
      passwordHash,
      role: Role.ADMIN,
      employeeId: "DEJ-ADMIN-001",
      isActive: true,
      departmentId: itDepartment?.id,
    },
  });

  const itSupportUser = await prisma.user.upsert({
    where: { email: "it.support@corp.dejoiy.com" },
    update: {
      name: "Amit IT",
      passwordHash,
      role: Role.IT_SUPPORT,
      employeeId: "DEJ-IT-001",
      isActive: true,
      departmentId: itDepartment?.id,
    },
    create: {
      name: "Amit IT",
      email: "it.support@corp.dejoiy.com",
      passwordHash,
      role: Role.IT_SUPPORT,
      employeeId: "DEJ-IT-001",
      isActive: true,
      departmentId: itDepartment?.id,
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: "hr@corp.dejoiy.com" },
    update: {
      name: "Priya HR",
      passwordHash,
      role: Role.HR,
      employeeId: "DEJ-HR-001",
      isActive: true,
      departmentId: hrDepartment?.id,
    },
    create: {
      name: "Priya HR",
      email: "hr@corp.dejoiy.com",
      passwordHash,
      role: Role.HR,
      employeeId: "DEJ-HR-001",
      isActive: true,
      departmentId: hrDepartment?.id,
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: "employee@corp.dejoiy.com" },
    update: {
      name: "Rahul Employee",
      passwordHash,
      role: Role.EMPLOYEE,
      employeeId: "DEJ-EMP-001",
      isActive: true,
      departmentId: engineeringDepartment?.id,
    },
    create: {
      name: "Rahul Employee",
      email: "employee@corp.dejoiy.com",
      passwordHash,
      role: Role.EMPLOYEE,
      employeeId: "DEJ-EMP-001",
      isActive: true,
      departmentId: engineeringDepartment?.id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@corp.dejoiy.com" },
    update: {
      name: "Neha Manager",
      passwordHash,
      role: Role.MANAGER,
      employeeId: "DEJ-MGR-001",
      isActive: true,
      departmentId: operationsDepartment?.id,
    },
    create: {
      name: "Neha Manager",
      email: "manager@corp.dejoiy.com",
      passwordHash,
      role: Role.MANAGER,
      employeeId: "DEJ-MGR-001",
      isActive: true,
      departmentId: operationsDepartment?.id,
    },
  });

  const existingOpenTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: "DEJ-IT-0001",
    },
  });

  if (!existingOpenTicket) {
    await prisma.ticket.create({
      data: {
        ticketNumber: "DEJ-IT-0001",
        title: "VPN not connecting from home network",
        description:
          "Unable to connect to office VPN from home Wi-Fi. Error appears after authentication and blocks access to internal tools.",
        category: "VPN",
        status: "IN_PROGRESS",
        priority: "HIGH",
        contactEmail: employeeUser.email,
        employeeId: employeeUser.id,
        assignedToId: itSupportUser.id,
        departmentId: engineeringDepartment?.id,
        comments: {
          create: [
            {
              userId: employeeUser.id,
              message:
                "Facing this since morning. I already restarted my laptop and router.",
            },
            {
              userId: itSupportUser.id,
              message:
                "We are checking your VPN profile and firewall policy. Please keep the device online.",
            },
          ],
        },
      },
    });
  }

  const existingHardwareTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: "DEJ-IT-0002",
    },
  });

  if (!existingHardwareTicket) {
    await prisma.ticket.create({
      data: {
        ticketNumber: "DEJ-IT-0002",
        title: "Laptop keyboard issue",
        description:
          "Several keys are intermittently not working, affecting productivity during daily operations.",
        category: "HARDWARE",
        status: "ASSIGNED",
        priority: "MEDIUM",
        contactEmail: managerUser.email,
        employeeId: managerUser.id,
        assignedToId: itSupportUser.id,
        departmentId: operationsDepartment?.id,
      },
    });
  }

  const existingDocumentRequest = await prisma.documentRequest.findFirst({
    where: {
      employeeId: employeeUser.id,
      documentType: "Employment Letter",
    },
  });

  if (!existingDocumentRequest) {
    await prisma.documentRequest.create({
      data: {
        employeeId: employeeUser.id,
        documentType: "Employment Letter",
        purpose: "Required for rental agreement and address proof submission.",
        urgencyLevel: "MEDIUM",
        status: "PENDING",
      },
    });
  }

  const existingEmploymentVerification =
    await prisma.employmentVerification.findFirst({
      where: {
        employeeId: employeeUser.id,
        companyName: "ABC Financial Services",
      },
    });

  if (!existingEmploymentVerification) {
    await prisma.employmentVerification.create({
      data: {
        employeeId: employeeUser.id,
        employeeName: employeeUser.name,
        companyName: "ABC Financial Services",
        requestEmail: "verification@abcfinancial.com",
        verificationPurpose: "Home loan employment verification",
        status: "PENDING",
      },
    });
  }

  const existingBackgroundVerification =
    await prisma.backgroundVerification.findFirst({
      where: {
        employeeId: employeeUser.id,
        verificationCompany: "SecureCheck Pvt Ltd",
      },
    });

  if (!existingBackgroundVerification) {
    await prisma.backgroundVerification.create({
      data: {
        employeeId: employeeUser.id,
        verificationCompany: "SecureCheck Pvt Ltd",
        verificationStatus: "Pending Review",
        verificationNotes:
          "Awaiting final address validation and education check closure.",
      },
    });
  }

  const existingArticle = await prisma.learningArticle.findUnique({
    where: {
      slug: "vpn-troubleshooting-guide",
    },
  });

  if (!existingArticle) {
    await prisma.learningArticle.create({
      data: {
        title: "VPN Troubleshooting Guide",
        slug: "vpn-troubleshooting-guide",
        excerpt:
          "Step-by-step guide for resolving the most common VPN connectivity issues.",
        content: `This guide helps employees troubleshoot common VPN issues.

1. Confirm internet connectivity.
2. Restart the VPN client.
3. Verify your credentials.
4. Ensure firewall or antivirus is not blocking the VPN.
5. Contact IT Support if the problem persists.

For recurring issues, attach screenshots and error messages when raising a ticket.`,
        published: true,
        authorId: adminUser.id,
      },
    });
  }

  await prisma.ticketCounter.upsert({
    where: { id: "ticket_counter" },
    update: {
      value: 2,
    },
    create: {
      id: "ticket_counter",
      value: 2,
    },
  });

  console.log("Seed completed successfully.");
  console.log("Default admin login:");
  console.log("Email: admin@corp.dejoiy.com");
  console.log("Password: Jaymaakaali@321");
  console.log("Other sample users:");
  console.log("it.support@corp.dejoiy.com / Jaymaakaali@321");
  console.log("hr@corp.dejoiy.com / Jaymaakaali@321");
  console.log("employee@corp.dejoiy.com / Jaymaakaali@321");
  console.log("manager@corp.dejoiy.com / Jaymaakaali@321");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });