"use client";
import { useApiData } from "@/lib/useApiData";
import { badge, card, colors, th } from "@/lib/ui";

type Row = { id: string; poId: string; summary: string; by: string; date: string; flag: string; fBg: string; fFg: string };

export function GRTable() {
  const { data } = useApiData<{ rows: Row[]; title: string }>("/api/goods-receipts");

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0, font: "700 16px 'IBM Plex Sans'" }}>{data?.title ?? "Goods Receipts"}</h2>
        <span style={{ font: "12px 'IBM Plex Sans'", color: colors.muted }}>every receipt is recorded against its PO</span>
      </div>
      <div style={{ ...card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>GR No.</th>
              <th style={th}>Against PO</th>
              <th style={th}>Received</th>
              <th style={th}>Recorded by</th>
              <th style={th}>Date</th>
              <th style={th}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows ?? []).map((g) => (
              <tr key={g.id}>
                <td style={{ ...tdBase, font: "600 13px 'IBM Plex Sans'", whiteSpace: "nowrap" }}>{g.id}</td>
                <td style={{ ...tdBase, font: "12.5px 'IBM Plex Sans'", whiteSpace: "nowrap" }}>{g.poId}</td>
                <td style={{ ...tdBase, font: "12.5px/1.45 'IBM Plex Sans'", color: colors.inkSoft }}>{g.summary}</td>
                <td style={{ ...tdBase, font: "12.5px 'IBM Plex Sans'", whiteSpace: "nowrap" }}>{g.by}</td>
                <td style={{ ...tdBase, font: "12px 'IBM Plex Sans'", color: colors.muted, whiteSpace: "nowrap" }}>{g.date}</td>
                <td style={tdBase}>
                  <span style={badge(g.fBg, g.fFg, { padding: "3px 9px", font: "600 10.5px 'IBM Plex Sans'" })}>{g.flag}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tdBase = { padding: "12px 16px", borderTop: "1px solid #F0EBDF" };
