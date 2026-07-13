"use client";
import { useAppState } from "@/context/AppState";
import { btnOutline } from "@/lib/ui";

const MODAL_META = {
  partial: {
    title: "Partial approval — comment required",
    desc: "You are rejecting some line items. Explain why, so the requester knows what to fix. Approved lines will continue through the workflow.",
    confirmLabel: "Confirm partial approval",
  },
  reject: {
    title: "Reject PR — comment required",
    desc: "The whole PR will be returned to the requester with your comment.",
    confirmLabel: "Confirm rejection",
  },
  revision: {
    title: "Request revision — comment required",
    desc: "The PR will be unlocked for the requester to edit and resubmit. Approval restarts from level 1.",
    confirmLabel: "Send back for revision",
  },
} as const;

export function CommentModal() {
  const { ui, set, api, bump, showToast } = useAppState();
  const modal = ui.modal;
  if (!modal) return null;
  const meta = MODAL_META[modal.kind];
  const canConfirm = modal.comment.trim().length > 0;

  async function confirm() {
    if (!modal || !canConfirm || !ui.selPR) return;
    const action = modal.kind === "partial" ? "approve" : modal.kind;
    const res = await api.post<{ status: string }>(`/api/approvals/${ui.selPR}/decide`, {
      action,
      lineDecisions: ui.dec,
      comment: modal.comment,
    });
    set({ modal: null, appView: "inbox", selPR: null, dec: {} });
    bump();
    if (res.status === "REJECTED") showToast(`${ui.selPR} rejected — requester notified with your comment.`);
    else if (res.status === "REVISION_REQUESTED") showToast(`${ui.selPR} returned to requester for revision.`);
    else showToast(`${ui.selPR} approved.`);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(38,35,28,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: 440, boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
        <div style={{ font: "700 16px 'IBM Plex Sans'" }}>{meta.title}</div>
        <div style={{ font: "13px/1.5 'IBM Plex Sans'", color: "#8A8272", marginTop: 6 }}>{meta.desc}</div>
        <textarea
          value={modal.comment}
          onChange={(e) => set({ modal: { ...modal, comment: e.target.value } })}
          rows={3}
          placeholder="Comment (required)…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 14,
            padding: "10px 11px",
            border: "1px solid #D8D1C0",
            borderRadius: 9,
            font: "13px 'IBM Plex Sans'",
            fontFamily: "'IBM Plex Sans'",
            color: "#26231C",
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={() => set({ modal: null })} style={btnOutline}>
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!canConfirm}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              font: "600 13px 'IBM Plex Sans'",
              background: canConfirm ? "#157A62" : "#EFEAE0",
              color: canConfirm ? "#fff" : "#B0A898",
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            {meta.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
