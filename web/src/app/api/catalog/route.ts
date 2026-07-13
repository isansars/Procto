import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rp } from "@/lib/domain";

export async function GET() {
  const items = await prisma.itemCatalogEntry.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      code: i.code,
      desc: i.desc,
      uom: i.uom,
      price: i.price,
      category: i.category,
      isCustom: i.isCustom,
      label: `${i.desc} — ${rp(i.price)}/${i.uom}`,
    })),
  });
}
