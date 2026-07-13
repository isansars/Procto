import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, forbidden } from "@/lib/api";
import { getViewRole } from "@/lib/actor";
import { LEVEL_NAMES, LEVEL_WHO, formatDateTimeID } from "@/lib/domain";
import { chainOf, prInclude, vmPR, type PRWithRelations } from "@/lib/viewmodels";
import type { Prisma } from "@/generated/prisma/client";

const SHORT: Record<string, string> = { dept: "Dept", branch: "Branch", finance: "Finance", exec: "Exec" };
const IN_FLIGHT = ["PENDING_APPROVAL", "APPROVED", "IN_PROCUREMENT", "FULFILLED"] as const;

// GET /api/approvals/tracker — Requester & Management "Approvals" module: every
// in-flight (or resolved) PR with its approval-chain progress.
export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  const viewRole = getViewRole(req);

  let where: Prisma.PurchaseRequestWhereInput = { status: { in: [...IN_FLIGHT] } };
  let sub: string;
  if (viewRole === "requester") {
    if (!actor.branchId || !actor.departmentId) return forbidden("No department to scope to.");
    where = { ...where, branchId: actor.branchId, departmentId: actor.departmentId };
    sub = "Requests from your department in the approval chain or beyond — decisions land in the history below";
  } else if (viewRole === "management") {
    sub = "All requests currently waiting in the approval chain — every department and branch · decisions land in the history below";
  } else {
    return forbidden("This view is only available to requester or management.");
  }

  const prs = await prisma.purchaseRequest.findMany({ where, include: prInclude, orderBy: { createdAt: "desc" } });
  const recs = await prisma.approvalRecord.findMany({
    where: { prId: { in: prs.map((p) => p.id) } },
    include: { approver: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = prs.map((pr: PRWithRelations) => {
    const chain = chainOf(pr);
    const done = ["APPROVED", "IN_PROCUREMENT", "FULFILLED"].includes(pr.status);
    const dead = (["REJECTED", "WITHDRAWN"] as string[]).includes(pr.status);
    const route = chain
      .map((c, i) => {
        const mark = done || i < pr.level ? "✓" : pr.status === "PENDING_APPROVAL" && i === pr.level ? "⏳" : dead ? "✕" : "·";
        return `${mark} ${SHORT[c]}`;
      })
      .join("  →  ");
    const prRecs = recs.filter((r) => r.prId === pr.id);
    const base = vmPR(pr);
    const waitingOn =
      pr.status === "PENDING_APPROVAL"
        ? `waiting on ${LEVEL_WHO[chain[pr.level]]} (${LEVEL_NAMES[chain[pr.level]]})`
        : base.fulfillNote ||
          (prRecs[0]
            ? `last action by ${prRecs[0].approver.name} · ${formatDateTimeID(prRecs[0].createdAt)}`
            : "approval chain complete");
    return { ...base, route, waitingOn };
  });

  return NextResponse.json({ rows, sub });
}
