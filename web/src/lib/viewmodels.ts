import type { Prisma } from "@/generated/prisma/client";
import {
  APPROVAL_CHAIN_ORDER,
  GR_TOLERANCE_PCT,
  LEVEL_NAMES,
  LEVEL_WHO,
  LINE_STATUS_LABEL,
  PO_STATUS_LABEL,
  PR_STATUS_LABEL,
  SLA_BREACH_DAYS,
  daysBetween,
  formatDateID,
  formatDateTimeID,
  rp,
  statusBadge,
  type ApprovalLevelKey,
} from "@/lib/domain";

export const prInclude = {
  requester: true,
  branch: true,
  department: true,
  lines: { include: { item: true, poLine: { include: { po: true } } } },
} satisfies Prisma.PurchaseRequestInclude;

export type PRWithRelations = Prisma.PurchaseRequestGetPayload<{ include: typeof prInclude }>;

export function chainOf(pr: { chain: string }): ApprovalLevelKey[] {
  return pr.chain.split(",").filter(Boolean) as ApprovalLevelKey[];
}

export function prLineTotal(line: { qty: number; item: { price: number } }): number {
  return line.qty * line.item.price;
}

export function prTotal(pr: PRWithRelations): number {
  return pr.lines.reduce((s, l) => s + prLineTotal(l), 0);
}

export function itemsSummary(pr: PRWithRelations): string {
  return pr.lines.map((l) => `${l.qty} ${l.item.uom} ${l.item.desc}`).join(" · ");
}

const PO_LABEL_FOR_NOTE: Record<string, string> = {
  PENDING_PO_APPROVAL: "PO pending approval",
  ISSUED: "with warehouse — awaiting delivery",
  PARTIALLY_RECEIVED: "partially delivered",
  FULLY_RECEIVED: "delivered ✓",
  CANCELLED: "PO cancelled",
};

export function fulfillNote(pr: PRWithRelations): string {
  if (!["APPROVED", "IN_PROCUREMENT", "FULFILLED"].includes(pr.status)) return "";
  const approved = pr.lines.filter((l) => l.status === "APPROVED");
  if (!approved.length) return "";
  const waiting = approved.filter((l) => !l.poLine).length;
  const poIds = [...new Set(approved.filter((l) => l.poLine).map((l) => l.poLine!.po.id))];
  const poByIdStatus = new Map<string, string>();
  approved.forEach((l) => {
    if (l.poLine) poByIdStatus.set(l.poLine.po.id, l.poLine.po.status);
  });
  const parts: string[] = [];
  if (waiting) parts.push(`${waiting} line${waiting > 1 ? "s" : ""} in procurement intake`);
  poIds.forEach((pid) => {
    const st = poByIdStatus.get(pid)!;
    parts.push(`${pid} · ${PO_LABEL_FOR_NOTE[st] ?? st}`);
  });
  return parts.join("  ·  ");
}

export function vmPR(pr: PRWithRelations) {
  const { bg: stBg, fg: stFg } = statusBadge(PR_STATUS_LABEL[pr.status]);
  const note = fulfillNote(pr);
  return {
    id: pr.id,
    date: formatDateID(pr.createdAt),
    requester: pr.requester.name,
    branchDept: `${pr.branch.name} · ${pr.department.name}`,
    branch: pr.branch.name,
    department: pr.department.name,
    dateNeeded: pr.dateNeeded,
    urgency: pr.urgency === "URGENT" ? "Urgent" : "Normal",
    urgent: pr.urgency === "URGENT",
    justification: pr.justification || "—",
    status: PR_STATUS_LABEL[pr.status],
    statusRaw: pr.status,
    stBg,
    stFg,
    total: rp(prTotal(pr)),
    totalRaw: prTotal(pr),
    itemsSummary: itemsSummary(pr),
    fulfillNote: note,
    hasFulfill: !!note,
  };
}

export function vmPRLines(pr: PRWithRelations) {
  return pr.lines.map((l) => {
    const { bg: stBg, fg: stFg } = statusBadge(LINE_STATUS_LABEL[l.status]);
    return {
      id: l.id,
      desc: l.item.desc,
      qtyU: `${l.qty} ${l.item.uom}`,
      qty: l.qty,
      priceFmt: rp(l.item.price),
      totalFmt: rp(prLineTotal(l)),
      status: LINE_STATUS_LABEL[l.status],
      statusRaw: l.status,
      stBg,
      stFg,
      hasPO: !!l.poLine,
      poId: l.poLine?.po.id ?? "",
    };
  });
}

export function waitInfo(pr: { levelEnteredAt: Date }) {
  const waitedDays = daysBetween(pr.levelEnteredAt, new Date());
  const breached = waitedDays > SLA_BREACH_DAYS;
  return {
    waitedDays,
    waitText: breached
      ? `waiting ${waitedDays} days — SLA breached`
      : `waiting ${waitedDays} day${waitedDays === 1 ? "" : "s"}`,
    waitColor: breached ? "#B3402F" : "#8A8272",
    breached,
  };
}

