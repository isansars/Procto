import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, notFound } from "@/lib/api";
import { getViewRole } from "@/lib/actor";
import { poInclude, vmPO, vmPOLines, vmGR } from "@/lib/viewmodels";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  const viewRole = getViewRole(req);
  const { id } = await ctx.params;

  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: poInclude });
  if (!po) return notFound("Purchase order not found.");

  return NextResponse.json({
    ...vmPO(po),
    lines: vmPOLines(po),
    grs: po.goodsReceipts.map(vmGR),
    noGRs: po.goodsReceipts.length === 0,
    canApprove: viewRole === "procurement" && po.status === "PENDING_PO_APPROVAL",
    canCancel: viewRole === "procurement" && po.status === "ISSUED" && po.goodsReceipts.length === 0,
  });
}
