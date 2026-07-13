"use client";
import { AppStateProvider, useAppState } from "@/context/AppState";
import { DemoBar } from "@/components/DemoBar";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { PipelineStrip } from "@/components/PipelineStrip";
import { CommentModal } from "@/components/CommentModal";
import { Toast } from "@/components/Toast";
import { Screen } from "@/components/Screen";

function Shell() {
  const { ui } = useAppState();
  const hasModules = ui.role !== "mobile";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <DemoBar />
      <AppHeader />
      <div style={{ flex: 1, display: "flex", alignItems: "stretch", minHeight: 0 }}>
        {hasModules && <Sidebar />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ width: "100%", maxWidth: 1180, margin: "0 auto", padding: "26px 28px 80px", boxSizing: "border-box" }}>
            {hasModules && <PipelineStrip />}
            <Screen />
          </div>
        </div>
      </div>
      <CommentModal />
      <Toast />
    </div>
  );
}

export function AppShell() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
