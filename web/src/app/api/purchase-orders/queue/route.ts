import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isActor, requireActor } from "@/lib/api";
import { formatDateID, rp } from "@/lib/domain";

// GET /api/purchase-orders/queue — approved PR lines not yet on a PO,
// grouped by their originating PR, for the Procurement intake screen.
export async function GET(req: Request) {
  const actor = await requireActor(req);
  if (!isActor(actor)) return actor;

  const prs = await prisma.purchaseRequest.findMany({
    where: {
      status: { in: ["APPROVED", "IN_PROCUREMENT"] },
      lines: { some: { status: "APPROVED", poLineId: null } },
    },
    include: { requester: true, branch: true, department: true, lines: { include: { item: true } } },
    orderBy: { createdAt: "desc" },
  });

  const groups = prs
    .map((pr) => {
      const lines = pr.lines.filter((l) => l.status === "APPROVED" && !l.poLineId);
      if (!lines.length) return null;
      return {
        id: pr.id,
        requester: pr.requester.name,
        branchDept: `${pr.branch.name} · ${pr.department.name}`,
        date: formatDateID(pr.createdAt),
        lines: lines.map((l) => ({
          id: l.id,
          desc: `${l.item.desc}  ·  ${l.item.category}`,
          qtyU: `${l.qty} ${l.item.uom} × ${rp(l.item.price)}`,
          totalFmt: rp(l.qty * l.item.price),
          totalRaw: l.qty * l.item.price,
        })),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  return NextResponse.json({ groups });
}
