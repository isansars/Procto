import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, forbidden } from "@/lib/api";
import { getViewRole } from "@/lib/actor";
import { LEVEL_NAMES } from "@/lib/domain";
import { prInclude, vmPR } from "@/lib/viewmodels";
import type { Prisma } from "@/generated/prisma/client";

// GET /api/requests/table — the read-only PR table shown to Approver,
// Procurement and Management under the "Purchase Requests" module.
export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  const viewRole = getViewRole(req);

  let where: Prisma.PurchaseRequestWhereInput = {};
  let sub = "";

  if (viewRole === "approver") {
    if (!actor.approvalLevel) return forbidden("This persona has no approval level.");
    where = { status: { not: "DRAFT" }, chain: { contains: actor.approvalLevel } };
    sub = `Requests routed through your approval level (${LEVEL_NAMES[actor.approvalLevel]})`;
  } else if (viewRole === "procurement") {
    where = { status: { not: "DRAFT" } };
    sub = "All requests, all branches · read-only — convert approved lines from the Purchase Orders intake";
  } else if (viewRole === "management") {
    where = {};
    sub = "All branches · read-only";
  } else {
    return forbidden("This view is only available to approver, procurement or management.");
  }

  const prs = await prisma.purchaseRequest.findMany({ where, include: prInclude, orderBy: { createdAt: "desc" } });
  const rows = prs.map(vmPR);
  return NextResponse.json({ rows, sub });
}
