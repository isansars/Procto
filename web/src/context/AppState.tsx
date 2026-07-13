"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createApiClient, type ApiClient } from "@/lib/apiClient";
import { personaFor } from "@/lib/personas";
import { defaultModule, type ApprovalLevelKey, type DemoRole } from "@/lib/domain";

export type ModalState = { kind: "partial" | "reject" | "revision"; comment: string } | null;

export type GRFormLine = { qty: string; condition: "GOOD" | "DAMAGED" | "REJECTED"; note: string; hasPhoto: boolean };
export type GRForm = { poId: string; lines: Record<string, GRFormLine> } | null;

export type UIState = {
  role: DemoRole;
  acting: ApprovalLevelKey;
  navOpen: boolean;
  module: string;
  reqView: "list" | "create";
  editingId: string | null;
  prDetailId: string | null;
  appView: "inbox" | "review";
  selPR: string | null;
  dec: Record<string, "approve" | "reject">;
  ordView: "list" | "form" | "detail";
  selPO: string | null;
  sel: Record<string, boolean>;
  poVendor: string | null;
  whView: "list" | "grform";
  grForm: GRForm;
  drill: string | null;
  modal: ModalState;
  mobRejectId: string | null;
  mobComment: string;
};

function freshUI(role: DemoRole): UIState {
  return {
    role,
    acting: "dept",
    navOpen: true,
    module: defaultModule(role),
    reqView: "list",
    editingId: null,
    prDetailId: null,
    appView: "inbox",
    selPR: null,
    dec: {},
    ordView: "list",
    selPO: null,
    sel: {},
    poVendor: null,
    whView: "list",
    grForm: null,
    drill: null,
    modal: null,
    mobRejectId: null,
    mobComment: "",
  };
}

type Ctx = {
  ui: UIState;
  set: (patch: Partial<UIState>) => void;
  api: ApiClient;
  persona: { slug: string; name: string; title: string };
  toastMsg: string | null;
  showToast: (msg: string) => void;
  goRole: (role: DemoRole) => void;
  goModule: (moduleKey: string) => void;
  goActingLevel: (level: ApprovalLevelKey) => void;
  openPR: (id: string) => void;
  closeDetail: () => void;
  reloadKey: number;
  bump: () => void;
};

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ui, setUi] = useState<UIState>(() => freshUI("requester"));
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = useCallback((patch: Partial<UIState>) => setUi((prev) => ({ ...prev, ...patch })), []);
  const bump = useCallback(() => setReloadKey((k) => k + 1), []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const persona = useMemo(() => personaFor(ui.role, ui.acting), [ui.role, ui.acting]);
  const api = useMemo(() => createApiClient(persona.slug, ui.role), [persona.slug, ui.role]);

  const goRole = useCallback((role: DemoRole) => {
    setUi(freshUI(role));
  }, []);

  const goModule = useCallback((moduleKey: string) => {
    setUi((prev) => ({
      ...prev,
      module: moduleKey,
      prDetailId: null,
      drill: null,
      ordView: "list",
      appView: "inbox",
      reqView: "list",
      whView: "list",
    }));
  }, []);

  const goActingLevel = useCallback((level: ApprovalLevelKey) => {
    setUi((prev) => ({ ...prev, acting: level, appView: "inbox" }));
  }, []);

  const openPR = useCallback((id: string) => set({ prDetailId: id }), [set]);
  const closeDetail = useCallback(() => set({ prDetailId: null }), [set]);

  const value: Ctx = {
    ui,
    set,
    api,
    persona,
    toastMsg,
    showToast,
    goRole,
    goModule,
    goActingLevel,
    openPR,
    closeDetail,
    reloadKey,
    bump,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
