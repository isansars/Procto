import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, notFound, forbidden, badRequest } from "@/lib/api";
import { LEVEL_NAMES } from "@/lib/domain";
import { nextBusinessId } from "@/lib/counters";
import { logAudit } from "@/lib/audit";
import { chainOf } from "@/lib/viewmodels";

type Decision = "approve" | "reject" | "revision";
type Body = {
  action: Decision;
  lineDecisions?: Record<string, "approve" | "reject">;
  comment?: string;
};

export async function POST(req: Request, ctx: { params: Promise<{ prId: string }> }) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  if (!actor.approvalLevel) return forbidden("This persona has no approval level.");
  const { prId } = await ctx.params;

  const pr = await prisma.purchaseRequest.findUnique({ where: { id: prId }, include: { lines: true } });
  if (!pr) return notFound("Purchase request not found.");
  if (pr.status !== "PENDING_APPROVAL") return forbidden("This PR is not waiting for approval.");

  const chain = chainOf(pr);
  const currentLevel = chain[pr.level];
  if (currentLevel !== actor.approvalLevel) {
    return forbidden("This PR is not waiting at your approval level.");
  }

  const body = (await req.json()) as Body;
  const comment = (body.comment ?? "").trim();
  const lname = LEVEL_NAMES[currentLevel];

  const recordDecision = async (decision: "Approved" | "PartiallyApproved" | "Rejected" | "RevisionRequested") => {
    const id = await nextBusinessId(prisma, "APV");
    await prisma.approvalRecord.create({
      data: { id, prId: pr.id, level: currentLevel, levelName: lname, approverId: actor.id, decision, comment },
    });
  };

  if (body.action === "reject") {
    if (!comment) return badRequest("A comment is required to reject.");
    await prisma.pRLineItem.updateMany({ where: { prId: pr.id, status: "PENDING" }, data: { status: "REJECTED" } });
    await prisma.purchaseRequest.update({ where: { id: pr.id }, data: { status: "REJECTED" } });
    await recordDecision("Rejected");
    await logAudit(prisma, pr.id, "PR", `Rejected — ${lname}`, actor.name, comment);
    return NextResponse.json({ status: "REJECTED" });
  }

  if (body.action === "revision") {
    if (!comment) return badRequest("A comment is required to request revision.");
    await prisma.purchaseRequest.update({ where: { id: pr.id }, data: { status: "REVISION_REQUESTED" } });
    await recordDecision("RevisionRequested");
    await logAudit(prisma, pr.id, "PR", `Revision requested — ${lname}`, actor.name, comment);
    return NextResponse.json({ status: "REVISION_REQUESTED" });
  }

  // action === "approve" (optionally partial)
  const pendingLines = pr.lines.filter((l) => l.status === "PENDING");
  const rejectedIds = pendingLines
    .filter((l) => body.lineDecisions?.[l.id] === "reject")
    .map((l) => l.id);
  const partial = rejectedIds.length > 0;
  if (partial && !comment) {
    return badRequest("A comment is required when rejecting some line items.");
  }

  if (rejectedIds.length) {
    await prisma.pRLineItem.updateMany({ where: { id: { in: rejectedIds } }, data: { status: "REJECTED" } });
  }
  await recordDecision(partial ? "PartiallyApproved" : "Approved");

  const isFinalLevel = pr.level + 1 >= chain.length;
  if (!isFinalLevel) {
    await prisma.purchaseRequest.update({
      where: { id: pr.id },
      data: { level: pr.level + 1, levelEnteredAt: new Date() },
    });
    await logAudit(
      prisma,
      pr.id,
      "PR",
      `${partial ? "Partially approved" : "Approved"} — ${lname}${partial ? ` (${rejectedIds.length} line(s) rejected)` : ""}`,
      actor.name,
      comment,
    );
    return NextResponse.json({ status: "PENDING_APPROVAL" });
  }

  await prisma.pRLineItem.updateMany({
    where: { prId: pr.id, status: "PENDING" },
    data: { status: "APPROVED" },
  });
  await prisma.purchaseRequest.update({ where: { id: pr.id }, data: { status: "APPROVED" } });
  await logAudit(
    prisma,
    pr.id,
    "PR",
    `${partial ? "Partially approved" : "Approved"} — final level (${lname})${partial ? ` · ${rejectedIds.length} line(s) rejected` : ""}`,
    actor.name,
    comment,
  );
  return NextResponse.json({ status: "APPROVED" });
}
