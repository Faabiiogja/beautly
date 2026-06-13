import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/platform/login", req.url), 303);
}
