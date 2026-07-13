// Shared business rules & formatting for the NusaProc procurement module.
// Mirrors the approved prototype (ERP Procurement Prototype.dc.html) 1:1.

export const PO_APPROVAL_THRESHOLD = 50_000_000;
export const GR_TOLERANCE_PCT = 5;
export const SLA_BREACH_DAYS = 2;

export type ApprovalLevelKey = "dept" | "branch" | "finance" | "exec";

export const APPROVAL_CHAIN_ORDER: ApprovalLevelKey[] = [
  "dept",
  "branch",
  "finance",
  "exec",
];

export const LEVEL_NAMES: Record<ApprovalLevelKey, string> = {
  dept: "Department Approver",
  branch: "Branch Manager",
  finance: "Finance Approver",
  exec: "Executive",
};

/** Global (company-wide) acting approver per level, used by the demo persona switcher. */
export const LEVEL_WHO: Record<ApprovalLevelKey, string> = {
  dept: "Budi Santoso",
  branch: "Rina Wijaya",
  finance: "Agus Pratama",
  exec: "Maya Anggraini",
};

/** Approval matrix — PRD section 7.1. Chain is determined by estimated PR total. */
export function chainFor(total: number): ApprovalLevelKey[] {
  if (total <= 5_000_000) return ["dept"];
  if (total <= 25_000_000) return ["dept", "branch"];
  if (total <= 100_000_000) return ["dept", "branch", "finance"];
  return ["dept", "branch", "finance", "exec"];
}

export function rp(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const ID_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function formatDateID(d: Date): string {
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTimeID(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDateID(d)} ${hh}:${mm}`;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export type BadgeColor = { bg: string; fg: string };

const STATUS_BADGES: Record<string, BadgeColor> = {
  Draft: { bg: "#EFEAE0", fg: "#6B6455" },
  "Pending Approval": { bg: "#FBF2DD", fg: "#8A5F0B" },
  "Revision Requested": { bg: "#FBF2DD", fg: "#8A5F0B" },
  Approved: { bg: "#E3F0EB", fg: "#157A62" },
  "In Procurement": { bg: "#E4EDF5", fg: "#2D6089" },
  Fulfilled: { bg: "#E3F0EB", fg: "#157A62" },
  Rejected: { bg: "#F8E8E4", fg: "#B3402F" },
  Withdrawn: { bg: "#EFEAE0", fg: "#6B6455" },
  "Pending PO Approval": { bg: "#FBF2DD", fg: "#8A5F0B" },
  Issued: { bg: "#E4EDF5", fg: "#2D6089" },
  "Partially Received": { bg: "#FBF2DD", fg: "#8A5F0B" },
  "Fully Received": { bg: "#E3F0EB", fg: "#157A62" },
  Cancelled: { bg: "#EFEAE0", fg: "#6B6455" },
  Pending: { bg: "#FBF2DD", fg: "#8A5F0B" },
  Flagged: { bg: "#F8E8E4", fg: "#B3402F" },
};

export function statusBadge(status: string): BadgeColor {
  return STATUS_BADGES[status] ?? { bg: "#EFEAE0", fg: "#6B6455" };
}

export function decisionBadge(decision: string): BadgeColor {
  if (decision === "Approved") return { bg: "#E3F0EB", fg: "#157A62" };
  if (decision === "PartiallyApproved" || decision === "Partially Approved")
    return { bg: "#E4EDF5", fg: "#2D6089" };
  if (decision === "Rejected") return { bg: "#F8E8E4", fg: "#B3402F" };
  return { bg: "#FBF2DD", fg: "#8A5F0B" };
}

export function decisionLabel(decision: string): string {
  return (
    {
      Approved: "Approved",
      PartiallyApproved: "Partially Approved",
      Rejected: "Rejected",
      RevisionRequested: "Revision Requested",
    }[decision] ?? decision
  );
}

/** Human labels for PR/PO enum values stored in the DB (SCREAMING_SNAKE -> display). */
export const PR_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REVISION_REQUESTED: "Revision Requested",
  IN_PROCUREMENT: "In Procurement",
  FULFILLED: "Fulfilled",
  WITHDRAWN: "Withdrawn",
};

export const PO_STATUS_LABEL: Record<string, string> = {
  PENDING_PO_APPROVAL: "Pending PO Approval",
  ISSUED: "Issued",
  PARTIALLY_RECEIVED: "Partially Received",
  FULLY_RECEIVED: "Fully Received",
  CANCELLED: "Cancelled",
};

export const LINE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export type DemoRole =
  | "requester"
  | "approver"
  | "procurement"
  | "warehouse"
  | "management"
  | "mobile";

export const MODULE_MAP: Record<DemoRole, string[]> = {
  requester: ["requests", "approvals", "orders"],
  approver: ["requests", "approvals"],
  procurement: ["requests", "orders", "receipts"],
  warehouse: ["receipts"],
  management: ["dashboard", "requests", "approvals", "orders", "receipts", "audit"],
  mobile: [],
};

export const MODULE_LABELS: Record<string, [string, string]> = {
  dashboard: ["Dashboard", "DB"],
  requests: ["Purchase Requests", "PR"],
  approvals: ["Approvals", "AP"],
  orders: ["Purchase Orders", "PO"],
  receipts: ["Goods Receipts", "GR"],
  audit: ["Audit Trail", "AU"],
};

export function defaultModule(role: DemoRole): string {
  return (
    {
      requester: "requests",
      approver: "approvals",
      procurement: "orders",
      warehouse: "receipts",
      management: "dashboard",
      mobile: "requests",
    }[role] ?? "requests"
  );
}
