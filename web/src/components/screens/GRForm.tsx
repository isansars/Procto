"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { GR_TOLERANCE_PCT, PO_STATUS_LABEL } from "@/lib/domain";
import { btnPrimary, btnSmall, card, colors } from "@/lib/ui";
import type { GRFormLine } from "@/context/AppState";

type Line = { id: string; desc: string; qty: number; received: number };
type Resp = { vendor: string; lines: Line[] };

export function GRForm() {
  const { ui, set, api, bump, showToast } = useAppState();
  const poId = ui.grForm?.poId ?? null;
  const { data } = useApiData<Resp>(poId ? `/api/purchase-orders/${poId}` : null, [poId]);
  const tolFraction = GR_TOLERANCE_PCT / 100;

  if (!ui.grForm || !data) return null;
  const grForm = ui.grForm;

  function updateLine(lineId: string, patch: Partial<GRFormLine>) {
    if (!ui.grForm) return;
    set({ grForm: { ...ui.grForm, lines: { ...ui.grForm.lines, [lineId]: { ...ui.grForm.lines[lineId], ...patch } } } });
  }

  async function submit() {
    if (!ui.grForm) return;
    try {
      const res = await api.post<{ id: string; poStatus: string; flag: string }>("/api/goods-receipts", {
        poId: ui.grForm.poId,
        lines: Object.entries(ui.grForm.lines).map(([poLineId, f]) => ({
          poLineId,
          qty: Number(f.qty) || 0,
          condition: f.condition,
          note: f.note,
          hasPhoto: f.hasPhoto,
        })),
      });
      set({ whView: "list", grForm: null });
      bump();
      showToast(
        `${res.id} recorded — ${ui.grForm.poId} is now ${PO_STATUS_LABEL[res.poStatus]}${res.flag === "DISCREPANCY" ? ". Discrepancy flagged for procurement follow-up." : "."}`,
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not submit the goods receipt.");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button onClick={() => set({ whView: "list", grForm: null })} style={btnSmall}>
          ← Back
        </button>
        <h1 style={{ margin: 0, font: "700 22px 'IBM Plex Sans'" }}>Goods Receipt — {grForm.poId}</h1>
        <span style={{ font: "13px 'IBM Plex Sans'", color: colors.muted }}>{data.vendor}</span>
      </div>

      <div style={{ ...card, overflow: "hidden", maxWidth: 860 }}>
        {data.lines.map((l) => {
          const f = grForm.lines[l.id];
          if (!f) return null;
          const q = Number(f.qty) || 0;
          const remaining = Math.max(0, l.qty - l.received);
          const needPhoto = f.condition !== "GOOD" && !f.hasPhoto;
          const overTol = l.received + q > l.qty * (1 + tolFraction);
          return (
            <div key={l.id} style={{ padding: "16px 20px", borderBottom: "1px solid #F0EBDF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <b style={{ font: "600 13.5px 'IBM Plex Sans'" }}>{l.desc}</b>
                <span style={{ font: "12px 'IBM Plex Sans'", color: colors.muted }}>
                  ordered {l.qty} · received so far {l.received} · remaining <b>{remaining}</b>
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "120px 150px 1fr auto", gap: 12, marginTop: 11, alignItems: "end" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, font: "600 11.5px 'IBM Plex Sans'", color: colors.inkSoft }}>
                  Qty received now
                  <input
                    type="number"
                    min={0}
                    value={f.qty}
                    onChange={(e) => updateLine(l.id, { qty: e.target.value })}
                    style={{ padding: "9px 10px", border: "1px solid #D8D1C0", borderRadius: 8, font: "13px 'IBM Plex Sans'", background: "#fff", color: colors.ink }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, font: "600 11.5px 'IBM Plex Sans'", color: colors.inkSoft }}>
                  Condition
                  <select
                    value={f.condition}
                    onChange={(e) => updateLine(l.id, { condition: e.target.value as GRFormLine["condition"] })}
                    style={{ padding: "9px 10px", border: "1px solid #D8D1C0", borderRadius: 8, font: "13px 'IBM Plex Sans'", background: "#fff", color: colors.ink }}
                  >
                    <option value="GOOD">Good</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, font: "600 11.5px 'IBM Plex Sans'", color: colors.inkSoft }}>
                  Notes
                  <input
                    value={f.note}
                    onChange={(e) => updateLine(l.id, { note: e.target.value })}
                    placeholder="e.g. 1 box dus penyok"
                    style={{ padding: "9px 10px", border: "1px solid #D8D1C0", borderRadius: 8, font: "13px 'IBM Plex Sans'", background: "#fff", color: colors.ink }}
                  />
                </label>
                <button
                  onClick={() => updateLine(l.id, { hasPhoto: !f.hasPhoto })}
                  style={{
                    borderRadius: 8,
                    padding: "9px 13px",
                    font: "600 12px 'IBM Plex Sans'",
                    cursor: "pointer",
                    background: f.hasPhoto ? "#E3F0EB" : "#fff",
                    color: f.hasPhoto ? colors.teal : colors.inkSoft,
                    border: f.hasPhoto ? "1px solid #9CC8BA" : "1px dashed #D8D1C0",
                  }}
                >
                  {f.hasPhoto ? "🖼 foto_bukti.jpg ✓" : "📷 Attach photo"}
                </button>
              </div>
              {needPhoto && (
                <div style={{ marginTop: 8, font: "12px 'IBM Plex Sans'", color: colors.amber, background: colors.amberTint, border: `1px solid ${colors.amberBorder}`, borderRadius: 7, padding: "7px 10px" }}>
                  📷 Photo evidence strongly encouraged for damaged/rejected goods.
                </div>
              )}
              {overTol && (
                <div style={{ marginTop: 8, font: "12px 'IBM Plex Sans'", color: colors.red, background: colors.redTint, border: `1px solid ${colors.redBorder}`, borderRadius: 7, padding: "7px 10px" }}>
                  ⚠ Over-delivery beyond {GR_TOLERANCE_PCT}% tolerance — this GR will be flagged for procurement review.
                </div>
              )}
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 10, padding: "16px 20px", background: colors.ivory }}>
          <button onClick={submit} className="btn-primary" style={btnPrimary}>
            Submit goods receipt
          </button>
          <div style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  );
}
