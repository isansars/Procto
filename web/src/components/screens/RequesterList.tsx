"use client";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { badge, btnPrimary, btnSmall, card, colors, pageTitle, td, th, thRight } from "@/lib/ui";

type Row = {
  id: string;
  date: string;
  total: string;
  itemsSummary: string;
  status: string;
  stBg: string;
  stFg: string;
  fulfillNote: string;
  hasFulfill: boolean;
  canEdit: boolean;
};

type StatCard = { label: string; icon: string; bg: string; fg: string; count: number };

type Resp = { rows: Row[]; budget: { totalFmt: string; remainFmt: string; pct: number }; statCards: StatCard[] };

export function RequesterList() {
  const { set, openPR } = useAppState();
  const { data } = useApiData<Resp>("/api/requests");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div>
          <h1 style={pageTitle}>Purchase Requests — Operasional</h1>
          <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, marginTop: 3 }}>
            Jakarta Pusat · all requests from your department — you can only edit your own
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => set({ reqView: "create", editingId: null })} className="btn-primary" style={btnPrimary}>
          + New Purchase Request
        </button>
      </div>

      {data && (
        <div style={{ ...card, padding: "16px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Dept budget · July 2026
            </div>
            <div style={{ font: "700 18px 'IBM Plex Sans'", marginTop: 2 }}>
              {data.budget.remainFmt}{" "}
              <span style={{ font: "400 12px 'IBM Plex Sans'", color: colors.muted }}>remaining of {data.budget.totalFmt}</span>
            </div>
          </div>
          <div style={{ flex: 1, height: 10, background: colors.divider, borderRadius: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", background: colors.teal, borderRadius: 5, width: `${data.budget.pct}%` }} />
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {(data?.statCards ?? []).map((sc) => (
          <div key={sc.label} style={{ ...card, padding: "14px 16px" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "600 13px 'IBM Plex Sans'",
                background: sc.bg,
                color: sc.fg,
              }}
            >
              {sc.icon}
            </div>
            <div style={{ font: "700 22px 'IBM Plex Sans'", marginTop: 10 }}>{sc.count}</div>
            <div style={{ font: "12px 'IBM Plex Sans'", color: "#6B6455", marginTop: 2 }}>{sc.label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>PR No.</th>
              <th style={th}>Items</th>
              <th style={thRight}>Est. total</th>
              <th style={th}>Status</th>
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {(data?.rows ?? []).map((pr) => (
              <tr key={pr.id} className="row-hover">
                <td style={{ ...td, font: "600 13px 'IBM Plex Sans'" }}>
                  {pr.id}
                  <div style={{ font: "400 11px 'IBM Plex Sans'", color: colors.muted, marginTop: 2 }}>{pr.date}</div>
                </td>
                <td style={{ ...td, color: colors.inkSoft, maxWidth: 320 }}>{pr.itemsSummary}</td>
                <td style={{ ...tdRightBold }}>{pr.total}</td>
                <td style={td}>
                  <span style={badge(pr.stBg, pr.stFg)}>{pr.status}</span>
                  {pr.hasFulfill && (
                    <div style={{ font: "11px/1.45 'IBM Plex Sans'", color: colors.blue, marginTop: 5, maxWidth: 220 }}>{pr.fulfillNote}</div>
                  )}
                </td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                  {pr.canEdit && (
                    <button
                      onClick={() => set({ reqView: "create", editingId: pr.id })}
                      style={{ ...btnSmall, color: colors.teal, marginRight: 6 }}
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => openPR(pr.id)} className="btn-outline" style={btnSmall}>
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tdRightBold = { ...td, textAlign: "right" as const, whiteSpace: "nowrap" as const, font: "600 13px 'IBM Plex Sans'" };
