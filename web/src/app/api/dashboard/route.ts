import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor } from "@/lib/api";
import { LEVEL_NAMES, formatDateID, rp } from "@/lib/domain";
import {
  ALL_LEVELS,
  chainOf,
  poInclude,
  poIsOverdue,
  poTotal,
  prInclude,
  prTotal,
  vmPO,
  vmPR,
  waitInfo,
  type PRWithRelations,
} from "@/lib/viewmodels";

export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;

  const [prs, pos, grs, branches] = await Promise.all([
    prisma.purchaseRequest.findMany({ include: prInclude, orderBy: { createdAt: "desc" } }),
    prisma.purchaseOrder.findMany({ include: poInclude, orderBy: { createdAt: "desc" } }),
    prisma.goodsReceipt.findMany({
      include: { lines: { include: { item: true } }, recordedBy: true, po: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany(),
  ]);

  const openPRs = prs.filter((p) => ["PENDING_APPROVAL", "APPROVED", "IN_PROCUREMENT", "REVISION_REQUESTED"].includes(p.status));
  const pendingAppr = prs.filter((p) => p.status === "PENDING_APPROVAL");
  const openPOs = pos.filter((p) => ["PENDING_PO_APPROVAL", "ISSUED", "PARTIALLY_RECEIVED"].includes(p.status));
  const openPOValue = openPOs.reduce((s, po) => s + poTotal(po), 0);
  const discGRs = grs.filter((g) => g.flag !== "OK");

  const kpis = [
    { label: "Open PRs", value: String(openPRs.length), sub: "all branches, all statuses", numColor: "#26231C", k: "openpr" },
    {
      label: "Pending approvals",
      value: String(pendingAppr.length),
      sub: `${pendingAppr.filter((p) => waitInfo(p).breached).length} beyond SLA`,
      numColor: pendingAppr.some((p) => waitInfo(p).breached) ? "#B3402F" : "#26231C",
      k: "pending",
    },
    { label: "Open POs", value: String(openPOs.length), sub: `${rp(openPOValue)} committed`, numColor: "#26231C", k: "openpo" },
    {
      label: "GR discrepancies",
      value: String(discGRs.length),
      sub: "need vendor follow-up",
      numColor: discGRs.length ? "#B3402F" : "#26231C",
      k: "disc",
    },
  ];

  const attention: { title: string; sub: string; tag: string; dot: string; bg: string }[] = [];
  pendingAppr
    .filter((p) => waitInfo(p).breached)
    .forEach((p) => {
      const w = waitInfo(p);
      attention.push({
        title: `${p.id} pending ${LEVEL_NAMES[chainOf(p)[p.level]]} for ${w.waitedDays} days`,
        sub: `${p.requester.name} · ${p.branch.name} · ${rp(prTotal(p))} — reminder sent, escalation on next breach`,
        tag: "SLA BREACH",
        dot: "#B3402F",
        bg: "#FDF7F5",
      });
    });
  pos
    .filter((po) => poIsOverdue(po) && (po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED"))
    .forEach((po) => {
      attention.push({
        title: `${po.id} past expected delivery (${formatDateID(po.expectedDelivery)})`,
        sub: `${po.vendor.name} · ${po.branch.name} · ${po.lines.reduce((s, l) => s + (l.qty - l.received), 0)} unit outstanding`,
        tag: "OVERDUE PO",
        dot: "#8A5F0B",
        bg: "#FDFBF4",
      });
    });
  discGRs.forEach((g) => {
    attention.push({
      title: `${g.id} flagged — ${g.lines
        .filter((l) => l.condition !== "GOOD")
        .map((l) => `${l.condition.toLowerCase()} ${l.item.desc}`)
        .join(", ")}`,
      sub: `against ${g.poId} · recorded by ${g.recordedBy.name} · ${formatDateID(g.createdAt)}`,
      tag: "DISCREPANCY",
      dot: "#B3402F",
      bg: "#FDF7F5",
    });
  });
  if (!attention.length) {
    attention.push({ title: "Nothing needs attention right now", sub: "No SLA breaches, overdue POs, or unresolved discrepancies", tag: "CLEAR", dot: "#157A62", bg: "#F8FBF9" });
  }

  const drill = {
    openpr: {
      title: "Open purchase requests",
      rows: openPRs.map((p) => {
        const vm = vmPR(p as PRWithRelations);
        return { id: p.id, text: `${p.requester.name} · ${p.branch.name} · ${p.department.name}`, status: vm.status, stBg: vm.stBg, stFg: vm.stFg, amount: vm.total };
      }),
    },
    pending: {
      title: "Pending approvals",
      rows: pendingAppr.map((p) => {
        const vm = vmPR(p as PRWithRelations);
        const chain = chainOf(p);
        return {
          id: p.id,
          text: `waiting on ${LEVEL_NAMES[chain[p.level]]} · ${waitInfo(p).waitedDays}d`,
          status: vm.status,
          stBg: vm.stBg,
          stFg: vm.stFg,
          amount: vm.total,
        };
      }),
    },
    openpo: {
      title: "Open purchase orders",
      rows: openPOs.map((po) => {
        const vm = vmPO(po);
        return { id: po.id, text: `${po.vendor.name} · ${po.branch.name} · expected ${vm.expected}`, status: vm.status, stBg: vm.stBg, stFg: vm.stFg, amount: vm.total };
      }),
    },
    disc: {
      title: "Discrepancy-flagged receipts",
      rows: discGRs.map((g) => ({
        id: g.id,
        text: `against ${g.poId} · ${g.lines.map((l) => `${l.qty}× ${l.condition.toLowerCase()}`).join(", ")}`,
        status: "Flagged",
        stBg: "#F8E8E4",
        stFg: "#B3402F",
        amount: formatDateID(g.createdAt),
      })),
    },
  };

  const spendRows = branches.map((b) => {
    const committed =
      prs
        .filter((p) => p.branchId === b.id && ["APPROVED", "IN_PROCUREMENT", "FULFILLED"].includes(p.status))
        .reduce((s, p) => s + prTotal(p as PRWithRelations), 0) +
      pos.filter((po) => po.branchId === b.id && po.status !== "CANCELLED").reduce((s, po) => s + poTotal(po), 0);
    const pct = Math.min(100, Math.round((committed / b.budgetTotal) * 100));
    return {
      branch: b.name,
      committedFmt: rp(committed),
      budgetFmt: rp(b.budgetTotal),
      pct,
      color: pct > 85 ? "#B3402F" : pct > 60 ? "#B97F10" : "#157A62",
    };
  });

  const pendingByLevel = ALL_LEVELS.map((lvl) => ({
    name: LEVEL_NAMES[lvl],
    count: String(pendingAppr.filter((p) => chainOf(p)[p.level] === lvl).length),
  }));

  return NextResponse.json({ kpis, attention, drill, spendRows, pendingByLevel });
}
