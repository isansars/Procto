import type { CSSProperties } from "react";

export const colors = {
  paper: "#F7F4EE",
  ink: "#26231C",
  inkSoft: "#4A443A",
  muted: "#8A8272",
  mutedDark: "#6B6455",
  border: "#E6E0D4",
  borderStrong: "#D8D1C0",
  divider: "#F0EBDF",
  teal: "#157A62",
  tealDark: "#0F6650",
  tealTint: "#E3F0EB",
  amber: "#8A5F0B",
  amberTint: "#FBF2DD",
  amberBorder: "#E8D5A8",
  red: "#B3402F",
  redTint: "#F8E8E4",
  redBorder: "#EBC6BE",
  blue: "#2D6089",
  blueTint: "#E4EDF5",
  ivory: "#FBFAF6",
  charcoal: "#26231C",
};

export const card: CSSProperties = {
  background: "#fff",
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
};

export const cardPad: CSSProperties = { ...card, padding: 20 };

export const btnPrimary: CSSProperties = {
  background: colors.teal,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "11px 18px",
  font: "600 13px 'IBM Plex Sans'",
  cursor: "pointer",
};

export const btnOutline: CSSProperties = {
  background: "#fff",
  border: `1px solid ${colors.borderStrong}`,
  color: colors.inkSoft,
  borderRadius: 8,
  padding: "11px 18px",
  font: "600 13px 'IBM Plex Sans'",
  cursor: "pointer",
};

export const btnDanger: CSSProperties = {
  background: "#fff",
  border: `1px solid ${colors.borderStrong}`,
  color: colors.red,
  borderRadius: 8,
  padding: "9px 14px",
  font: "600 12px 'IBM Plex Sans'",
  cursor: "pointer",
};

export const btnSmall: CSSProperties = {
  background: "#fff",
  border: `1px solid ${colors.borderStrong}`,
  color: colors.inkSoft,
  borderRadius: 7,
  padding: "7px 12px",
  font: "600 12px 'IBM Plex Sans'",
  cursor: "pointer",
};

export const th: CSSProperties = {
  textAlign: "left",
  font: "600 11px 'IBM Plex Sans'",
  color: colors.muted,
  textTransform: "uppercase",
  letterSpacing: ".06em",
  padding: "12px 16px",
};

export const thRight: CSSProperties = { ...th, textAlign: "right" };

export const td: CSSProperties = {
  padding: "13px 16px",
  borderTop: `1px solid ${colors.divider}`,
  font: "13px 'IBM Plex Sans'",
};

export const tdRight: CSSProperties = { ...td, textAlign: "right", whiteSpace: "nowrap" };

export const input: CSSProperties = {
  padding: "9px 10px",
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: 8,
  font: "13px 'IBM Plex Sans'",
  background: "#fff",
  color: colors.ink,
};

export const inputDisabled: CSSProperties = {
  ...input,
  background: colors.ivory,
  color: colors.muted,
  border: `1px solid ${colors.border}`,
};

export const label: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
  font: "600 12px 'IBM Plex Sans'",
  color: colors.inkSoft,
};

export function badge(bg: string, fg: string, extra?: CSSProperties): CSSProperties {
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 20,
    font: "600 11.5px 'IBM Plex Sans'",
    background: bg,
    color: fg,
    whiteSpace: "nowrap",
    ...extra,
  };
}

export const sectionTitle: CSSProperties = { font: "700 14px 'IBM Plex Sans'" };
export const pageTitle: CSSProperties = { margin: 0, font: "700 22px 'IBM Plex Sans'" };
export const pageSub: CSSProperties = { font: "13px 'IBM Plex Sans'", color: colors.muted, marginBottom: 16 };
export const eyebrow: CSSProperties = {
  font: "600 11px 'IBM Plex Sans'",
  color: colors.muted,
  textTransform: "uppercase",
  letterSpacing: ".06em",
};
