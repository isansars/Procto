import type { ExportCol } from "@/lib/filterExport";

export type PRExportRow = {
  id: string;
  date: string;
  requester: string;
  branchDept: string;
  itemsSummary: string;
  total: string;
  status: string;
  fulfillNote: string;
};

export const PR_STATUS_OPTIONS = [
  "Draft",
  "Pending Approval",
  "Revision Requested",
  "Approved",
  "In Procurement",
  "Fulfilled",
  "Rejected",
  "Withdrawn",
];

export const PR_EXPORT_COLS: ExportCol<PRExportRow>[] = [
  ["PR No.", (r) => r.id],
  ["Date", (r) => r.date],
  ["Requester", (r) => r.requester],
  ["Branch · Dept", (r) => r.branchDept],
  ["Items", (r) => r.itemsSummary],
  ["Total", (r) => r.total],
  ["Status", (r) => r.status],
  ["Fulfillment", (r) => r.fulfillNote],
];

export function prHaystack(r: PRExportRow): string {
  return `${r.id} ${r.requester} ${r.itemsSummary} ${r.status} ${r.fulfillNote}`;
}
