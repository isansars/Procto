import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor } from "@/lib/api";
import { poInclude, vmPO } from "@/lib/viewmodels";

// GET /api/goods-receipts/open-pos — Warehouse "Goods Receipt" list: open POs
// with pending deliveries.
export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;

  const pos = await prisma.purchaseOrder.findMany({
    where: { status: { in: ["ISSUED", "PARTIALLY_RECEIVED"] } },
    include: poInclude,
    orderBy: { createdAt: "asc" },
  });

  const rows = pos.map((po) => {
    const base = vmPO(po);
    return { ...base, overdueText: base.overdue ? " · OVERDUE" : "" };
  });

  return NextResponse.json({ rows });
}
