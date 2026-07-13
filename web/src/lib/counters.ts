import type { PrismaClient } from "@/generated/prisma/client";

export type CounterName = "PR" | "PO" | "GR" | "APV" | "ITEM";

const PREFIX: Record<CounterName, string> = {
  PR: "PR-2026-",
  PO: "PO-2026-",
  GR: "GR-2026-",
  APV: "APV-2026-",
  ITEM: "C",
};

/** Atomically claims the next sequence number for a counter and formats a business id. */
export async function nextBusinessId(prisma: PrismaClient, name: CounterName): Promise<string> {
  const updated = await prisma.counter.update({
    where: { name },
    data: { value: { increment: 1 } },
  });
  const n = updated.value - 1;
  const pad = name === "ITEM" ? 2 : 4;
  return PREFIX[name] + String(n).padStart(pad, "0");
}
