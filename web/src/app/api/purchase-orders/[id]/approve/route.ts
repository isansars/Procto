import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, notFound, forbidden } from "@/lib/api";
import { getViewRole } from "@/lib/actor";
import { logAudit } from "@/lib/audit";

// The PO approval step is performed by the Procurement Manager persona
// (Hendra Gunawan) regardless of which procurement persona is "acting" in
// the demo — mirrors the prototype's "Approve & issue (as Hendra, Proc.
// Manager)" button.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  if (getViewRole(req) !== "procurement") return forbidden("Only procurement can approve a purchase order.");
  const { id } = await ctx.params;

  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { vendor: true } });
  if (!po) return notFound("Purchase order not found.");
  if (po.status !== "PENDING_PO_APPROVAL") return forbidden("This PO is not pending approval.");

  const manager = await prisma.user.findFirst({ where: { role: "PROCUREMENT_MANAGER" } });
  const approverName = manager?.name ?? actor.name;

  await prisma.purchaseOrder.update({ where: { id }, data: { status: "ISSUED" } });
  await logAudit(prisma, id, "PO", `PO approved and issued to ${po.vendor.name}`, approverName);

  return NextResponse.json({ status: "ISSUED" });
}
