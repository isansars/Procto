"use client";
import { useMemo, useState } from "react";

const ID_MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mei: 4,
  may: 4,
  jun: 5,
  jul: 6,
  agu: 7,
  aug: 7,
  sep: 8,
  okt: 9,
  oct: 9,
  nov: 10,
  des: 11,
  dec: 11,
};

/** Parses the app's "D MMM YYYY[ HH:mm]" display date format back into a Date. */
export function parseDisplayDate(s: string | undefined | null): Date | null {
  if (!s) return null;
  const m = String(s).match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!m) return null;
  const mo = ID_MONTHS[m[2].toLowerCase()];
  if (mo == null) return null;
  return new Date(Number(m[3]), mo, Number(m[1]));
}

export type ExportCol<T> = [label: string, get: (r: T) => string | number];

function downloadBlob(name: string, mime: string, content: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function exportRows<T>(fmt: "csv" | "xls", filename: string, cols: ExportCol<T>[], rows: T[]) {
  if (fmt === "csv") {
    const esc = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv =
      "\uFEFF" +
      [cols.map((c) => esc(c[0])).join(",")].concat(rows.map((r) => cols.map((c) => esc(c[1](r))).join(","))).join("\r\n");
    downloadBlob(`${filename}.csv`, "text/csv;charset=utf-8", csv);
  } else {
    const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const html =
      '<html><head><meta charset="UTF-8"></head><body><table border="1"><tr>' +
      cols.map((c) => `<th>${esc(c[0])}</th>`).join("") +
      "</tr>" +
      rows.map((r) => "<tr>" + cols.map((c) => `<td>${esc(c[1](r))}</td>`).join("") + "</tr>").join("") +
      "</table></body></html>";
    downloadBlob(`${filename}.xls`, "application/vnd.ms-excel", html);
  }
}

export type FilterBarState = { q: string; status: string; dateFrom: string; dateTo: string };
export const DEFAULT_FILTER_STATE: FilterBarState = { q: "", status: "All", dateFrom: "", dateTo: "" };

/** Client-side search + status + date-range filtering over an already-fetched row array. */
export function useTableFilter<T>(
  rows: T[],
  opts: {
    haystack: (r: T) => string;
    status?: (r: T) => string;
    date?: (r: T) => string;
  },
) {
  const [state, setState] = useState<FilterBarState>(DEFAULT_FILTER_STATE);
  const { haystack, status, date } = opts;

  const filtered = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    const from = state.dateFrom ? new Date(state.dateFrom + "T00:00:00") : null;
    const to = state.dateTo ? new Date(state.dateTo + "T23:59:59") : null;
    return rows.filter((r) => {
      if (q && !haystack(r).toLowerCase().includes(q)) return false;
      if (state.status !== "All" && status && status(r) !== state.status) return false;
      if ((from || to) && date) {
        const dt = parseDisplayDate(date(r));
        if (!dt) return false;
        if (from && dt < from) return false;
        if (to && dt > to) return false;
      }
      return true;
    });
  }, [rows, state, haystack, status, date]);

  return { filtered, state, setState };
}
