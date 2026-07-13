"use client";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/context/AppState";
import { useApiData } from "@/lib/useApiData";
import { chainFor, LEVEL_NAMES, LEVEL_WHO, rp } from "@/lib/domain";
import { btnPrimary, btnSmall, card, cardPad, colors, input, inputDisabled, label as labelStyle, pageTitle } from "@/lib/ui";

type CatalogItem = { id: string; desc: string; uom: string; price: number; label: string };
type CatalogResp = { items: CatalogItem[] };
type ReqBudgetResp = { budget: { remainFmt: string; remain: number; totalFmt: string } };
type PRDetailResp = {
  editForm: { dateNeeded: string; urgency: "Normal" | "Urgent"; justification: string; lines: { itemId: string; qty: number }[] };
};

type FormLine = { itemId: string; qty: number | string; desc: string; price: string };

function blankLine(defaultItemId: string): FormLine {
  return { itemId: defaultItemId, qty: 10, desc: "", price: "" };
}

export function RequesterCreate() {
  const { ui, set, api, bump, showToast } = useAppState();
  const { data: catalogData } = useApiData<CatalogResp>("/api/catalog");
  const { data: budgetData } = useApiData<ReqBudgetResp>("/api/requests");
  const editingId = ui.editingId;
  const { data: editData } = useApiData<PRDetailResp>(editingId ? `/api/requests/${editingId}` : null, [editingId]);

  const [dateNeeded, setDateNeeded] = useState("2026-07-25");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [justification, setJustification] = useState("");
  const [lines, setLines] = useState<FormLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const catalog = useMemo(() => catalogData?.items ?? [], [catalogData]);

  // Initialize the form once catalog (for the default line) and, if editing, the PR to edit are loaded.
  useEffect(() => {
    if (initialized || !catalog.length) return;
    async function run() {
      if (editingId) {
        if (!editData) return;
        const f = editData.editForm;
        setDateNeeded(f.dateNeeded);
        setUrgency(f.urgency);
        setJustification(f.justification);
        setLines(f.lines.map((l) => ({ itemId: l.itemId, qty: l.qty, desc: "", price: "" })));
      } else {
        const k1 = catalog.find((c) => c.desc.includes("Kertas A4")) ?? catalog[0];
        setLines([blankLine(k1.id)]);
      }
      setInitialized(true);
    }
    void run();
  }, [initialized, catalog, editingId, editData]);

  const catalogOpts = useMemo(
    () => [
      ...catalog.map((c) => ({ id: c.id, label: c.label })),
      { id: "CUSTOM", label: "✎ Other — enter custom item & price…" },
    ],
    [catalog],
  );
  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);

  function lineTotal(l: FormLine): number {
    const qty = Number(l.qty) || 0;
    const price = l.itemId === "CUSTOM" ? Number(l.price) || 0 : catalogById.get(l.itemId)?.price ?? 0;
    return qty * price;
  }
  const formTotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const remain = budgetData?.budget.remain ?? Infinity;
  const overBudget = formTotal > remain;
  const routeChain = chainFor(formTotal);
  const formBudgetPct = remain > 0 && remain !== Infinity ? Math.min(100, Math.round((formTotal / remain) * 100)) : formTotal > 0 ? 100 : 0;

  function updateLine(i: number, patch: Partial<FormLine>) {
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, blankLine(catalog[0]?.id ?? "")]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, j) => j !== i));
  }

  async function submit(asDraft: boolean) {
    setSubmitting(true);
    try {
      const res = await api.post<{ id: string; status: string }>("/api/requests", {
        editingId,
        dateNeeded,
        urgency,
        justification,
        asDraft,
        lines: lines
          .filter((l) => Number(l.qty) > 0)
          .map((l) => ({ itemId: l.itemId, qty: Number(l.qty), desc: l.desc, price: Number(l.price) || 0 })),
      });
      set({ reqView: "list", editingId: null });
      bump();
      showToast(asDraft ? `${res.id} saved as draft.` : `${res.id} submitted — routed to ${LEVEL_WHO[routeChain[0]]} (${LEVEL_NAMES[routeChain[0]]}).`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!initialized) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button onClick={() => set({ reqView: "list", editingId: null })} style={btnSmall}>
          ← Back
        </button>
        <h1 style={pageTitle}>{editingId ? `Edit ${editingId}` : "New Purchase Request"}</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={cardPad}>
            <div style={{ font: "700 14px 'IBM Plex Sans'", marginBottom: 14 }}>Request details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <label style={labelStyle}>
                Branch
                <input value="Jakarta Pusat" disabled style={inputDisabled} />
              </label>
              <label style={labelStyle}>
                Department / cost center
                <input value="Operasional · CC-JKT-OPS" disabled style={inputDisabled} />
              </label>
              <label style={labelStyle}>
                Date needed
                <input type="date" value={dateNeeded} onChange={(e) => setDateNeeded(e.target.value)} style={input} />
              </label>
              <label style={labelStyle}>
                Urgency
                <select value={urgency} onChange={(e) => setUrgency(e.target.value as "Normal" | "Urgent")} style={input}>
                  <option>Normal</option>
                  <option>Urgent</option>
                </select>
              </label>
            </div>
            <label style={{ ...labelStyle, marginTop: 14 }}>
              Justification
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={2}
                placeholder="Why is this purchase needed?"
                style={{ ...input, resize: "vertical", fontFamily: "'IBM Plex Sans'" }}
              />
            </label>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, font: "12px 'IBM Plex Sans'", color: colors.muted }}>
              <span style={{ border: "1px dashed #D8D1C0", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
                📎 Attach quote / spec (max 10MB)
              </span>
            </div>
          </div>

          <div style={cardPad}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <div style={{ font: "700 14px 'IBM Plex Sans'" }}>Line items</div>
              <div style={{ flex: 1 }} />
              <button onClick={addLine} style={{ background: "#E3F0EB", color: colors.teal, border: "none", borderRadius: 7, padding: "7px 12px", font: "600 12px 'IBM Plex Sans'", cursor: "pointer" }}>
                + Add line
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {lines.map((ln, i) => {
                const isCustom = ln.itemId === "CUSTOM";
                const c = isCustom ? { uom: "unit", price: Number(ln.price) || 0 } : catalogById.get(ln.itemId);
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px 130px 34px", gap: 10, alignItems: "center" }}>
                      <select value={ln.itemId} onChange={(e) => updateLine(i, { itemId: e.target.value })} style={input}>
                        {catalogOpts.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      <input type="number" min={1} value={ln.qty} onChange={(e) => updateLine(i, { qty: e.target.value })} style={input} />
                      <div style={{ font: "13px 'IBM Plex Sans'", color: colors.muted, textAlign: "right" }}>
                        {rp(c?.price ?? 0)} <span style={{ font: "11px 'IBM Plex Sans'" }}>/{c?.uom ?? "unit"}</span>
                      </div>
                      <div style={{ font: "600 13px 'IBM Plex Sans'", textAlign: "right" }}>{rp(lineTotal(ln))}</div>
                      <button onClick={() => removeLine(i)} style={{ background: "transparent", border: "none", color: colors.red, font: "600 15px 'IBM Plex Sans'", cursor: "pointer" }}>
                        ✕
                      </button>
                    </div>
                    {isCustom && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 170px", gap: 10, padding: "10px 12px", background: colors.ivory, border: "1px dashed #D8D1C0", borderRadius: 8 }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: 4, font: "600 11.5px 'IBM Plex Sans'", color: colors.inkSoft }}>
                          Custom item name
                          <input value={ln.desc} onChange={(e) => updateLine(i, { desc: e.target.value })} placeholder="e.g. Jasa servis AC ruang arsip" style={input} />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 4, font: "600 11.5px 'IBM Plex Sans'", color: colors.inkSoft }}>
                          Est. unit price (Rp)
                          <input type="number" min={0} value={ln.price} onChange={(e) => updateLine(i, { price: e.target.value })} placeholder="0" style={input} />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #F0EBDF", marginTop: 14, paddingTop: 12, font: "700 15px 'IBM Plex Sans'" }}>
              Estimated total&nbsp;&nbsp;{rp(formTotal)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => submit(false)} disabled={submitting} className="btn-primary" style={btnPrimary}>
              Submit for approval
            </button>
            <button onClick={() => submit(true)} disabled={submitting} style={btnSmall}>
              Save as draft
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card, padding: "16px 18px" }}>
            <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
              Budget check
            </div>
            <div style={{ font: "13px 'IBM Plex Sans'", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: colors.muted }}>Remaining budget</span>
              <b>{budgetData?.budget.remainFmt ?? "—"}</b>
            </div>
            <div style={{ font: "13px 'IBM Plex Sans'", display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: colors.muted }}>This request</span>
              <b>{rp(formTotal)}</b>
            </div>
            <div style={{ height: 8, background: colors.divider, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${formBudgetPct}%`, background: overBudget ? colors.red : colors.teal, borderRadius: 4 }} />
            </div>
            {overBudget && (
              <div style={{ marginTop: 10, background: colors.amberTint, border: `1px solid ${colors.amberBorder}`, color: colors.amber, borderRadius: 8, padding: "9px 11px", font: "12px/1.45 'IBM Plex Sans'" }}>
                <b>Exceeds remaining budget.</b> Submission is still allowed (MVP); the approver will see this warning too.
              </div>
            )}
          </div>
          <div style={{ ...card, padding: "16px 18px" }}>
            <div style={{ font: "600 11px 'IBM Plex Sans'", color: colors.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
              Approval route
            </div>
            <div style={{ font: "12px 'IBM Plex Sans'", color: colors.muted, marginBottom: 10 }}>Based on estimated total, per approval matrix:</div>
            {routeChain.map((c, i) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#E3F0EB", color: colors.teal, display: "flex", alignItems: "center", justifyContent: "center", font: "700 11px 'IBM Plex Sans'" }}>
                  {i + 1}
                </div>
                <div style={{ font: "13px 'IBM Plex Sans'" }}>
                  {LEVEL_NAMES[c]}
                  <span style={{ color: colors.muted }}> — {LEVEL_WHO[c]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
