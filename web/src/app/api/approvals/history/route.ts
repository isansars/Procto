import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, forbidden } from "@/lib/api";
import { getViewRole } from "@/lib/actor";
import { decisionBadge, decisionLabel, formatDateTimeID, rp, statusBadge, PR_STATUS_LABEL } from "@/lib/domain";
import type { Prisma } from "@/generated/prisma/client";
import { prTotal, type PRWithRelations } from "@/lib/viewmodels";
import { prInclude } from "@/lib/viewmodels";

// GET /api/approvals/history — the permanent, append-only decision log —
// scoped per role: approver sees their level, requester their department,
// management sees everything.
export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  const viewRole = getViewRole(req);

  let where: Prisma.ApprovalRecordWhereInput = {};
  if (viewRole === "approver") {
    if (!actor.approvalLevel) return forbidden("This persona has no approval level.");
    where = { level: actor.approvalLevel };
  } else if (viewRole === "requester") {
    if (!actor.branchId || !actor.departmentId) return forbidden("No department to scope to.");
    const mine = await prisma.purchaseRequest.findMany({
      where: { branchId: actor.branchId, departmentId: actor.departmentId },
      select: { id: true },
    });
    where = { prId: { in: mine.map((p) => p.id) } };
  } else if (viewRole !== "management") {
    return forbidden("This view is only available to approver, requester or management.");
  }

  const recs = await prisma.approvalRecord.findMany({
    where,
    include: { approver: true, pr: { include: prInclude } },
    orderBy: { createdAt: "desc" },
  });

  const rows = recs.map((r) => {
    const pr = r.pr as PRWithRelations;
    const dBadge = decisionBadge(r.decision);
    const sBadge = statusBadge(PR_STATUS_LABEL[pr.status]);
    return {
      ref: r.id,
      prId: r.prId,
      levelName: r.levelName,
      approver: r.approver.name,
      decision: decisionLabel(r.decision),
      dBg: dBadge.bg,
      dFg: dBadge.fg,
      comment: r.comment || "—",
      ts: formatDateTimeID(r.createdAt),
      prStatus: PR_STATUS_LABEL[pr.status],
      sBg: sBadge.bg,
      sFg: sBadge.fg,
      amount: rp(prTotal(pr)),
    };
  });

  return NextResponse.json({ rows });
}
