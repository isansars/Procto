"use client";
import { useState } from "react";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { badge, card, colors } from "@/lib/ui";

type Kpi = { label: string; value: string; sub: string; numColor: string; k: string };
type Attention = { title: string; sub: string; tag: string; dot: string; bg: string };
type DrillRow = { id: string; text: string; status: string; stBg: string; stFg: string; amount: string };
type Drill = Record<string, { title: string; rows: DrillRow[] }>;
type SpendRow = { branch: string; committedFmt: string; budgetFmt: string; pct: number; color: string };
type PendingByLevel = { name: string; count: string };

type Resp = {
  kpis: Kpi[];
  attention: Attention[];
  drill: Drill;
  spendRows: SpendRow[];
  pendingByLevel: PendingByLevel[];
  branchOptions: string[];
  deptOptions: string[];
};

const selectStyle = { padding: "8px 10px", border: "1px solid #D8D1C0", borderRadius: 8, font: "13px 'IBM Plex Sans'", background: "#fff", color: colors.ink };

export function ManagementDashboard() {
  const { ui, set } = useAppState();
  const [mgB, setMgB] = useState("All");
  const [mgD, setMgD] = useState("All");
  const path = `/api/dashboard?branch=${encodeURIComponent(mgB)}&dept=${encodeURIComponent(mgD)}`;
  const { data } = useApiData<Resp>(path, [mgB, mgD]);
  const drill = ui.drill && data ? data.drill[ui.drill] : null;

  function changeBranch(v: string) {
    setMgB(v);
    set({ drill: null });
  }
  function changeDept(v: string) {
    setMgD(v);
    set({ drill: null });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
        <h1 style={{ margin: 0, font: "700 22px 'IBM Plex Sans'" }}>Management Dashboard</h1>
        <span style={{ padding: "4px 10px", borderRadius: 20, font: "600 11px 'IBM Plex Sans'", background: "#E3F0EB", color: colors.teal }}>
          READ-ONLY · ALL BRANCHES · LIVE
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted }}>Click any card to drill down.</div>
        <div style={{ flex: 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12px 'IBM Plex Sans'", color: "#6B6455" }}>
          Branch
          <select value={mgB} onChange={(e) => changeBranch(e.target.value)} style={selectStyle}>
            {["All", ...(data?.branchOptions ?? [])].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12px 'IBM Plex Sans'", color: "#6B6455" }}>
          Dept
          <select value={mgD} onChange={(e) => changeDept(e.target.value)} style={selectStyle}>
            {["All", ...(data?.deptOptions ?? [])].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        {(data?.kpis ?? []).map((k) => (
          <div key={k.k} onClick={() => set({ drill: k.k })} className="kpi-card" style={{ ...card, padding: "16px 18px", cursor: "pointer", transition: "border-color .15s" }}>
            <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>{k.label}</div>
            <div style={{ font: "700 30px 'IBM Plex Sans'", marginTop: 6, color: k.numColor }}>{k.value}</div>
            <div style={{ font: "12px 'IBM Plex Sans'", color: colors.muted, marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...card, padding: "18px 20px" }}>
            <div style={{ font: "700 14px 'IBM Plex Sans'", marginBottom: 12 }}>⚑ Needs attention</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(data?.attention ?? []).map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #F0EBDF", borderRadius: 9, padding: "11px 13px", background: a.bg }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.dot }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "600 12.5px 'IBM Plex Sans'" }}>{a.title}</div>
                    <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginTop: 1 }}>{a.sub}</div>
                  </div>
                  <span style={{ font: "600 11px 'IBM Plex Sans'", color: a.dot }}>{a.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {drill && (
            <div style={{ ...card, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <div style={{ font: "700 14px 'IBM Plex Sans'" }}>{drill.title}</div>
                <div style={{ flex: 1 }} />
                <button onClick={() => set({ drill: null })} style={{ background: "transparent", border: "none", color: colors.muted, font: "600 12px 'IBM Plex Sans'", cursor: "pointer" }}>
                  ✕ Close
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {drill.rows.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #F0EBDF", padding: "9px 2px" }}>
                    <b style={{ font: "600 12.5px 'IBM Plex Sans'", minWidth: 110 }}>{r.id}</b>
                    <div style={{ flex: 1, font: "12.5px 'IBM Plex Sans'", color: colors.inkSoft }}>{r.text}</div>
                    <span style={badge(r.stBg, r.stFg, { padding: "3px 9px", font: "600 10.5px 'IBM Plex Sans'" })}>{r.status}</span>
                    <div style={{ font: "600 12.5px 'IBM Plex Sans'", minWidth: 110, textAlign: "right" }}>{r.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ ...card, padding: "18px 20px" }}>
          <div style={{ font: "700 14px 'IBM Plex Sans'", marginBottom: 4 }}>Committed spend vs budget</div>
          <div style={{ font: "11.5px 'IBM Plex Sans'", color: colors.muted, marginBottom: 14 }}>Approved PRs + open POs · July 2026</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(data?.spendRows ?? []).map((s) => (
              <div key={s.branch}>
                <div style={{ display: "flex", font: "12.5px 'IBM Plex Sans'", marginBottom: 5 }}>
                  <b>{s.branch}</b>
                  <div style={{ flex: 1 }} />
                  <span style={{ color: s.color }}>{s.committedFmt}</span>
                  <span style={{ color: colors.muted }}>&nbsp;/ {s.budgetFmt}</span>
                </div>
                <div style={{ height: 9, background: colors.divider, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, borderTop: "1px solid #F0EBDF", paddingTop: 14 }}>
            <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
              Pending approvals by level
            </div>
            {(data?.pendingByLevel ?? []).map((p) => (
              <div key={p.name} style={{ display: "flex", font: "12.5px 'IBM Plex Sans'", padding: "4px 0" }}>
                <span>{p.name}</span>
                <div style={{ flex: 1 }} />
                <b>{p.count}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