export async function buildTimeline(
  prisma: import("@/generated/prisma/client").PrismaClient,
  prId: string,
) {
  const rows = await prisma.auditLogEntry.findMany({
    where: { entityId: prId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((a) => ({
    ts: formatDateTimeID(a.createdAt),
    user: a.userName,
    action: a.action,
    comment: a.comment,
    hasComment: !!a.comment,
    dot: /Reject|Revision|flag|Discrepancy/i.test(a.action)
      ? "#B3402F"
      : /Approved|issued|Fully|receipt/i.test(a.action)
        ? "#157A62"
        : "#C9BFA8",
  }));
}

export function approvalChainVm(pr: { chain: string; level: number }) {
  const chain = chainOf(pr);
  return chain.map((c, i) => ({
    name: LEVEL_NAMES[c],
    who: LEVEL_WHO[c],
    mark: i < pr.level ? "✓" : String(i + 1),
    bg: i < pr.level ? "#157A62" : i === pr.level ? "#FBF2DD" : "#EFEAE0",
    fg: i < pr.level ? "#fff" : i === pr.level ? "#8A5F0B" : "#8A8272",
  }));
}

export function routePreview(chain: ApprovalLevelKey[]) {
  return chain.map((c, i) => ({ n: i + 1, name: LEVEL_NAMES[c], who: LEVEL_WHO[c] }));
}

// ---------- Purchase Orders ----------

export const poInclude = {
  vendor: true,
  branch: true,
  createdBy: true,
  lines: { include: { item: true } },
  goodsReceipts: {
    include: { lines: { include: { item: true } }, recordedBy: true },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.PurchaseOrderInclude;

export type POWithRelations = Prisma.PurchaseOrderGetPayload<{ include: typeof poInclude }>;

export function poTotal(po: { lines: { qty: number; price: number }[] }): number {
  return po.lines.reduce((s, l) => s + l.qty * l.price, 0);
}

export function poIsOverdue(po: { expectedDelivery: Date; status: string }): boolean {
  return po.expectedDelivery.getTime() < Date.now() && po.status !== "FULLY_RECEIVED" && po.status !== "CANCELLED";
}

export function vmPO(po: POWithRelations) {
  const { bg: stBg, fg: stFg } = statusBadge(PO_STATUS_LABEL[po.status]);
  const ordered = po.lines.reduce((s, l) => s + l.qty, 0);
  const received = po.lines.reduce((s, l) => s + l.received, 0);
  const overdue = poIsOverdue(po);
  return {
    id: po.id,
    date: formatDateID(po.createdAt),
    vendor: po.vendor.name,
    vendorId: po.vendor.id,
    branch: po.branch.name,
    status: PO_STATUS_LABEL[po.status],
    statusRaw: po.status,
    stBg,
    stFg,
    total: rp(poTotal(po)),
    totalRaw: poTotal(po),
    pct: ordered ? Math.min(100, Math.round((received / ordered) * 100)) : 0,
    recvText: `${received} of ${ordered} received`,
    sourceText: `from ${[...new Set(po.lines.map((l) => l.prRefLabel.split(" · ")[0]))].join(", ")} · ${po.branch.name}`,
    itemsSummary: po.lines.map((l) => `${l.qty} ${l.item.uom} ${l.item.desc}`).join(" · "),
    expected: formatDateID(po.expectedDelivery),
    expColor: overdue ? "#B3402F" : "#26231C",
    overdue,
  };
}

export function vmPOLines(po: POWithRelations) {
  return po.lines.map((l) => ({
    id: l.id,
    desc: l.item.desc,
    prRef: l.prRefLabel,
    ordText: `${l.qty} ${l.item.uom} × ${rp(l.price)}`,
    qty: l.qty,
    price: l.price,
    received: l.received,
    pct: Math.min(100, Math.round((l.received / l.qty) * 100)),
    recvText: `${l.received} / ${l.qty} received`,
  }));
}

export function vmGR(gr: POWithRelations["goodsReceipts"][number]) {
  return {
    id: gr.id,
    date: formatDateID(gr.createdAt),
    by: gr.recordedBy.name,
    flag: gr.flag === "OK" ? "OK" : "DISCREPANCY",
    fBg: gr.flag === "OK" ? "#E3F0EB" : "#F8E8E4",
    fFg: gr.flag === "OK" ? "#157A62" : "#B3402F",
    summary:
      gr.lines
        .map((l) => `${l.qty} ${l.item.uom} ${l.item.desc} (${conditionLabel(l.condition)}${l.note ? " — " + l.note : ""})`)
        .join("; ") +
      " · by " +
      gr.recordedBy.name,
  };
}

export function conditionLabel(c: string): string {
  return { GOOD: "Good", DAMAGED: "Damaged", REJECTED: "Rejected" }[c] ?? c;
}

export const toleranceFraction = GR_TOLERANCE_PCT / 100;

export function nextLevel(chain: ApprovalLevelKey[], level: number): ApprovalLevelKey | null {
  return chain[level] ?? null;
}

export const ALL_LEVELS = APPROVAL_CHAIN_ORDER;
