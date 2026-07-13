"use client";
import { useMemo } from "react";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { btnPrimary, card, colors } from "@/lib/ui";
import { rp } from "@/lib/domain";

type QLine = { id: string; desc: string; qtyU: string; totalFmt: string; totalRaw: number };
type QGroup = { id: string; requester: string; branchDept: string; date: string; lines: QLine[] };

export function ProcurementQueue() {
  const { ui, set } = useAppState();
  const { data } = useApiData<{ groups: QGroup[] }>("/api/purchase-orders/queue");
  const groups = useMemo(() => data?.groups ?? [], [data]);

  const selArr = useMemo(() => {
    const out: { groupId: string; line: QLine }[] = [];
    groups.forEach((g) => g.lines.forEach((l) => ui.sel[l.id] && out.push({ groupId: g.id, line: l })));
    return out;
  }, [groups, ui.sel]);

  const selTotal = selArr.reduce((s, x) => s + x.line.totalRaw, 0);
  const selPRIds = [...new Set(selArr.map((x) => x.groupId))];

  function toggle(lineId: string) {
    set({ sel: { ...ui.sel, [lineId]: !ui.sel[lineId] } });
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", font: "700 22px 'IBM Plex Sans'" }}>Purchase Orders</h1>
      <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, marginBottom: 20 }}>
        Stage 3 of the pipeline — approved PR lines flow in below; convert them into purchase orders.
      </div>
      <h2 style={{ margin: "0 0 8px", font: "700 15px 'IBM Plex Sans'" }}>Intake · approved PR lines awaiting PO</h2>
      <div style={{ font: "12.5px 'IBM Plex Sans'", color: colors.muted, marginBottom: 14 }}>
        Only fully approved PR lines appear here. Select lines — across multiple PRs — to consolidate into one PO.
      </div>
      {data && groups.length === 0 && (
        <div style={{ background: "#fff", border: "1px dashed #D8D1C0", borderRadius: 12, padding: 40, textAlign: "center", color: colors.muted, font: "14px 'IBM Plex Sans'" }}>
          Queue is empty — no approved PR lines awaiting a PO.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {groups.map((g) => (
          <div key={g.id} style={{ ...card, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: colors.ivory, borderBottom: "1px solid #F0EBDF", display: "flex", gap: 12, alignItems: "center" }}>
              <b style={{ font: "600 13px 'IBM Plex Sans'" }}>{g.id}</b>
              <span style={{ font: "12px 'IBM Plex Sans'", color: colors.muted }}>
                {g.requester} · {g.branchDept} · approved {g.date}
              </span>
            </div>
            {g.lines.map((ln) => {
              const on = !!ui.sel[ln.id];
              return (
                <div
                  key={ln.id}
                  onClick={() => toggle(ln.id)}
                  className="row-hover"
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", borderBottom: "1px solid #F0EBDF", cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      font: "700 12px 'IBM Plex Sans'",
                      background: on ? colors.teal : "#fff",
                      border: on ? "none" : `2px solid ${colors.borderStrong}`,
                      color: on ? "#fff" : "transparent",
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ flex: 1, font: "13px 'IBM Plex Sans'" }}>{ln.desc}</div>
                  <div style={{ font: "12.5px 'IBM Plex Sans'", color: colors.muted }}>{ln.qtyU}</div>
                  <div style={{ font: "600 13px 'IBM Plex Sans'", minWidth: 120, textAlign: "right" }}>{ln.totalFmt}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {selArr.length > 0 && (
        <div
          style={{
            position: "sticky",
            bottom: 16,
            marginTop: 16,
            background: "#26231C",
            color: "#F7F4EE",
            borderRadius: 12,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 8px 24px rgba(38,35,28,.25)",
          }}
        >
          <div style={{ font: "600 13px 'IBM Plex Sans'" }}>
            {selArr.length} line{selArr.length === 1 ? "" : "s"} selected · est. {rp(selTotal)}
          </div>
          {selPRIds.length > 1 && (
            <span style={{ padding: "4px 10px", borderRadius: 20, font: "600 11px 'IBM Plex Sans'", background: colors.teal, color: "#fff" }}>
              Consolidating {selPRIds.length} PRs → 1 PO
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={() => set({ module: "orders", ordView: "form" })} className="btn-primary" style={btnPrimary}>
            Create Purchase Order →
          </button>
        </div>
      )}
    </div>
  );
}
