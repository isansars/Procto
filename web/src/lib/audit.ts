import type { PrismaClient } from "@/generated/prisma/client";

export async function logAudit(
  prisma: PrismaClient,
  entityId: string,
  entityType: "PR" | "PO" | "GR",
  action: string,
  userName: string,
  comment?: string,
) {
  await prisma.auditLogEntry.create({
    data: { entityId, entityType, action, userName, comment: comment ?? "" },
  });
}
