"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { exportRows, useTableFilter } from "@/lib/filterExport";
import { PR_EXPORT_COLS, PR_STATUS_OPTIONS, prHaystack } from "@/lib/prExport";
import { FilterBar } from "@/components/FilterBar";
import { badge, btnSmall, card, colors, pageTitle, td, th, thRight } from "@/lib/ui";

type Row = {
  id: string;
  date: string;
  requester: string;
  branchDept: string;
  itemsSummary: string;
  total: string;
  status: string;
  stBg: string;
  stFg: string;
  fulfillNote: string;
  hasFulfill: boolean;
};

export function PRTable() {
  const { openPR } = useAppState();
  const { data } = useApiData<{ rows: Row[]; sub: string }>("/api/requests/table");
  const rows = data?.rows ?? [];
  const { filtered, state, setState } = useTableFilter(rows, {
    haystack: prHaystack,
    status: (r) => r.status,
    date: (r) => r.date,
  });

  return (
    <div>
      <h1 style={{ ...pageTitle, marginBottom: 6 }}>Purchase Requests</h1>
      <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, marginBottom: 16 }}>{data?.sub}</div>
      <FilterBar
        state={state}
        onChange={setState}
        statusOptions={PR_STATUS_OPTIONS}
        searchPlaceholder="Search requests…"
        onExportCsv={() => exportRows("csv", "purchase-requests", PR_EXPORT_COLS, filtered)}
        onExportXls={() => exportRows("xls", "purchase-requests", PR_EXPORT_COLS, filtered)}
      />
      <div style={{ ...card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>PR No.</th>
              <th style={th}>Requester</th>
              <th style={th}>Items</th>
              <th style={thRight}>Est. total</th>
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
                <td style={{ ...td, font: "12.5px 'IBM Plex Sans'", color: colors.inkSoft, maxWidth: 300 }}>{pr.itemsSummary}</td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap", font: "600 13px 'IBM Plex Sans'" }}>{pr.total}</td>
                <td style={td}>
                  <span style={badge(pr.stBg, pr.stFg)}>{pr.status}</span>
                  {pr.hasFulfill && (
                    <div style={{ font: "11px/1.45 'IBM Plex Sans'", color: colors.blue, marginTop: 5, maxWidth: 220 }}>{pr.fulfillNote}</div>
                  )}
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
