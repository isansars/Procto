"use client";
import { useEffect, useState } from "react";
import { useAppState } from "@/context/AppState";
import { MODULE_MAP, type ApprovalLevelKey } from "@/lib/domain";

type Stage = { key: string; lvl?: ApprovalLevelKey; label: string; count: number; sub: string };

export function PipelineStrip() {
  const { ui, goModule, goActingLevel, api, reloadKey } = useAppState();
  const [stages, setStages] = useState<Stage[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<{ stages: Stage[] }>("/api/pipeline").then((d) => {
      if (!cancelled) setStages(d.stages);
    });
    return () => {
      cancelled = true;
    };
  }, [api, reloadKey]);

  if (ui.role === "mobile" || !stages) return null;

  const access = MODULE_MAP[ui.role] ?? [];

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 6, marginBottom: 24 }}>
      {stages.map((st, i) => {
        const can = access.includes(st.key);
        const cur = ui.module === st.key && (!st.lvl || ui.role !== "approver" || ui.acting === st.lvl);
        return (
          <div key={i} style={{ display: "contents" }}>
            <div
              onClick={() => {
                if (!can) return;
                goModule(st.key);
                if (st.lvl && ui.role === "approver") goActingLevel(st.lvl);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                background: cur ? "#E3F0EB" : "#fff",
                border: `1px solid ${cur ? "#157A62" : "#E6E0D4"}`,
                borderRadius: 10,
                padding: "9px 12px",
                cursor: can ? "pointer" : "default",
                opacity: can ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  font: "600 10.5px 'IBM Plex Sans'",
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: cur ? "#157A62" : "#8A8272",
                }}
              >
                {st.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <span style={{ font: "700 18px 'IBM Plex Sans'", color: "#26231C" }}>{st.count}</span>
                {st.sub && (
                  <span
                    style={{
                      font: "11.5px 'IBM Plex Sans'",
                      color: "#8A8272",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {st.sub}
                  </span>
                )}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div style={{ alignSelf: "center", color: "#C9BFA8", font: "600 13px 'IBM Plex Sans'" }}>→</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
