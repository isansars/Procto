"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { exportRows, useTableFilter, type ExportCol } from "@/lib/filterExport";
import { FilterBar } from "@/components/FilterBar";
import { badge, card, colors, th } from "@/lib/ui";

type Row = {
  ref: string;
  prId: string;
  levelName: string;
  approver: string;
  decision: string;
  dBg: string;
  dFg: string;
  comment: string;
  ts: string;
  prStatus: string;
  sBg: string;
  sFg: string;
  amount: string;
};

const DECISION_OPTIONS = ["Approved", "Partially Approved", "Rejected", "Revision Requested"];

const HISTORY_EXPORT_COLS: ExportCol<Row>[] = [
  ["Ref", (r) => r.ref],
  ["Request", (r) => r.prId],
  ["Level", (r) => r.levelName],
  ["Approver", (r) => r.approver],
  ["Decision", (r) => r.decision],
  ["Comment", (r) => r.comment],
  ["Timestamp", (r) => r.ts],
  ["Request status", (r) => r.prStatus],
  ["Amount", (r) => r.amount],
];

function historyHaystack(r: Row): string {
  return `${r.ref} ${r.prId} ${r.approver} ${r.levelName} ${r.comment} ${r.decision}`;
}

export function DecisionHistory() {
  const { openPR } = useAppState();
  const { data } = useApiData<{ rows: Row[] }>("/api/approvals/history");
  const rows = data?.rows ?? [];
  const { filtered, state, setState } = useTableFilter(rows, {
    haystack: historyHaystack,
    status: (r) => r.decision,
    date: (r) => r.ts,
  });

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0, font: "700 16px 'IBM Plex Sans'" }}>Decision history</h2>
        <span style={{ font: "12px 'IBM Plex Sans'", color: colors.muted }}>every approval action is recorded permanently for accountability</span>
      </div>
      <FilterBar
        state={state}
        onChange={setState}
        statusOptions={DECISION_OPTIONS}
        searchPlaceholder="Search decisions…"
        onExportCsv={() => exportRows("csv", "approval-decisions", HISTORY_EXPORT_COLS, filtered)}
        onExportXls={() => exportRows("xls", "approval-decisions", HISTORY_EXPORT_COLS, filtered)}
      />
      {data && rows.length === 0 && (
        <div style={{ background: "#fff", border: "1px dashed #D8D1C0", borderRadius: 12, padding: 26, textAlign: "center", color: colors.muted, font: "13px 'IBM Plex Sans'" }}>
          No decisions recorded at this level yet.
        </div>
      )}
      {rows.length > 0 && (
        <div style={{ ...card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Ref</th>
                <th style={th}>Request</th>
                <th style={th}>Level · Approver</th>
                <th style={th}>Decision</th>
                <th style={th}>Comment</th>
                <th style={th}>Date</th>
                <th style={th}>Request status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} onClick={() => openPR(r.prId)} className="row-hover" style={{ cursor: "pointer" }}>
                  <td style={{ ...tdBase, font: "600 12px ui-monospace,'IBM Plex Sans'", color: colors.muted, whiteSpace: "nowrap" }}>{r.ref}</td>
                  <td style={{ ...tdBase, font: "600 13px 'IBM Plex Sans'", whiteSpace: "nowrap" }}>
                    {r.prId}
                    <div style={{ font: "400 11px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>{r.amount}</div>
                  </td>
                  <td style={{ ...tdBase, font: "12.5px 'IBM Plex Sans'" }}>
                    {r.levelName}
                    <div style={{ font: "11px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>{r.approver}</div>
                  </td>
                  <td style={tdBase}>
                    <span style={badge(r.dBg, r.dFg, { font: "600 11.5px 'IBM Plex Sans'" })}>{r.decision}</span>
                  </td>
                  <td style={{ ...tdBase, font: "12px/1.45 'IBM Plex Sans'", color: colors.inkSoft, maxWidth: 240 }}>{r.comment}</td>
                  <td style={{ ...tdBase, font: "12px 'IBM Plex Sans'", color: colors.muted, whiteSpace: "nowrap" }}>{r.ts}</td>
                  <td style={tdBase}>
                    <span style={badge(r.sBg, r.sFg, { padding: "3px 9px", font: "600 11px 'IBM Plex Sans'" })}>{r.prStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const tdBase = { padding: "12px 16px", borderTop: "1px solid #F0EBDF" };
