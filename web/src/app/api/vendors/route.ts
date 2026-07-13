import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const vendors = await prisma.vendor.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({
    vendors: vendors.map((v) => ({
      id: v.id,
      label: v.name,
      name: v.name,
      category: v.category,
      paymentTerms: v.paymentTerms,
      meta: `${v.category} · ${v.paymentTerms}`,
    })),
  });
}
