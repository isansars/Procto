import { NextResponse } from "next/server";
import { getActor } from "@/lib/actor";
import type { User, Branch, Department } from "@/generated/prisma/client";

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
export function forbidden(message = "Not allowed for this persona.") {
  return NextResponse.json({ error: message }, { status: 403 });
}
export function notFound(message = "Not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export type Actor = User & { branch: Branch | null; department: Department | null };

/** Resolves the acting persona from the `x-actor` header, or a 400 response. */
export async function requireActor(req: Request): Promise<Actor | NextResponse> {
  const actor = await getActor(req);
  if (!actor) return badRequest("Unknown persona — send a valid x-actor header.");
  return actor;
}

export function isActor(v: Actor | NextResponse): v is Actor {
  return !(v instanceof NextResponse);
}
