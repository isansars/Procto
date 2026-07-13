"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { exportRows, useTableFilter, type ExportCol } from "@/lib/filterExport";
import { FilterBar } from "@/components/FilterBar";
import { badge, btnSmall, card, colors, pageTitle, td, th, thRight } from "@/lib/ui";

type Row = {
  id: string;
  date: string;
  requester: string;
  branchDept: string;
  itemsSummary: string;
  total: string;
  route: string;
  waitingOn: string;
  status: string;
  stBg: string;
  stFg: string;
};

const TRACKER_STATUS_OPTIONS = ["Pending Approval", "Approved", "In Procurement", "Fulfilled"];

const TRACKER_EXPORT_COLS: ExportCol<Row>[] = [
  ["PR No.", (r) => r.id],
  ["Date", (r) => r.date],
  ["Requester", (r) => r.requester],
  ["Branch · Dept", (r) => r.branchDept],
  ["Amount", (r) => r.total],
  ["Approval progress", (r) => r.route],
  ["Waiting on / stage", (r) => r.waitingOn],
  ["Status", (r) => r.status],
];

function trackerHaystack(r: Row): string {
  return `${r.id} ${r.requester} ${r.itemsSummary} ${r.route} ${r.waitingOn} ${r.status}`;
}

export function ApprovalTracker() {
  const { openPR } = useAppState();
  const { data } = useApiData<{ rows: Row[]; sub: string }>("/api/approvals/tracker");
  const rows = data?.rows ?? [];
  const { filtered, state, setState } = useTableFilter(rows, {
    haystack: trackerHaystack,
    status: (r) => r.status,
    date: (r) => r.date,
  });

  return (
    <div>
      <h1 style={{ ...pageTitle, marginBottom: 6 }}>Approvals</h1>
      <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, marginBottom: 16 }}>{data?.sub}</div>
      <FilterBar
        state={state}
        onChange={setState}
        statusOptions={TRACKER_STATUS_OPTIONS}
        searchPlaceholder="Search approvals…"
        onExportCsv={() => exportRows("csv", "approval-tracker", TRACKER_EXPORT_COLS, filtered)}
        onExportXls={() => exportRows("xls", "approval-tracker", TRACKER_EXPORT_COLS, filtered)}
      />
      <div style={{ ...card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Request</th>
              <th style={th}>Requester</th>
              <th style={thRight}>Amount</th>
              <th style={th}>Approval progress</th>
              <th style={th}>Status</th>
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((pr) => (
              <tr key={pr.id} className="row-hover">
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  {pr.id}
                  <div style={{ font: "400 11px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>{pr.date}</div>
                </td>
                <td style={td}>
                  {pr.requester}
                  <div style={{ font: "11px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>{pr.branchDept}</div>
                </td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap", font: "600 13px 'IBM Plex Sans'" }}>{pr.total}</td>
                <td style={td}>
                  <div style={{ font: "600 12.5px ui-monospace,'IBM Plex Sans'", whiteSpace: "nowrap" }}>{pr.route}</div>
                  <div style={{ font: "11px 'IBM Plex Sans'", color: colors.muted, marginTop: 3 }}>{pr.waitingOn}</div>
                </td>
                <td style={td}>
                  <span style={badge(pr.stBg, pr.stFg)}>{pr.status}</span>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button onClick={() => openPR(pr.id)} className="btn-outline" style={btnSmall}>
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
