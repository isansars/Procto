"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { badge, btnSmall, card, colors, pageTitle, td, th, thRight } from "@/lib/ui";

type Row = {
  id: string;
  date: string;
  requester: string;
  branchDept: string;
  total: string;
  route: string;
  waitingOn: string;
  status: string;
  stBg: string;
  stFg: string;
};

export function ApprovalTracker() {
  const { openPR } = useAppState();
  const { data } = useApiData<{ rows: Row[]; sub: string }>("/api/approvals/tracker");

  return (
    <div>
      <h1 style={{ ...pageTitle, marginBottom: 6 }}>Approvals</h1>
      <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, marginBottom: 16 }}>{data?.sub}</div>
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
            {(data?.rows ?? []).map((pr) => (
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
