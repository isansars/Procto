import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, forbidden } from "@/lib/api";
import { prInclude, vmPR, chainOf, waitInfo, type PRWithRelations } from "@/lib/viewmodels";

// GET /api/approvals/inbox — PRs pending approval at the actor's approval level.
export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  if (!actor.approvalLevel) return forbidden("This persona has no approval level.");

  const pending = await prisma.purchaseRequest.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: prInclude,
    orderBy: { createdAt: "desc" },
  });

  const mine = pending.filter((pr: PRWithRelations) => chainOf(pr)[pr.level] === actor.approvalLevel);
  const rows = mine.map((pr: PRWithRelations) => ({ ...vmPR(pr), ...waitInfo(pr) }));

  return NextResponse.json({ rows, actingName: actor.name });
}
