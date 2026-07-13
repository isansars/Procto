import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, notFound, forbidden } from "@/lib/api";
import { getViewRole } from "@/lib/actor";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  if (getViewRole(req) !== "procurement") return forbidden("Only procurement can cancel a purchase order.");
  const { id } = await ctx.params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { goodsReceipts: true, lines: { include: { sourcePRLine: true } } },
  });
  if (!po) return notFound("Purchase order not found.");
  if (po.status !== "ISSUED") return forbidden("Only an issued PO with no receipts yet can be cancelled.");
  if (po.goodsReceipts.length) return forbidden("This PO already has goods receipts recorded.");

  await prisma.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" } });

  const prIds = new Set<string>();
  for (const line of po.lines) {
    if (line.sourcePRLine) {
      await prisma.pRLineItem.update({ where: { id: line.sourcePRLine.id }, data: { poLineId: null } });
      prIds.add(line.sourcePRLine.prId);
    }
  }
  for (const prId of prIds) {
    await prisma.purchaseRequest.updateMany({
      where: { id: prId, status: "IN_PROCUREMENT" },
      data: { status: "APPROVED" },
    });
  }

  await logAudit(
    prisma,
    id,
    "PO",
    "PO cancelled before any goods receipt — source PR lines returned to procurement queue",
    actor.name,
  );

  return NextResponse.json({ status: "CANCELLED" });
}
