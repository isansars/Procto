"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { btnPrimary, card, colors } from "@/lib/ui";

type Row = {
  id: string;
  date: string;
  requester: string;
  branchDept: string;
  itemsSummary: string;
  total: string;
  urgent: boolean;
  waitText: string;
  waitColor: string;
};

export function ApproverInbox() {
  const { set } = useAppState();
  const { data } = useApiData<{ rows: Row[]; actingName: string }>("/api/approvals/inbox");

  return (
    <div>
      <h1 style={{ margin: 0, font: "700 22px 'IBM Plex Sans'" }}>Approval Inbox</h1>
      <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, marginBottom: 16 }}>
        Sequential approval per matrix — you only see PRs waiting at your level.
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
          background: "#fff",
          border: `1px solid ${colors.border}`,
          borderRadius: 9,
          padding: "8px 14px",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.teal }} />
        <span style={{ font: "600 12.5px 'IBM Plex Sans'", color: colors.inkSoft }}>Acting as {data?.actingName ?? "…"}</span>
        <span style={{ font: "12px 'IBM Plex Sans'", color: colors.muted }}>— switch approval level via the pipeline above</span>
      </div>

      {data && data.rows.length === 0 && (
        <div style={{ background: "#fff", border: "1px dashed #D8D1C0", borderRadius: 12, padding: 40, textAlign: "center", color: colors.muted, font: "14px 'IBM Plex Sans'" }}>
          No PRs waiting at this level. 🎉
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(data?.rows ?? []).map((pr) => (
          <div key={pr.id} style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ minWidth: 110 }}>
              <div style={{ font: "700 14px 'IBM Plex Sans'" }}>{pr.id}</div>
              <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>{pr.date}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "13px 'IBM Plex Sans'", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pr.itemsSummary}</div>
              <div style={{ font: "12px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>
                {pr.requester} · {pr.branchDept}
              </div>
            </div>
            {pr.urgent && (
              <span style={{ padding: "4px 10px", borderRadius: 20, font: "600 11px 'IBM Plex Sans'", background: colors.redTint, color: colors.red }}>
                URGENT
              </span>
            )}
            <div style={{ textAlign: "right", minWidth: 120 }}>
              <div style={{ font: "700 14px 'IBM Plex Sans'" }}>{pr.total}</div>
              <div style={{ font: "11.5px 'IBM Plex Sans'", color: pr.waitColor, marginTop: 2 }}>{pr.waitText}</div>
            </div>
            <button
              onClick={() => set({ appView: "review", selPR: pr.id, dec: {} })}
              className="btn-primary"
              style={{ ...btnPrimary, padding: "10px 16px", font: "600 12.5px 'IBM Plex Sans'" }}
            >
              Review
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
