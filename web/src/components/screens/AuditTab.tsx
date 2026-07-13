"use client";
import { useApiData } from "@/lib/useApiData";
import { card, colors } from "@/lib/ui";

type Row = { ts: string; entity: string; action: string; user: string };

export function AuditTab() {
  const { data } = useApiData<{ rows: Row[] }>("/api/audit");

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", font: "700 22px 'IBM Plex Sans'" }}>Audit Trail</h1>
      <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, marginBottom: 16 }}>
        Append-only, immutable log of every PR, PO and GR lifecycle event — no role can edit or delete entries.
      </div>
      <div style={{ ...card, padding: "6px 20px" }}>
        {(data?.rows ?? []).map((ev, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "10px 2px", borderBottom: "1px solid #F7F4EE", font: "12.5px 'IBM Plex Sans'" }}>
            <span style={{ color: colors.muted, minWidth: 130 }}>{ev.ts}</span>
            <b style={{ minWidth: 120 }}>{ev.entity}</b>
            <span style={{ flex: 1, color: colors.inkSoft }}>{ev.action}</span>
            <span style={{ color: colors.muted }}>{ev.user}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
