"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { IOSDevice } from "@/components/IOSDevice";
import { colors } from "@/lib/ui";

type Row = { id: string; requester: string; branchDept: string; itemsSummary: string; total: string; urgent: boolean; waitedDays: number };

export function MobileApproval() {
  const { ui, set, api, bump, showToast } = useAppState();
  const { data } = useApiData<{ rows: Row[] }>("/api/approvals/inbox");
  const rows = data?.rows ?? [];

  async function quickApprove(id: string) {
    const res = await api.post<{ status: string }>(`/api/approvals/${id}/decide`, { action: "approve" });
    bump();
    showToast(res.status === "APPROVED" ? `${id} fully approved.` : `${id} approved — advanced to next level.`);
  }

  async function confirmReject(id: string) {
    if (!ui.mobComment.trim()) {
      showToast("A comment is required to reject.");
      return;
    }
    await api.post(`/api/approvals/${id}/decide`, { action: "reject", comment: ui.mobComment });
    set({ mobRejectId: null, mobComment: "" });
    bump();
    showToast(`${id} rejected — requester notified.`);
  }

  return (
    <div style={{ display: "flex", gap: 40, alignItems: "flex-start", justifyContent: "center", paddingTop: 6 }}>
      <IOSDevice title="Approvals">
        <div style={{ padding: "12px 16px 40px", background: "#F7F4EE", minHeight: 600 }}>
          <div style={{ font: "700 20px 'IBM Plex Sans'", margin: "6px 0 2px" }}>Approval Inbox</div>
          <div style={{ font: "12.5px 'IBM Plex Sans'", color: colors.muted, marginBottom: 14 }}>Budi Santoso · Department Approver</div>
          {data && rows.length === 0 && (
            <div style={{ border: "1px dashed #D8D1C0", borderRadius: 12, padding: 30, textAlign: "center", color: colors.muted, font: "13px 'IBM Plex Sans'" }}>
              All caught up 🎉
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map((pr) => {
              const rejecting = ui.mobRejectId === pr.id;
              return (
                <div key={pr.id} style={{ background: "#fff", border: "1px solid #E6E0D4", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ font: "600 14px 'IBM Plex Sans'" }}>{pr.id}</b>
                    {pr.urgent && (
                      <span style={{ padding: "2px 8px", borderRadius: 20, font: "600 10px 'IBM Plex Sans'", background: colors.redTint, color: colors.red }}>URGENT</span>
                    )}
                    <div style={{ flex: 1 }} />
                    <b style={{ font: "600 14px 'IBM Plex Sans'" }}>{pr.total}</b>
                  </div>
                  <div style={{ font: "12.5px/1.5 'IBM Plex Sans'", color: colors.inkSoft, marginTop: 6 }}>{pr.itemsSummary}</div>
                  <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 3 }}>
                    {pr.requester} · {pr.branchDept} · waiting {pr.waitedDays}d
                  </div>
                  {rejecting ? (
                    <div style={{ marginTop: 10 }}>
                      <input
                        value={ui.mobComment}
                        onChange={(e) => set({ mobComment: e.target.value })}
                        placeholder="Reason (required)…"
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px 11px", border: "1px solid #D8D1C0", borderRadius: 9, font: "13px 'IBM Plex Sans'", background: "#fff", color: colors.ink }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => confirmReject(pr.id)}
                          style={{ flex: 1, background: colors.red, color: "#fff", border: "none", borderRadius: 10, padding: 12, font: "600 13px 'IBM Plex Sans'", cursor: "pointer" }}
                        >
                          Confirm reject
                        </button>
                        <button
                          onClick={() => set({ mobRejectId: null })}
                          style={{ flex: 1, background: "#fff", border: "1px solid #D8D1C0", color: colors.inkSoft, borderRadius: 10, padding: 12, font: "600 13px 'IBM Plex Sans'", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => quickApprove(pr.id)}
                        style={{ flex: 1, background: colors.teal, color: "#fff", border: "none", borderRadius: 10, padding: 13, font: "600 13.5px 'IBM Plex Sans'", cursor: "pointer" }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => set({ mobRejectId: pr.id, mobComment: "" })}
                        style={{ flex: 1, background: "#fff", border: "1px solid #D8D1C0", color: colors.red, borderRadius: 10, padding: 13, font: "600 13.5px 'IBM Plex Sans'", cursor: "pointer" }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </IOSDevice>
      <div style={{ maxWidth: 280, background: "#fff", border: "1px solid #E6E0D4", borderRadius: 12, padding: "16px 18px", font: "12.5px/1.6 'IBM Plex Sans'", color: colors.inkSoft }}>
        <b>Mobile approval flow</b>
        <br />
        Approvers are often away from their desk — the PRD requires approve/reject to work well on mobile browsers. Actions here update the same shared state: approve a PR and watch it move through the desktop views.
      </div>
    </div>
  );
}
