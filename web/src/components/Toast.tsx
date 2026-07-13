"use client";
import { useAppState } from "@/context/AppState";

export function Toast() {
  const { toastMsg } = useAppState();
  if (!toastMsg) return null;
  return (
    <div
      className="toast-in"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#26231C",
        color: "#F7F4EE",
        borderRadius: 10,
        padding: "13px 20px",
        font: "600 13px 'IBM Plex Sans'",
        zIndex: 120,
        boxShadow: "0 10px 30px rgba(0,0,0,.3)",
        maxWidth: 560,
      }}
    >
      {toastMsg}
    </div>
  );
}
