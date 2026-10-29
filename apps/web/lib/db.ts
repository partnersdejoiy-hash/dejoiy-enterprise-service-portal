import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    // SUPABASE_DATABASE_URL (serveme_app role, schema serveme in the DEJOIY BPO database) wins;
    // without it the portal keeps its old DATABASE_URL, so switching back is one env var.
    datasourceUrl: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
