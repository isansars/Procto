"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { badge, btnSmall, card, colors, pageTitle } from "@/lib/ui";

type Line = { desc: string; prRef: string; ordText: string; pct: number; recvText: string };
type GR = { id: string; date: string; flag: string; fBg: string; fFg: string; summary: string };
type Resp = {
  id: string;
  vendor: string;
  branch: string;
  status: string;
  stBg: string;
  stFg: string;
  total: string;
  expected: string;
  expColor: string;
  lines: Line[];
  grs: GR[];
  noGRs: boolean;
  canApprove: boolean;
  canCancel: boolean;
};

export function PODetail() {
  const { ui, set, api, bump, showToast } = useAppState();
  const { data } = useApiData<Resp>(ui.selPO ? `/api/purchase-orders/${ui.selPO}` : null, [ui.selPO]);

  async function approve() {
    if (!ui.selPO) return;
    await api.post(`/api/purchase-orders/${ui.selPO}/approve`);
    bump();
    showToast(`${ui.selPO} approved by Procurement Manager and issued to vendor.`);
  }
  async function cancel() {
    if (!ui.selPO) return;
    await api.post(`/api/purchase-orders/${ui.selPO}/cancel`);
    bump();
    showToast(`${ui.selPO} cancelled — source PR lines are back in the queue.`);
  }

  if (!data) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button onClick={() => set({ ordView: "list" })} style={btnSmall}>
          ← POs
        </button>
        <h1 style={pageTitle}>{data.id}</h1>
        <span style={badge(data.stBg, data.stFg, { padding: "5px 12px", font: "600 12px 'IBM Plex Sans'" })}>{data.status}</span>
        <div style={{ flex: 1 }} />
        {data.canApprove && (
          <button onClick={approve} style={{ background: colors.teal, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", font: "600 13px 'IBM Plex Sans'", cursor: "pointer" }}>
            Approve &amp; issue (as Hendra, Proc. Manager)
          </button>
        )}
        {data.canCancel && (
          <button onClick={cancel} style={{ background: "#fff", border: `1px solid ${colors.borderStrong}`, color: colors.red, borderRadius: 8, padding: "10px 16px", font: "600 12px 'IBM Plex Sans'", cursor: "pointer" }}>
            Cancel PO
          </button>
        )}
        <button style={btnSmall}>⬇ PDF</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F0EBDF", display: "flex", gap: 24, font: "13px 'IBM Plex Sans'" }}>
            <div>
              <span style={{ color: colors.muted }}>Vendor</span>
              <br />
              <b>{data.vendor}</b>
            </div>
            <div>
              <span style={{ color: colors.muted }}>Branch</span>
              <br />
              <b>{data.branch}</b>
            </div>
            <div>
              <span style={{ color: colors.muted }}>Expected delivery</span>
              <br />
              <b style={{ color: data.expColor }}>{data.expected}</b>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: "right" }}>
              <span style={{ color: colors.muted }}>Total</span>
              <br />
              <b style={{ fontSize: 15 }}>{data.total}</b>
            </div>
          </div>
          {data.lines.map((ln, i) => (
            <div key={i} style={{ padding: "13px 18px", borderBottom: "1px solid #F0EBDF" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "600 13px 'IBM Plex Sans'" }}>{ln.desc}</div>
                  <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>from {ln.prRef}</div>
                </div>
                <div style={{ font: "12.5px 'IBM Plex Sans'", color: colors.muted }}>{ln.ordText}</div>
                <div style={{ minWidth: 130 }}>
                  <div style={{ height: 7, background: colors.divider, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ln.pct}%`, background: colors.teal }} />
                  </div>
                  <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 3 }}>{ln.recvText}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ font: "700 14px 'IBM Plex Sans'", marginBottom: 12 }}>Goods receipts</div>
          {data.noGRs && <div style={{ font: "12.5px 'IBM Plex Sans'", color: colors.muted }}>None recorded yet.</div>}
          {data.grs.map((gr) => (
            <div key={gr.id} style={{ border: "1px solid #F0EBDF", borderRadius: 9, padding: "11px 13px", marginBottom: 9 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <b style={{ font: "600 12.5px 'IBM Plex Sans'" }}>{gr.id}</b>
                <span style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted }}>{gr.date}</span>
                <div style={{ flex: 1 }} />
                <span style={badge(gr.fBg, gr.fFg, { padding: "3px 8px", font: "600 10.5px 'IBM Plex Sans'" })}>{gr.flag}</span>
              </div>
              <div style={{ font: "12px/1.5 'IBM Plex Sans'", color: colors.inkSoft, marginTop: 5 }}>{gr.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
