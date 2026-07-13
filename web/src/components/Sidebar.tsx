"use client";
import { useAppState } from "@/context/AppState";
import { MODULE_LABELS, MODULE_MAP, type DemoRole } from "@/lib/domain";

const ACCESS_NOTE: Record<DemoRole, string> = {
  requester: "Access: your department's requests & related orders only",
  approver: "Access: PRs routed through your approval level",
  procurement: "Access: approved PRs, POs & receipts — all branches",
  warehouse: "Access: deliveries & receipts for your branch",
  management: "Access: all branches · read-only",
  mobile: "",
};

export function Sidebar() {
  const { ui, goModule } = useAppState();
  if (ui.role === "mobile") return null;
  const modules = MODULE_MAP[ui.role] ?? [];

  return (
    <div
      style={{
        flex: "none",
        background: "#fff",
        borderRight: "1px solid #E6E0D4",
        padding: "14px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        transition: "width .18s ease",
        boxSizing: "border-box",
        overflow: "hidden",
        width: ui.navOpen ? 224 : 64,
      }}
    >
      {modules.map((key) => {
        const active = ui.module === key;
        const [label, icon] = MODULE_LABELS[key];
        return (
          <button
            key={key}
            onClick={() => goModule(key)}
            title={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              boxSizing: "border-box",
              textAlign: "left",
              border: "none",
              borderRadius: 8,
              padding: 6,
              font: "600 13px 'IBM Plex Sans'",
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              background: active ? "#E3F0EB" : "transparent",
              color: active ? "#157A62" : "#4A443A",
            }}
          >
            <span
              style={{
                flex: "none",
                width: 28,
                height: 28,
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "700 10px 'IBM Plex Sans'",
                letterSpacing: ".03em",
                background: active ? "#157A62" : "#EFEAE0",
                color: active ? "#fff" : "#6B6455",
              }}
            >
              {icon}
            </span>
            {ui.navOpen && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      {ui.navOpen && (
        <div style={{ font: "11px/1.5 'IBM Plex Sans'", color: "#8A8272", padding: "10px 8px", borderTop: "1px solid #F0EBDF" }}>
          {ACCESS_NOTE[ui.role]}
        </div>
      )}
    </div>
  );
}
