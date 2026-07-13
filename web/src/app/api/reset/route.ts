import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/lib/resetDatabase";

export async function POST() {
  await resetDatabase(prisma);
  return NextResponse.json({ ok: true });
}
