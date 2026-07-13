"use client";
import { useEffect } from "react";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { btnSmall, card, colors } from "@/lib/ui";

type Line = { id: string; desc: string; qtyU: string; priceFmt: string; totalFmt: string; statusRaw: string };
type ChainStep = { name: string; who: string; mark: string; bg: string; fg: string };
type Resp = {
  id: string;
  requester: string;
  branchDept: string;
  urgency: string;
  total: string;
  justification: string;
  lines: Line[];
  approvalChain: ChainStep[];
  overBudget: boolean;
  budgetRemainFmt: string;
  requesterPRCount: number;
};

export function ApproverReview() {
  const { ui, set, api, bump, showToast } = useAppState();
  const prId = ui.selPR;
  const { data } = useApiData<Resp>(prId ? `/api/requests/${prId}` : null, [prId]);

  const pendingLines = (data?.lines ?? []).filter((l) => l.statusRaw === "PENDING");

  useEffect(() => {
    if (!data || Object.keys(ui.dec).length > 0) return;
    const seed: Record<string, "approve" | "reject"> = {};
    pendingLines.forEach((l) => (seed[l.id] = "approve"));
    if (Object.keys(seed).length) set({ dec: seed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (!data) return null;

  const anyReject = pendingLines.some((l) => ui.dec[l.id] === "reject");

  function backToInbox() {
    set({ appView: "inbox", selPR: null, dec: {} });
  }

  async function actApprove() {
    if (anyReject) {
      set({ modal: { kind: "partial", comment: "" } });
      return;
    }
    if (!prId) return;
    const res = await api.post<{ status: string }>(`/api/approvals/${prId}/decide`, { action: "approve", lineDecisions: ui.dec });
    backToInbox();
    bump();
    showToast(res.status === "APPROVED" ? `${prId} fully approved — approved lines are now in the procurement queue.` : `${prId} approved — advanced to the next level.`);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button onClick={backToInbox} style={btnSmall}>
          ← Inbox
        </button>
        <h1 style={{ margin: 0, font: "700 22px 'IBM Plex Sans'" }}>Review {data.id}</h1>
        <span style={{ padding: "5px 12px", borderRadius: 20, font: "600 12px 'IBM Plex Sans'", background: colors.amberTint, color: colors.amber }}>
          Waiting on you
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...card, padding: "18px 20px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            <Field label="Requester" value={data.requester} />
            <Field label="Branch · Dept" value={data.branchDept} />
            <Field label="Urgency" value={data.urgency} />
            <Field label="Total" value={data.total} bold />
            <div style={{ gridColumn: "1/-1", borderTop: "1px solid #F0EBDF", paddingTop: 10 }}>
              <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>Justification</div>
              <div style={{ font: "13px/1.5 'IBM Plex Sans'", marginTop: 3, color: colors.inkSoft }}>{data.justification}</div>
            </div>
          </div>

          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #F0EBDF", font: "700 14px 'IBM Plex Sans'" }}>Line items — decide per line</div>
            {pendingLines.map((ln) => {
              const d = ui.dec[ln.id];
              const baseBtn = { borderRadius: 7, padding: "8px 13px", font: "600 12px 'IBM Plex Sans'", cursor: "pointer" as const };
              return (
                <div key={ln.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: "1px solid #F0EBDF" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "600 13px 'IBM Plex Sans'" }}>{ln.desc}</div>
                    <div style={{ font: "12px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>
                      {ln.qtyU} × {ln.priceFmt} = <b style={{ color: colors.ink }}>{ln.totalFmt}</b>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => set({ dec: { ...ui.dec, [ln.id]: "approve" } })}
                      style={{ ...baseBtn, background: d === "approve" ? colors.teal : "#fff", color: d === "approve" ? "#fff" : colors.inkSoft, border: `1px solid ${d === "approve" ? colors.teal : colors.borderStrong}` }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => set({ dec: { ...ui.dec, [ln.id]: "reject" } })}
                      style={{ ...baseBtn, background: d === "reject" ? colors.red : "#fff", color: d === "reject" ? "#fff" : colors.inkSoft, border: `1px solid ${d === "reject" ? colors.red : colors.borderStrong}` }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 10, padding: "16px 18px", background: colors.ivory }}>
              <button onClick={actApprove} className="btn-primary" style={{ background: colors.teal, color: "#fff", border: "none", borderRadius: 8, padding: "11px 18px", font: "600 13px 'IBM Plex Sans'", cursor: "pointer" }}>
                {anyReject ? "Approve selected lines only" : "Approve all lines"}
              </button>
              <button onClick={() => set({ modal: { kind: "revision", comment: "" } })} style={{ background: "#fff", border: `1px solid ${colors.borderStrong}`, color: colors.amber, borderRadius: 8, padding: "11px 18px", font: "600 13px 'IBM Plex Sans'", cursor: "pointer" }}>
                Request revision
              </button>
              <button onClick={() => set({ modal: { kind: "reject", comment: "" } })} style={{ background: "#fff", border: `1px solid ${colors.borderStrong}`, color: colors.red, borderRadius: 8, padding: "11px 18px", font: "600 13px 'IBM Plex Sans'", cursor: "pointer" }}>
                Reject PR
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.overBudget && (
            <div style={{ background: colors.amberTint, border: `1px solid ${colors.amberBorder}`, borderRadius: 12, padding: "14px 16px", font: "12.5px/1.5 'IBM Plex Sans'", color: colors.amber }}>
              <b>⚠ Budget warning.</b> This PR exceeds the department&apos;s remaining budget for the period ({data.budgetRemainFmt}).
            </div>
          )}
          <div style={{ ...card, padding: "16px 18px" }}>
            <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Approval chain</div>
            {data.approvalChain.map((cs, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", font: "700 11px 'IBM Plex Sans'", background: cs.bg, color: cs.fg }}>{cs.mark}</div>
                <div style={{ font: "13px 'IBM Plex Sans'" }}>
                  {cs.name}
                  <span style={{ color: colors.muted }}> — {cs.who}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...card, padding: "16px 18px" }}>
            <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Requester context</div>
            <div style={{ font: "13px/1.6 'IBM Plex Sans'", color: colors.inkSoft }}>
              {data.requester} has submitted <b>{data.requesterPRCount}</b> PRs in total. Dept budget remaining: <b>{data.budgetRemainFmt}</b>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      <div style={{ font: bold ? "700 13px 'IBM Plex Sans'" : "13px 'IBM Plex Sans'", marginTop: 3 }}>{value}</div>
    </div>
  );
}
