import type { ApprovalLevelKey, DemoRole } from "@/lib/domain";

/**
 * Client-side mirror of the seeded personas (names/titles only — no PII, no
 * secrets), so the demo bar and header can render instantly without a round
 * trip. The server independently resolves the same slugs against the DB on
 * every request and is the actual source of truth for RBAC/scoping.
 */
export type Persona = { slug: string; name: string; title: string };

export const ROLE_TABS: { role: DemoRole; label: string; sub: string }[] = [
  { role: "requester", label: "Requester", sub: "Dewi · JKT" },
  { role: "approver", label: "Approver", sub: "Budi / Rina / Agus" },
  { role: "procurement", label: "Procurement", sub: "Sari" },
  { role: "warehouse", label: "Warehouse", sub: "Joko · JKT" },
  { role: "management", label: "Management", sub: "Maya" },
  { role: "mobile", label: "Mobile approval", sub: "Budi" },
];

export const APPROVER_LEVEL_TABS: { level: ApprovalLevelKey; slug: string; name: string; title: string }[] = [
  { level: "dept", slug: "budi", name: "Budi Santoso", title: "Department Approver" },
  { level: "branch", slug: "rina", name: "Rina Wijaya", title: "Branch Manager" },
  { level: "finance", slug: "agus", name: "Agus Pratama", title: "Finance Approver" },
  { level: "exec", slug: "maya", name: "Maya Anggraini", title: "Executive" },
];

export const PERSONA_FOR_ROLE: Record<Exclude<DemoRole, "approver">, Persona> = {
  requester: { slug: "dewi", name: "Dewi Lestari", title: "Requester · Jakarta Pusat · Operasional" },
  procurement: { slug: "sari", name: "Sari Kusuma", title: "Procurement Officer · Head Office" },
  warehouse: { slug: "joko", name: "Joko Susilo", title: "Warehouse Staff · Gudang Jakarta Pusat" },
  management: { slug: "maya", name: "Maya Anggraini", title: "Executive · read-only, all branches" },
  mobile: { slug: "budi", name: "Budi Santoso", title: "Department Approver · on the go" },
};

export function personaFor(role: DemoRole, approverLevel: ApprovalLevelKey): Persona {
  if (role === "approver") {
    const found = APPROVER_LEVEL_TABS.find((t) => t.level === approverLevel)!;
    return { slug: found.slug, name: found.name, title: `${found.title} · acting` };
  }
  return PERSONA_FOR_ROLE[role];
}
