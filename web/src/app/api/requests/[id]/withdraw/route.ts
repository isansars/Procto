import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, notFound, forbidden } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  const { id } = await ctx.params;

  const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!pr) return notFound("Purchase request not found.");
  if (pr.requesterId !== actor.id) return forbidden("You can only withdraw your own request.");
  if (pr.status !== "PENDING_APPROVAL") return forbidden("Only a PR pending approval can be withdrawn.");

  await prisma.purchaseRequest.update({ where: { id }, data: { status: "WITHDRAWN" } });
  await logAudit(prisma, id, "PR", "Withdrawn by requester before full approval", actor.name);

  return NextResponse.json({ ok: true });
}
