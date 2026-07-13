import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, badRequest, notFound } from "@/lib/api";
import { getViewRole } from "@/lib/actor";
import { formatDateID } from "@/lib/domain";
import { nextBusinessId } from "@/lib/counters";
import { logAudit } from "@/lib/audit";
import { conditionLabel, toleranceFraction } from "@/lib/viewmodels";

// GET /api/goods-receipts — the full receipt log (Warehouse "Receipt history",
// Procurement/Management "Goods Receipts — all branches"). Unscoped, like the
// prototype: every receipt is visible to every operational role.
export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  const viewRole = getViewRole(req);

  const grs = await prisma.goodsReceipt.findMany({
    include: { lines: { include: { item: true } }, recordedBy: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = grs.map((g) => ({
    id: g.id,
    poId: g.poId,
    date: formatDateID(g.createdAt),
    by: g.recordedBy.name,
    flag: g.flag === "OK" ? "OK" : "DISCREPANCY",
    fBg: g.flag === "OK" ? "#E3F0EB" : "#F8E8E4",
    fFg: g.flag === "OK" ? "#157A62" : "#B3402F",
    summary: g.lines
      .map((l) => `${l.qty} ${l.item.uom} ${l.item.desc} (${conditionLabel(l.condition)}${l.note ? " — " + l.note : ""})`)
      .join("; "),
  }));

  const title = viewRole === "warehouse" ? "Receipt history" : "Goods Receipts — all branches";
  return NextResponse.json({ rows, title });
}

type LineInput = { poLineId: string; qty: number; condition: "GOOD" | "DAMAGED" | "REJECTED"; note?: string; hasPhoto?: boolean };

// POST /api/goods-receipts — record a (possibly partial) delivery against a PO.
export async function POST(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;

  const body = (await req.json()) as { poId: string; lines: LineInput[] };
  const po = await prisma.purchaseOrder.findUnique({ where: { id: body.poId }, include: { lines: true } });
  if (!po) return notFound("Purchase order not found.");
  if (!Array.isArray(body.lines)) return badRequest("Missing receipt lines.");

  let flag: "OK" | "DISCREPANCY" = "OK";
  let any = false;
  const grLineData: { poLineId: string; itemId: string; qty: number; condition: LineInput["condition"]; note: string; hasPhoto: boolean }[] = [];
  const receivedUpdates: { id: string; newReceived: number }[] = [];
  const summaryParts: string[] = [];

  for (const po_line of po.lines) {
    const input = body.lines.find((l) => l.poLineId === po_line.id);
    if (!input) continue;
    const q = Number(input.qty) || 0;
    if (q <= 0 && input.condition === "GOOD") continue;
    any = true;
    const newReceived = po_line.received + q;
    receivedUpdates.push({ id: po_line.id, newReceived });
    if (input.condition !== "GOOD") flag = "DISCREPANCY";
    if (newReceived > po_line.qty * (1 + toleranceFraction)) flag = "DISCREPANCY";
    grLineData.push({
      poLineId: po_line.id,
      itemId: po_line.itemId,
      qty: q,
      condition: input.condition,
      note: input.note ?? "",
      hasPhoto: !!input.hasPhoto,
    });
    summaryParts.push(`${q} unit ${input.condition === "GOOD" ? "Good" : conditionLabel(input.condition)}`);
  }

  if (!any) return badRequest("Enter a received quantity for at least one line.");

  const grId = await nextBusinessId(prisma, "GR");
  await prisma.goodsReceipt.create({
    data: {
      id: grId,
      poId: po.id,
      recordedById: actor.id,
      flag,
      lines: { create: grLineData },
    },
  });

  for (const u of receivedUpdates) {
    await prisma.pOLineItem.update({ where: { id: u.id }, data: { received: u.newReceived } });
  }

  const updatedLines = await prisma.pOLineItem.findMany({ where: { poId: po.id } });
  const full = updatedLines.every((l) => l.received >= l.qty);
  const newStatus = full ? "FULLY_RECEIVED" : "PARTIALLY_RECEIVED";
  await prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: newStatus } });

  await logAudit(
    prisma,
    grId,
    "GR",
    `Goods receipt submitted — ${summaryParts.join(", ")}${flag === "DISCREPANCY" ? " · DISCREPANCY FLAGGED" : ""}`,
    actor.name,
    grLineData.map((l) => l.note).filter(Boolean).join("; "),
  );
  await logAudit(
    prisma,
    po.id,
    "PO",
    full ? "PO fully received — closed for receiving" : "PO partially received",
    "System",
  );

  if (full) {
    const candidatePRs = await prisma.purchaseRequest.findMany({
      where: { lines: { some: { poLineId: { in: updatedLines.map((l) => l.id) } } } },
      include: { lines: { include: { poLine: { include: { po: true } } } } },
    });
    for (const pr of candidatePRs) {
      const approved = pr.lines.filter((l) => l.status === "APPROVED");
      const touchesThisPO = approved.some((l) => l.poLine?.po.id === po.id);
      const allFullyReceived = approved.length > 0 && approved.every((l) => l.poLine && l.poLine.po.status === "FULLY_RECEIVED");
      if (touchesThisPO && allFullyReceived) {
        await prisma.purchaseRequest.update({ where: { id: pr.id }, data: { status: "FULFILLED" } });
        await logAudit(prisma, pr.id, "PR", "PR fulfilled — all linked POs fully received", "System");
      }
    }
  }

  return NextResponse.json({ id: grId, poStatus: newStatus, flag });
}
