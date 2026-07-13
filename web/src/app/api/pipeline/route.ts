import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_LEVELS, chainOf } from "@/lib/viewmodels";
import { LEVEL_NAMES } from "@/lib/domain";

// GET /api/pipeline — the four-stage pipeline strip shown on every screen.
// Global counts; role-based dimming/highlighting happens client-side.
export async function GET() {
  const [prs, pos, grs] = await Promise.all([
    prisma.purchaseRequest.findMany({ select: { status: true, level: true, chain: true } }),
    prisma.purchaseOrder.findMany({ select: { status: true } }),
    prisma.goodsReceipt.findMany({ select: { flag: true } }),
  ]);

  const preparing = prs.filter((p) => p.status === "DRAFT" || p.status === "REVISION_REQUESTED").length;
  const stages: { key: string; lvl?: string; label: string; count: number; sub: string }[] = [
    { key: "requests", label: "Requests", count: preparing, sub: "in preparation" },
  ];
  for (const lvl of ALL_LEVELS) {
    const count = prs.filter((p) => p.status === "PENDING_APPROVAL" && chainOf(p)[p.level] === lvl).length;
    stages.push({ key: "approvals", lvl, label: lvl === "dept" ? "Dept approval" : LEVEL_NAMES[lvl], count, sub: "" });
  }
  const intakeLines = await prisma.pRLineItem.count({ where: { status: "APPROVED", poLineId: null } });
  const ordersCount = pos.filter((p) => ["PENDING_PO_APPROVAL", "ISSUED", "PARTIALLY_RECEIVED"].includes(p.status)).length;
  stages.push({ key: "orders", label: "Orders", count: ordersCount, sub: `${intakeLines} lines in intake` });
  const receiptsCount = pos.filter((p) => ["ISSUED", "PARTIALLY_RECEIVED"].includes(p.status)).length;
  const discCount = grs.filter((g) => g.flag !== "OK").length;
  stages.push({ key: "receipts", label: "Receipts", count: receiptsCount, sub: `${discCount} discrepancies` });

  return NextResponse.json({ stages });
}
