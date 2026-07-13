"use client";
import { useMemo, useState } from "react";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { PO_APPROVAL_THRESHOLD, rp } from "@/lib/domain";
import { btnPrimary, btnSmall, card, cardPad, colors, input, label as labelStyle } from "@/lib/ui";

type QLine = { id: string; desc: string; qtyU: string; totalFmt: string; totalRaw: number };
type QGroup = { id: string; requester: string; lines: QLine[] };
type Vendor = { id: string; name: string; meta: string };

export function POForm() {
  const { ui, set, api, bump, showToast } = useAppState();
  const { data: queueData } = useApiData<{ groups: QGroup[] }>("/api/purchase-orders/queue");
  const { data: vendorData } = useApiData<{ vendors: Vendor[] }>("/api/vendors");
  const [vendorIdOverride, setVendorIdOverride] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const vendorId = vendorIdOverride ?? ui.poVendor ?? vendorData?.vendors[0]?.id ?? "";
  const setVendorId = setVendorIdOverride;

  const selArr = useMemo(() => {
    const out: { pr: QGroup; line: QLine }[] = [];
    (queueData?.groups ?? []).forEach((g) => g.lines.forEach((l) => ui.sel[l.id] && out.push({ pr: g, line: l })));
    return out;
  }, [queueData, ui.sel]);

  const total = selArr.reduce((s, x) => s + x.line.totalRaw, 0);
  const needsApproval = total > PO_APPROVAL_THRESHOLD;
  const vendor = vendorData?.vendors.find((v) => v.id === vendorId);

  async function createPO() {
    if (!vendorId || !selArr.length) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ id: string; needsApproval: boolean }>("/api/purchase-orders", {
        lineIds: selArr.map((x) => x.line.id),
        vendorId,
      });
      set({ ordView: "detail", selPO: res.id, sel: {} });
      bump();
      showToast(
        res.needsApproval
          ? `${res.id} created — above ${rp(PO_APPROVAL_THRESHOLD)}, routed to Procurement Manager.`
          : `${res.id} issued to ${vendor?.name ?? "vendor"}. PDF sent by email.`,
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not create the purchase order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
      <div style={cardPad}>
        <div style={{ font: "700 15px 'IBM Plex Sans'", marginBottom: 14 }}>New Purchase Order</div>
        <label style={{ ...labelStyle, maxWidth: 380 }}>
          Vendor
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} style={input}>
            {(vendorData?.vendors ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <div style={{ font: "12px 'IBM Plex Sans'", color: colors.muted, marginTop: 5 }}>{vendor?.meta}</div>
        <div style={{ marginTop: 16, border: "1px solid #F0EBDF", borderRadius: 10, overflow: "hidden" }}>
          {selArr.map((x) => (
            <div key={x.line.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: "1px solid #F0EBDF" }}>
              <div style={{ flex: 1 }}>
                <div style={{ font: "600 13px 'IBM Plex Sans'" }}>{x.line.desc.split("  ·  ")[0]}</div>
                <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>from {x.pr.id} · {x.pr.requester}</div>
              </div>
              <div style={{ font: "12.5px 'IBM Plex Sans'", color: colors.muted }}>{x.line.qtyU}</div>
              <div style={{ font: "600 13px 'IBM Plex Sans'", minWidth: 120, textAlign: "right" }}>{x.line.totalFmt}</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px", font: "700 14px 'IBM Plex Sans'" }}>
            PO total&nbsp;&nbsp;{rp(total)}
          </div>
        </div>
        {needsApproval && (
          <div style={{ marginTop: 14, background: colors.amberTint, border: `1px solid ${colors.amberBorder}`, color: colors.amber, borderRadius: 8, padding: "10px 12px", font: "12.5px/1.5 'IBM Plex Sans'" }}>
            <b>Above {rp(PO_APPROVAL_THRESHOLD)}.</b> This PO will require Procurement Manager approval before it can be issued to the vendor.
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={createPO} disabled={submitting || !selArr.length} className="btn-primary" style={btnPrimary}>
            {needsApproval ? "Create PO — submit for approval" : "Create & issue PO"}
          </button>
          <button onClick={() => set({ ordView: "list" })} style={btnSmall}>
            Cancel
          </button>
        </div>
      </div>
      <div style={{ ...card, padding: "16px 18px" }}>
        <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Traceability
        </div>
        <div style={{ font: "12.5px/1.6 'IBM Plex Sans'", color: colors.inkSoft }}>
          Every PO line keeps a reference to its source PR line and requester. Source PRs move to <b>In Procurement</b> when this PO is created.
        </div>
      </div>
    </div>
  );
}
