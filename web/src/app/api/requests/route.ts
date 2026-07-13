import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor, badRequest, forbidden } from "@/lib/api";
import { chainFor, rp } from "@/lib/domain";
import { nextBusinessId } from "@/lib/counters";
import { logAudit } from "@/lib/audit";
import { prInclude, vmPR, type PRWithRelations } from "@/lib/viewmodels";

// GET /api/requests — the Requester's "My Purchase Requests" list: every PR
// from the actor's own branch+department (not just their own), plus the
// budget widget and status stat cards for that department.
export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  if (!actor.departmentId || !actor.branchId) {
    return forbidden("This persona has no department/branch to scope requests to.");
  }

  const prs = await prisma.purchaseRequest.findMany({
    where: { branchId: actor.branchId, departmentId: actor.departmentId },
    include: prInclude,
    orderBy: { createdAt: "desc" },
  });

  const rows = prs.map((pr: PRWithRelations) => ({
    ...vmPR(pr),
    canEdit: ["DRAFT", "REVISION_REQUESTED"].includes(pr.status) && pr.requesterId === actor.id,
  }));

  const dept = await prisma.department.findUniqueOrThrow({ where: { id: actor.departmentId } });
  const remain = dept.budgetTotal - dept.budgetCommitted;

  const n = (pred: (pr: PRWithRelations) => boolean) => prs.filter(pred).length;
  const statCards = [
    { label: "Drafts", icon: "✎", bg: "#EFEAE0", fg: "#6B6455", count: n((x) => ["DRAFT", "REVISION_REQUESTED"].includes(x.status)) },
    { label: "Pending Approval", icon: "⏳", bg: "#FBF2DD", fg: "#8A5F0B", count: n((x) => x.status === "PENDING_APPROVAL") },
    { label: "Approved / In Progress", icon: "✓", bg: "#E3F0EB", fg: "#157A62", count: n((x) => ["APPROVED", "IN_PROCUREMENT", "FULFILLED"].includes(x.status)) },
    { label: "Rejected", icon: "✕", bg: "#F8E8E4", fg: "#B3402F", count: n((x) => ["REJECTED", "WITHDRAWN"].includes(x.status)) },
  ];

  return NextResponse.json({
    rows,
    budget: {
      totalFmt: rp(dept.budgetTotal),
      remainFmt: rp(remain),
      remain,
      pct: Math.round((dept.budgetCommitted / dept.budgetTotal) * 100),
    },
    statCards,
  });
}

type LineInput = { itemId: string; qty: number; desc?: string; price?: number };

// POST /api/requests — create a new PR (draft or submitted) or update+resubmit
// an existing draft/revision-requested PR owned by the actor.
export async function POST(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;
  if (actor.role !== "REQUESTER" || !actor.branchId || !actor.departmentId) {
    return forbidden("Only a requester persona can create purchase requests.");
  }

  const body = (await req.json()) as {
    editingId?: string;
    dateNeeded: string;
    urgency: "Normal" | "Urgent";
    justification: string;
    lines: LineInput[];
    asDraft: boolean;
  };

  if (!body.dateNeeded || !Array.isArray(body.lines)) return badRequest("Missing request fields.");
  const validLines = body.lines.filter((l) => Number(l.qty) > 0);
  if (!validLines.length) return badRequest("Add at least one line item.");

  let existing: { id: string; requesterId: string; status: string } | null = null;
  if (body.editingId) {
    existing = await prisma.purchaseRequest.findUnique({
      where: { id: body.editingId },
      select: { id: true, requesterId: true, status: true },
    });
    if (!existing) return badRequest("PR to edit was not found.");
    if (existing.requesterId !== actor.id) return forbidden("You can only edit your own requests.");
    if (!["DRAFT", "REVISION_REQUESTED"].includes(existing.status)) {
      return forbidden("Only drafts or revision-requested PRs can be edited.");
    }
  }

  // Resolve/create catalog rows for each line (custom items get a new catalog entry).
  const resolvedLines: { itemId: string; qty: number }[] = [];
  for (const l of validLines) {
    if (l.itemId === "CUSTOM") {
      const code = await nextBusinessId(prisma, "ITEM");
      const created = await prisma.itemCatalogEntry.create({
        data: {
          code,
          desc: (l.desc || "Custom item").trim(),
          uom: "unit",
          price: Number(l.price) || 0,
          category: "Custom",
          isCustom: true,
        },
      });
      resolvedLines.push({ itemId: created.id, qty: Number(l.qty) });
    } else {
      resolvedLines.push({ itemId: l.itemId, qty: Number(l.qty) });
    }
  }

  const items = await prisma.itemCatalogEntry.findMany({
    where: { id: { in: resolvedLines.map((l) => l.itemId) } },
  });
  const priceOf = new Map(items.map((i) => [i.id, i.price]));
  const total = resolvedLines.reduce((s, l) => s + l.qty * (priceOf.get(l.itemId) ?? 0), 0);
  const chain = chainFor(total);
  const status = body.asDraft ? "DRAFT" : "PENDING_APPROVAL";
  const now = new Date();

  let prId: string;
  if (existing) {
    prId = existing.id;
    await prisma.pRLineItem.deleteMany({ where: { prId } });
    await prisma.purchaseRequest.update({
      where: { id: prId },
      data: {
        dateNeeded: body.dateNeeded,
        urgency: body.urgency === "Urgent" ? "URGENT" : "NORMAL",
        justification: body.justification ?? "",
        status,
        level: 0,
        chain: chain.join(","),
        levelEnteredAt: now,
        lines: { create: resolvedLines.map((l) => ({ itemId: l.itemId, qty: l.qty })) },
      },
    });
  } else {
    prId = await nextBusinessId(prisma, "PR");
    await prisma.purchaseRequest.create({
      data: {
        id: prId,
        requesterId: actor.id,
        branchId: actor.branchId,
        departmentId: actor.departmentId,
        dateNeeded: body.dateNeeded,
        urgency: body.urgency === "Urgent" ? "URGENT" : "NORMAL",
        justification: body.justification ?? "",
        status,
        level: 0,
        chain: chain.join(","),
        levelEnteredAt: now,
        lines: { create: resolvedLines.map((l) => ({ itemId: l.itemId, qty: l.qty })) },
      },
    });
  }

  if (body.asDraft) {
    await logAudit(prisma, prId, "PR", existing ? "Draft updated" : "Draft created", actor.name);
  } else {
    const { LEVEL_NAMES } = await import("@/lib/domain");
    const route = chain.map((c) => LEVEL_NAMES[c]).join(" → ");
    await logAudit(prisma, prId, "PR", `Submitted for approval (route: ${route})`, actor.name);
    const dept = await prisma.department.findUniqueOrThrow({ where: { id: actor.departmentId } });
    if (total > dept.budgetTotal - dept.budgetCommitted) {
      await logAudit(prisma, prId, "PR", "Budget warning — request exceeds remaining department budget", "System");
    }
  }

  return NextResponse.json({ id: prId, status });
}
