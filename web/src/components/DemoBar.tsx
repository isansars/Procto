"use client";
import { useState } from "react";
import { useAppState } from "@/context/AppState";
import { ROLE_TABS } from "@/lib/personas";

export function DemoBar() {
  const { ui, goRole, api, bump, showToast } = useAppState();
  const [resetting, setResetting] = useState(false);

  async function resetDemo() {
    setResetting(true);
    try {
      await api.post("/api/reset");
      bump();
      showToast("Demo data reset to initial state.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div
      style={{
        background: "#26231C",
        color: "#F7F4EE",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <span
        style={{
          font: "700 11px 'IBM Plex Sans'",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "#C9BFA8",
        }}
      >
        Prototype · view as
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ROLE_TABS.map((rt) => {
          const active = ui.role === rt.role;
          return (
            <button
              key={rt.role}
              onClick={() => goRole(rt.role)}
              style={{
                border: "none",
                borderRadius: 7,
                padding: "7px 12px",
                font: "600 12px 'IBM Plex Sans'",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 1,
                background: active ? "#157A62" : "#3A3529",
                color: active ? "#fff" : "#C9BFA8",
              }}
            >
              {rt.label}
              <span style={{ font: "400 10px 'IBM Plex Sans'", opacity: 0.75 }}>{rt.sub}</span>
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <button
        onClick={resetDemo}
        disabled={resetting}
        className="demo-reset-btn"
        style={{
          background: "transparent",
          border: "1px solid #57503F",
          color: "#C9BFA8",
          borderRadius: 7,
          padding: "6px 12px",
          font: "600 12px 'IBM Plex Sans'",
          cursor: "pointer",
        }}
      >
        {resetting ? "Resetting…" : "Reset demo data"}
      </button>
    </div>
  );
}
