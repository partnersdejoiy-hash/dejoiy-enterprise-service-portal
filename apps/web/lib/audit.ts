import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type CreateAuditLogParams = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function createAuditLog(params: CreateAuditLogParams) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,

      metadata: params.metadata
        ? (params.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,

      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}