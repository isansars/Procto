"use client";
import { useAppState } from "@/context/AppState";

export function AppHeader() {
  const { ui, set, persona } = useAppState();
  const hasModules = ui.role !== "mobile";
  const initials = persona.name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E6E0D4",
        padding: "14px 20px 14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      {hasModules && (
        <button
          onClick={() => set({ navOpen: !ui.navOpen })}
          title="Toggle navigation"
          className="icon-btn"
          style={{
            background: "transparent",
            border: "1px solid #E6E0D4",
            borderRadius: 8,
            width: 36,
            height: 36,
            fontSize: 15,
            cursor: "pointer",
            color: "#4A443A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ☰
        </button>
      )}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "#157A62",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "700 15px 'IBM Plex Sans'",
        }}
      >
        N
      </div>
      <div>
        <div style={{ font: "700 15px 'IBM Plex Sans'", color: "#26231C" }}>NusaProc</div>
        <div style={{ font: "12px 'IBM Plex Sans'", color: "#8A8272" }}>PT Nusantara Niaga Group · Procurement</div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ textAlign: "right" }}>
        <div style={{ font: "600 13px 'IBM Plex Sans'" }}>{persona.name}</div>
        <div style={{ font: "12px 'IBM Plex Sans'", color: "#8A8272" }}>{persona.title}</div>
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "#E3F0EB",
          color: "#157A62",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "700 13px 'IBM Plex Sans'",
        }}
      >
        {initials}
      </div>
    </div>
  );
}
