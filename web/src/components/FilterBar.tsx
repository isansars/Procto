"use client";
import type { FilterBarState } from "@/lib/filterExport";
import { colors } from "@/lib/ui";

const dateInput = {
  padding: "8px 10px",
  border: "1px solid #D8D1C0",
  borderRadius: 8,
  font: "12.5px 'IBM Plex Sans'",
  background: "#fff",
  color: colors.ink,
};

const exportBtn = {
  background: "#fff",
  border: "1px solid #D8D1C0",
  color: colors.inkSoft,
  borderRadius: 8,
  padding: "9px 13px",
  font: "600 12px 'IBM Plex Sans'",
  cursor: "pointer" as const,
};

export function FilterBar({
  state,
  onChange,
  statusOptions,
  searchPlaceholder = "Search…",
  searchWidth = 250,
  onExportCsv,
  onExportXls,
}: {
  state: FilterBarState;
  onChange: (s: FilterBarState) => void;
  statusOptions?: string[];
  searchPlaceholder?: string;
  searchWidth?: number;
  onExportCsv: () => void;
  onExportXls: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
      <input
        value={state.q}
        onChange={(e) => onChange({ ...state, q: e.target.value })}
        placeholder={searchPlaceholder}
        style={{ width: searchWidth, padding: "9px 12px", border: "1px solid #D8D1C0", borderRadius: 8, font: "13px 'IBM Plex Sans'", background: "#fff", color: colors.ink }}
      />
      {statusOptions && (
        <select
          value={state.status}
          onChange={(e) => onChange({ ...state, status: e.target.value })}
          style={{ padding: "9px 10px", border: "1px solid #D8D1C0", borderRadius: 8, font: "13px 'IBM Plex Sans'", background: "#fff", color: colors.ink }}
        >
          {["All", ...statusOptions].map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
      <input type="date" value={state.dateFrom} onChange={(e) => onChange({ ...state, dateFrom: e.target.value })} title="From date" style={dateInput} />
      <span style={{ font: "12px 'IBM Plex Sans'", color: colors.muted }}>to</span>
      <input type="date" value={state.dateTo} onChange={(e) => onChange({ ...state, dateTo: e.target.value })} title="To date" style={dateInput} />
      <div style={{ flex: 1 }} />
      <button onClick={onExportCsv} className="btn-outline" style={exportBtn}>
        ⬇ .csv
      </button>
      <button onClick={onExportXls} className="btn-outline" style={exportBtn}>
        ⬇ Excel
      </button>
    </div>
  );
}
