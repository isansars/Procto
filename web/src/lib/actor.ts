import { prisma } from "@/lib/prisma";
import type { ApprovalLevelKey, DemoRole } from "@/lib/domain";

/**
 * The prototype's "view as" demo bar lets the client pick which persona is
 * acting, with no real login. We keep that UX but resolve the persona to a
 * real seeded User server-side on every request, so RBAC/scoping decisions
 * (branch, department, approval level) are enforced from the database, not
 * trusted from the client beyond "which persona did you pick".
 */
export const PERSONA_SLUGS: Record<DemoRole, string | Record<ApprovalLevelKey, string>> = {
  requester: "dewi",
  approver: { dept: "budi", branch: "rina", finance: "agus", exec: "maya" },
  procurement: "sari",
  warehouse: "joko",
  management: "maya",
  mobile: "budi",
};

export function actorSlugFor(role: DemoRole, level?: ApprovalLevelKey | null): string {
  const entry = PERSONA_SLUGS[role];
  if (typeof entry === "string") return entry;
  return entry[level ?? "dept"];
}

export async function getActor(req: Request) {
  const slug = req.headers.get("x-actor") ?? "dewi";
  const user = await prisma.user.findUnique({
    where: { slug },
    include: { branch: true, department: true },
  });
  return user;
}

const VALID_ROLES: DemoRole[] = [
  "requester",
  "approver",
  "procurement",
  "warehouse",
  "management",
  "mobile",
];

/**
 * The top-level "view as" tab is distinct from the acting persona: the same
 * user (Maya Anggraini) plays both the Executive approver and the read-only
 * Management viewer, so the server needs to know which screen the client is
 * currently rendering, not just who is acting.
 */
export function getViewRole(req: Request): DemoRole {
  const raw = req.headers.get("x-view-role") as DemoRole | null;
  return raw && VALID_ROLES.includes(raw) ? raw : "requester";
}
