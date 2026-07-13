"use client";
import { useApiData } from "@/lib/useApiData";
import { exportRows, useTableFilter, type ExportCol } from "@/lib/filterExport";
import { FilterBar } from "@/components/FilterBar";
import { badge, card, colors, th } from "@/lib/ui";

type Row = { id: string; poId: string; summary: string; by: string; date: string; flag: string; fBg: string; fFg: string };

const GR_FLAG_OPTIONS = ["OK", "DISCREPANCY"];

const GR_EXPORT_COLS: ExportCol<Row>[] = [
  ["GR No.", (r) => r.id],
  ["PO", (r) => r.poId],
  ["Date", (r) => r.date],
  ["Received by", (r) => r.by],
  ["Flag", (r) => r.flag],
  ["Lines", (r) => r.summary],
];

function grHaystack(r: Row): string {
  return `${r.id} ${r.poId} ${r.by} ${r.summary}`;
}

export function GRTable() {
  const { data } = useApiData<{ rows: Row[]; title: string }>("/api/goods-receipts");
  const rows = data?.rows ?? [];
  const { filtered, state, setState } = useTableFilter(rows, {
    haystack: grHaystack,
    status: (r) => r.flag,
    date: (r) => r.date,
  });

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0, font: "700 16px 'IBM Plex Sans'" }}>{data?.title ?? "Goods Receipts"}</h2>
        <span style={{ font: "12px 'IBM Plex Sans'", color: colors.muted }}>every receipt is recorded against its PO</span>
      </div>
      <FilterBar
        state={state}
        onChange={setState}
        statusOptions={GR_FLAG_OPTIONS}
        searchPlaceholder="Search receipts…"
        onExportCsv={() => exportRows("csv", "goods-receipts", GR_EXPORT_COLS, filtered)}
        onExportXls={() => exportRows("xls", "goods-receipts", GR_EXPORT_COLS, filtered)}
      />
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
            {filtered.map((g) => (
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
