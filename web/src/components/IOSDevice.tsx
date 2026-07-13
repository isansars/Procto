"use client";
// Simplified iOS 26 (Liquid Glass) device frame — ported from the prototype's
// ios-frame.jsx starter component into a typed React component.
import type { CSSProperties, ReactNode } from "react";

function IOSStatusBar({ dark = false, time = "9:41" }: { dark?: boolean; time?: string }) {
  const c = dark ? "#fff" : "#000";
  return (
    <div style={{ display: "flex", gap: 154, alignItems: "center", justifyContent: "center", padding: "21px 24px 19px", boxSizing: "border-box", position: "relative", zIndex: 20, width: "100%" }}>
      <div style={{ flex: 1, height: 22, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 1.5 }}>
        <span style={{ fontFamily: "-apple-system, system-ui", fontWeight: 590, fontSize: 17, lineHeight: "22px", color: c }}>{time}</span>
      </div>
      <div style={{ flex: 1, height: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, paddingTop: 1, paddingRight: 1 }}>
        <svg width="19" height="12" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c} />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c} />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c} />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c} />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c} />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

function IOSGlassPill({ children, dark = false, style = {} }: { children: ReactNode; dark?: boolean; style?: CSSProperties }) {
  return (
    <div
      style={{
        height: 44,
        minWidth: 44,
        borderRadius: 9999,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: dark ? "0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 9999,
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          background: dark ? "rgba(120,120,128,0.28)" : "rgba(255,255,255,0.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 9999,
          boxShadow: dark
            ? "inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)"
            : "inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)",
          border: dark ? "0.5px solid rgba(255,255,255,0.15)" : "0.5px solid rgba(0,0,0,0.06)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", padding: "0 4px" }}>{children}</div>
    </div>
  );
}

function IOSNavBar({ title = "Title", dark = false }: { title?: string; dark?: boolean }) {
  const muted = dark ? "rgba(255,255,255,0.6)" : "#404040";
  const text = dark ? "#fff" : "#000";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 62, paddingBottom: 10, position: "relative", zIndex: 5 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
        <IOSGlassPill dark={dark}>
          <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" style={{ marginLeft: -1 }}>
              <path d="M10 2L2 10l8 8" stroke={muted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </IOSGlassPill>
        <IOSGlassPill dark={dark}>
          <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="6" viewBox="0 0 22 6">
              <circle cx="3" cy="3" r="2.5" fill={muted} />
              <circle cx="11" cy="3" r="2.5" fill={muted} />
              <circle cx="19" cy="3" r="2.5" fill={muted} />
            </svg>
          </div>
        </IOSGlassPill>
      </div>
      <div style={{ padding: "0 16px", fontFamily: "-apple-system, system-ui", fontSize: 34, fontWeight: 700, lineHeight: "41px", color: text, letterSpacing: 0.4 }}>{title}</div>
    </div>
  );
}

export function IOSDevice({ children, width = 402, height = 874, dark = false, title }: { children: ReactNode; width?: number; height?: number; dark?: boolean; title?: string }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 48,
        overflow: "hidden",
        position: "relative",
        background: dark ? "#000" : "#F2F2F7",
        boxShadow: "0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)",
        fontFamily: "-apple-system, system-ui, sans-serif",
      }}
    >
      <div style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", width: 126, height: 37, borderRadius: 24, background: "#000", zIndex: 50 }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <IOSStatusBar dark={dark} />
      </div>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {title !== undefined && <IOSNavBar title={title} dark={dark} />}
        <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 60, height: 34, display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: 8, pointerEvents: "none" }}>
        <div style={{ width: 139, height: 5, borderRadius: 100, background: dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.25)" }} />
      </div>
    </div>
  );
}
