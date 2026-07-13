import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, notFound } from "@/lib/api";
import { rp } from "@/lib/domain";
import { prInclude, vmPR, vmPRLines, buildTimeline, approvalChainVm, chainOf } from "@/lib/viewmodels";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  const { id } = await ctx.params;

  const pr = await prisma.purchaseRequest.findUnique({ where: { id }, include: prInclude });
  if (!pr) return notFound("Purchase request not found.");

  const [timeline, requesterPRCount] = await Promise.all([
    buildTimeline(prisma, pr.id),
    prisma.purchaseRequest.count({ where: { requesterId: pr.requesterId } }),
  ]);

  const remainingBudget = pr.department.budgetTotal - pr.department.budgetCommitted;
  const base = vmPR(pr);

  return NextResponse.json({
    ...base,
    lines: vmPRLines(pr),
    timeline,
    chain: chainOf(pr),
    level: pr.level,
    approvalChain: approvalChainVm(pr),
    canWithdraw: actor.role === "REQUESTER" && pr.status === "PENDING_APPROVAL" && pr.requesterId === actor.id,
    canEdit: ["DRAFT", "REVISION_REQUESTED"].includes(pr.status) && pr.requesterId === actor.id,
    editForm: {
      dateNeeded: pr.dateNeeded,
      urgency: base.urgency,
      justification: pr.justification,
      lines: pr.lines.map((l) => ({ itemId: l.itemId, qty: l.qty })),
    },
    requesterPRCount,
    budgetRemainFmt: rp(remainingBudget),
    budgetRemain: remainingBudget,
    overBudget: base.totalRaw > remainingBudget,
  });
}
