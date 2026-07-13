"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { card, colors } from "@/lib/ui";
import type { GRFormLine } from "@/context/AppState";

type Line = { id: string; qty: number; received: number };
type Row = {
  id: string;
  vendor: string;
  itemsSummary: string;
  expected: string;
  overdueText: string;
  expColor: string;
  pct: number;
  recvText: string;
};
type PODetail = { lines: Line[] };

export function WarehouseList() {
  const { set, api, showToast } = useAppState();
  const { data } = useApiData<{ rows: Row[] }>("/api/goods-receipts/open-pos");

  async function receive(poId: string) {
    try {
      const po = await api.get<PODetail>(`/api/purchase-orders/${poId}`);
      const lines: Record<string, GRFormLine> = {};
      po.lines.forEach((l) => {
        lines[l.id] = { qty: String(Math.max(0, l.qty - l.received)), condition: "GOOD", note: "", hasPhoto: false };
      });
      set({ whView: "grform", grForm: { poId, lines } });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not load this purchase order.");
    }
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", font: "700 22px 'IBM Plex Sans'" }}>Goods Receipt</h1>
      <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, marginBottom: 18 }}>
        Open purchase orders with pending deliveries. Record what physically arrives — partial deliveries are fine.
      </div>
      {data && data.rows.length === 0 && (
        <div style={{ background: "#fff", border: "1px dashed #D8D1C0", borderRadius: 12, padding: 40, textAlign: "center", color: colors.muted, font: "14px 'IBM Plex Sans'" }}>
          No open POs awaiting delivery.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(data?.rows ?? []).map((po) => (
          <div key={po.id} style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ minWidth: 110 }}>
              <div style={{ font: "700 14px 'IBM Plex Sans'" }}>{po.id}</div>
              <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>{po.vendor}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: "12.5px 'IBM Plex Sans'", color: colors.inkSoft }}>{po.itemsSummary}</div>
              <div style={{ font: "11.5px 'IBM Plex Sans'", marginTop: 3, color: po.expColor }}>
                Expected {po.expected}
                {po.overdueText}
              </div>
            </div>
            <div style={{ minWidth: 150 }}>
              <div style={{ height: 7, background: colors.divider, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${po.pct}%`, background: colors.teal }} />
              </div>
              <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 4 }}>{po.recvText}</div>
            </div>
            <button
              onClick={() => receive(po.id)}
              className="btn-primary"
              style={{ background: colors.teal, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", font: "600 12.5px 'IBM Plex Sans'", cursor: "pointer" }}
            >
              Record receipt
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
