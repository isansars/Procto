"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { badge, btnSmall, card, colors, pageTitle } from "@/lib/ui";

type Row = {
  id: string;
  date: string;
  vendor: string;
  sourceText: string;
  pct: number;
  recvText: string;
  status: string;
  stBg: string;
  stFg: string;
  total: string;
};

export function POList({ showTitle, showOrderRecordsHeading }: { showTitle: boolean; showOrderRecordsHeading: boolean }) {
  const { set } = useAppState();
  const { data } = useApiData<{ rows: Row[]; sub: string }>("/api/purchase-orders");

  return (
    <div>
      {showTitle && (
        <>
          <h1 style={{ ...pageTitle, marginBottom: 6 }}>Purchase Orders</h1>
          <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, marginBottom: 16 }}>{data?.sub}</div>
        </>
      )}
      {showOrderRecordsHeading && <h2 style={{ margin: "26px 0 12px", font: "700 15px 'IBM Plex Sans'" }}>Order records</h2>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(data?.rows ?? []).map((po) => (
          <div key={po.id} style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ minWidth: 110 }}>
              <div style={{ font: "700 14px 'IBM Plex Sans'" }}>{po.id}</div>
              <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>{po.date}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: "13px 'IBM Plex Sans'" }}>{po.vendor}</div>
              <div style={{ font: "12px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>{po.sourceText}</div>
            </div>
            <div style={{ minWidth: 150 }}>
              <div style={{ height: 7, background: colors.divider, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${po.pct}%`, background: colors.teal }} />
              </div>
              <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 4 }}>{po.recvText}</div>
            </div>
            <span style={badge(po.stBg, po.stFg)}>{po.status}</span>
            <div style={{ font: "700 14px 'IBM Plex Sans'", minWidth: 120, textAlign: "right" }}>{po.total}</div>
            <button onClick={() => set({ ordView: "detail", selPO: po.id })} className="btn-outline" style={btnSmall}>
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
