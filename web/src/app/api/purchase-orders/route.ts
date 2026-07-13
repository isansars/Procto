import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, forbidden, badRequest } from "@/lib/api";
import { getViewRole } from "@/lib/actor";
import { PO_APPROVAL_THRESHOLD, rp } from "@/lib/domain";
import { nextBusinessId } from "@/lib/counters";
import { logAudit } from "@/lib/audit";
import { poInclude, vmPO } from "@/lib/viewmodels";

const POLL_SUBS: Record<string, string> = {
  requester: "Purchase orders created from your department's requests · read-only",
  procurement: "All purchase orders, all branches",
  management: "All purchase orders · read-only",
};

export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  const viewRole = getViewRole(req);

  let poIds: string[] | null = null;
  if (viewRole === "requester") {
    if (!actor.branchId || !actor.departmentId) return forbidden("No department to scope to.");
    const lines = await prisma.pOLineItem.findMany({
      where: { sourcePRLine: { pr: { branchId: actor.branchId, departmentId: actor.departmentId } } },
      select: { poId: true },
    });
    poIds = [...new Set(lines.map((l) => l.poId))];
  } else if (viewRole !== "procurement" && viewRole !== "management") {
    return forbidden("This view is only available to requester, procurement or management.");
  }

  const pos = await prisma.purchaseOrder.findMany({
    where: poIds ? { id: { in: poIds } } : {},
    include: poInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rows: pos.map(vmPO), sub: POLL_SUBS[viewRole] ?? "" });
}

// POST /api/purchase-orders — consolidate selected approved PR lines into a new PO.
export async function POST(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  if (getViewRole(req) !== "procurement") return forbidden("Only procurement can create purchase orders.");

  const body = (await req.json()) as { lineIds: string[]; vendorId: string };
  if (!body.vendorId || !Array.isArray(body.lineIds) || !body.lineIds.length) {
    return badRequest("Select at least one line and a vendor.");
  }

  const lines = await prisma.pRLineItem.findMany({
    where: { id: { in: body.lineIds }, status: "APPROVED", poLineId: null },
    include: { item: true, pr: { include: { requester: true, branch: true } } },
  });
  if (!lines.length) return badRequest("None of the selected lines are eligible for a PO anymore.");

  const vendor = await prisma.vendor.findUnique({ where: { id: body.vendorId } });
  if (!vendor) return badRequest("Unknown vendor.");

  const total = lines.reduce((s, l) => s + l.qty * l.item.price, 0);
  const needsApproval = total > PO_APPROVAL_THRESHOLD;
  const poId = await nextBusinessId(prisma, "PO");
  const expectedDelivery = new Date();
  expectedDelivery.setDate(expectedDelivery.getDate() + 7);

  await prisma.purchaseOrder.create({
    data: {
      id: poId,
      vendorId: vendor.id,
      branchId: lines[0].pr.branchId,
      expectedDelivery,
      status: needsApproval ? "PENDING_PO_APPROVAL" : "ISSUED",
      createdById: actor.id,
      lines: {
        create: lines.map((l) => ({
          id: `${poId}-${l.id}`,
          itemId: l.itemId,
          qty: l.qty,
          price: l.item.price,
          prRefLabel: `${l.pr.id} · ${l.pr.requester.name}`,
        })),
      },
    },
  });

  for (const l of lines) {
    await prisma.pRLineItem.update({ where: { id: l.id }, data: { poLineId: `${poId}-${l.id}` } });
  }

  const prIds = [...new Set(lines.map((l) => l.prId))];
  for (const prId of prIds) {
    const remaining = await prisma.pRLineItem.count({ where: { prId, status: "APPROVED", poLineId: null } });
    if (remaining === 0) {
      await prisma.purchaseRequest.update({ where: { id: prId }, data: { status: "IN_PROCUREMENT" } });
    }
    await logAudit(prisma, prId, "PR", `Line item(s) added to ${poId}`, actor.name);
  }

  const consolidatedNote = prIds.length > 1 ? ` (consolidated from ${prIds.length} PRs)` : "";
  await logAudit(
    prisma,
    poId,
    "PO",
    needsApproval
      ? `PO created (${rp(total)}) — pending Procurement Manager approval`
      : `PO created and issued to ${vendor.name}${consolidatedNote}`,
    actor.name,
  );

  return NextResponse.json({ id: poId, needsApproval });
}
