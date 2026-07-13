import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDateTimeID } from "@/lib/domain";

// GET /api/audit — Management "Audit Trail": append-only log of every PR/PO/GR event.
export async function GET() {
  const rows = await prisma.auditLogEntry.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json({
    rows: rows.map((a) => ({
      ts: formatDateTimeID(a.createdAt),
      entity: a.entityId,
      action: a.action + (a.comment ? ` — "${a.comment}"` : ""),
      user: a.userName,
    })),
  });
}
