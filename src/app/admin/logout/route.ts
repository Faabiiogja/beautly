import { isSameOriginRequest } from "@/lib/csrf";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return new Response("Forbidden", { status: 403 });
  }
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/admin/login", req.url), 303);
}