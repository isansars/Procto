"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { badge, btnSmall, card, colors, pageTitle } from "@/lib/ui";

type Line = { desc: string; qtyU: string; priceFmt: string; totalFmt: string; status: string; stBg: string; stFg: string; hasPO: boolean; poId: string };
type Event = { ts: string; user: string; action: string; comment: string; hasComment: boolean; dot: string };

type Resp = {
  id: string;
  requester: string;
  branchDept: string;
  dateNeeded: string;
  urgency: string;
  justification: string;
  status: string;
  stBg: string;
  stFg: string;
  total: string;
  lines: Line[];
  timeline: Event[];
  canWithdraw: boolean;
};

export function PRDetail() {
  const { ui, closeDetail, api, bump, showToast } = useAppState();
  const { data } = useApiData<Resp>(ui.prDetailId ? `/api/requests/${ui.prDetailId}` : null, [ui.prDetailId]);

  async function withdraw() {
    if (!ui.prDetailId) return;
    await api.post(`/api/requests/${ui.prDetailId}/withdraw`);
    bump();
    showToast(`${ui.prDetailId} withdrawn and removed from approval queues.`);
    closeDetail();
  }

  if (!data) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button onClick={closeDetail} style={btnSmall}>
          ← Back
        </button>
        <h1 style={pageTitle}>{data.id}</h1>
        <span style={badge(data.stBg, data.stFg, { padding: "5px 12px", font: "600 12px 'IBM Plex Sans'" })}>{data.status}</span>
        <div style={{ flex: 1 }} />
        {data.canWithdraw && (
          <button onClick={withdraw} style={{ background: "#fff", border: "1px solid #D8D1C0", color: colors.red, borderRadius: 8, padding: "9px 14px", font: "600 12px 'IBM Plex Sans'", cursor: "pointer" }}>
            Withdraw PR
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              <Field label="Requester" value={data.requester} />
              <Field label="Branch · Dept" value={data.branchDept} />
              <Field label="Date needed" value={data.dateNeeded} />
              <Field label="Urgency" value={data.urgency} />
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #F0EBDF" }}>
              <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>Justification</div>
              <div style={{ font: "13px/1.5 'IBM Plex Sans'", marginTop: 3, color: colors.inkSoft }}>{data.justification}</div>
            </div>
          </div>

          <div style={{ ...card, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thL}>Item</th>
                  <th style={thR}>Qty</th>
                  <th style={thR}>Est. price</th>
                  <th style={thR}>Total</th>
                  <th style={thL}>Line status</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((ln, i) => (
                  <tr key={i}>
                    <td style={tdL}>
                      {ln.desc}
                      {ln.hasPO && <div style={{ font: "11px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>→ {ln.poId}</div>}
                    </td>
                    <td style={tdR}>{ln.qtyU}</td>
                    <td style={tdR}>{ln.priceFmt}</td>
                    <td style={{ ...tdR, font: "600 13px 'IBM Plex Sans'" }}>{ln.totalFmt}</td>
                    <td style={tdL}>
                      <span style={badge(ln.stBg, ln.stFg, { padding: "3px 9px", font: "600 11px 'IBM Plex Sans'" })}>{ln.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px", borderTop: "1px solid #F0EBDF", font: "700 14px 'IBM Plex Sans'" }}>
              Total&nbsp;&nbsp;{data.total}
            </div>
          </div>
        </div>

        <div style={{ ...card, padding: 18 }}>
          <div style={{ font: "700 14px 'IBM Plex Sans'", marginBottom: 12 }}>Approval timeline &amp; audit</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data.timeline.map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 11 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: ev.dot, marginTop: 4 }} />
                  <div style={{ width: 2, flex: 1, background: "#F0EBDF" }} />
                </div>
                <div style={{ paddingBottom: 16 }}>
                  <div style={{ font: "600 12.5px 'IBM Plex Sans'" }}>{ev.action}</div>
                  <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 1 }}>
                    {ev.user} · {ev.ts}
                  </div>
                  {ev.hasComment && (
                    <div style={{ font: "12px/1.45 'IBM Plex Sans'", color: colors.inkSoft, background: colors.ivory, border: "1px solid #F0EBDF", borderRadius: 7, padding: "7px 9px", marginTop: 6 }}>
                      &ldquo;{ev.comment}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      <div style={{ font: "13px 'IBM Plex Sans'", marginTop: 3 }}>{value}</div>
    </div>
  );
}

const thL = { textAlign: "left" as const, font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase" as const, letterSpacing: ".06em", padding: "12px 16px" };
const thR = { ...thL, textAlign: "right" as const };
const tdL = { padding: "12px 16px", borderTop: "1px solid #F0EBDF", font: "13px 'IBM Plex Sans'" };
const tdR = { ...tdL, textAlign: "right" as const, whiteSpace: "nowrap" as const };
